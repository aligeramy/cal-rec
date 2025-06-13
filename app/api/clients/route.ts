import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get all clients from meeting transcripts
    const allClients = await prisma.meetingTranscript.findMany({
      where: {
        AND: [
          { clientName: { not: null } },
          { clientName: { not: '' } }
        ]
      },
      select: {
        clientName: true,
        clientEmail: true,
      },
      orderBy: {
        clientName: 'asc'
      }
    });

    // Group clients by email and merge them
    const clientMap = new Map<string, { name: string; email: string | null; count: number; id: string }>();
    
    allClients.forEach((client, index) => {
      if (!client.clientName || client.clientName.trim() === '') return;
      
      const email = client.clientEmail?.toLowerCase().trim() || null;
      const name = client.clientName.trim();
      
      // Create a more robust key for deduplication
      let key: string;
      if (email) {
        // If email exists, use it as the primary key
        key = `email:${email}`;
      } else {
        // If no email, use normalized name
        key = `name:${name.toLowerCase().replace(/\s+/g, ' ')}`;
      }
      
      if (!clientMap.has(key)) {
        clientMap.set(key, {
          name: name,
          email: email,
          count: 1,
          id: `client-${index}-${Date.now()}`
        });
      } else {
        // If we already have this email/name, merge the information
        const existing = clientMap.get(key)!;
        existing.count++;
        
        // Prefer entries with emails over those without
        if (!existing.email && email) {
          existing.email = email;
        }
        
        // Use the most complete name (prefer names with proper capitalization and longer names)
        if (name.length > existing.name.length || 
            (name.length === existing.name.length && name !== name.toLowerCase() && existing.name === existing.name.toLowerCase())) {
          existing.name = name;
        }
      }
    });

    // Convert map to array and create display names
    const uniqueClients = Array.from(clientMap.values())
      .map(client => ({
        id: client.id,
        name: client.name,
        email: client.email,
        displayName: client.email 
          ? `${client.name} (${client.email})`
          : client.name,
        count: client.count
      }))
      .sort((a, b) => {
        // Sort by frequency (most used first), then alphabetically
        if (a.count !== b.count) {
          return b.count - a.count;
        }
        return a.name.localeCompare(b.name);
      });

    console.log('📊 Returning clients:', uniqueClients.length, 'unique clients');
    console.log('📋 Client details:', uniqueClients.map(c => ({ name: c.name, email: c.email, count: c.count })));

    return NextResponse.json({
      success: true,
      clients: uniqueClients
    });

  } catch (error) {
    console.error('❌ Error fetching clients:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch clients',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
} 