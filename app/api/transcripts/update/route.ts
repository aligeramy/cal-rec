import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { bookingUid, transcript } = await req.json();

    if (!bookingUid || !transcript) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find the existing meeting transcript record
    const existingTranscript = await prisma.meetingTranscript.findUnique({
      where: { bookingUid },
    });

    if (!existingTranscript) {
      return NextResponse.json(
        { error: "Meeting transcript not found" },
        { status: 404 }
      );
    }

    // Update the transcript with the received transcript text
    const updatedTranscript = await prisma.meetingTranscript.update({
      where: { bookingUid },
      data: {
        transcript,
        status: "completed",
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      { 
        message: "Transcript updated successfully",
        id: updatedTranscript.id 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating transcript:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 