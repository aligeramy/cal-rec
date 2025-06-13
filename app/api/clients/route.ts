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
    const clientMap = new Map<string, { name: string; email: string | null }>();
    
    allClients.forEach(client => {
      if (!client.clientName || client.clientName.trim() === '') return;
      
      const email = client.clientEmail?.toLowerCase().trim() || null;
      const name = client.clientName.trim();
      
      // Use email as key if available, otherwise use name
      const key = email || name.toLowerCase();
      
      if (!clientMap.has(key)) {
        clientMap.set(key, {
          name: name,
          email: email
        });
      } else {
        // If we already have this email/name, prefer the entry with the most complete information
        const existing = clientMap.get(key)!;
        
        // Prefer entries with emails over those without
        if (!existing.email && email) {
          existing.email = email;
        }
        
        // Use the longer/more complete name
        if (name.length > existing.name.length) {
          existing.name = name;
        }
      }
    });

    // Convert map to array and create display names
    const uniqueClients = Array.from(clientMap.values())
      .map(client => ({
        name: client.name,
        email: client.email,
        displayName: client.email 
          ? `${client.name} (${client.email})`
          : client.name
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

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