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

    // Get unique clients from meeting transcripts
    const clients = await prisma.meetingTranscript.findMany({
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
      distinct: ['clientEmail'],
      orderBy: {
        clientName: 'asc'
      }
    });

    // Filter and format the results
    const uniqueClients = clients
      .filter(client => client.clientName && client.clientName.trim() !== '')
      .map(client => ({
        name: client.clientName!,
        email: client.clientEmail || null,
        displayName: client.clientEmail 
          ? `${client.clientName} (${client.clientEmail})`
          : client.clientName!
      }));

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