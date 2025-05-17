import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    console.log("📝 Received transcript update from VPS");
    
    // Parse the request body
    const body = await req.json();
    console.log("📊 Received data:", JSON.stringify(body, null, 2));
    
    // Extract data
    const { bookingUid, transcript, transcript_json } = body;

    if (!bookingUid || (!transcript && !transcript_json)) {
      console.error("❌ Missing required fields:", { bookingUid, hasTranscript: !!transcript, hasTranscriptJson: !!transcript_json });
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
      console.error("❌ Meeting transcript not found for bookingUid:", bookingUid);
      return NextResponse.json(
        { error: "Meeting transcript not found" },
        { status: 404 }
      );
    }

    console.log("✅ Found existing transcript record:", existingTranscript.id);

    // Update the transcript record
    let updatedTranscript;
    
    if (transcript && transcript_json) {
      // Both text and JSON provided
      updatedTranscript = await prisma.meetingTranscript.update({
        where: { bookingUid },
        data: {
          transcript,
          transcriptJson: transcript_json,
          status: "completed",
          updatedAt: new Date()
        },
      });
    } else if (transcript) {
      // Only text provided
      updatedTranscript = await prisma.meetingTranscript.update({
        where: { bookingUid },
        data: {
          transcript,
          status: "completed",
          updatedAt: new Date()
        },
      });
    } else if (transcript_json) {
      // Only JSON provided
      updatedTranscript = await prisma.meetingTranscript.update({
        where: { bookingUid },
        data: {
          transcriptJson: transcript_json,
          status: "completed",
          updatedAt: new Date()
        },
      });
    }

    console.log("✅ Transcript updated successfully:", updatedTranscript?.id);

    return NextResponse.json(
      { 
        message: "Transcript updated successfully",
        id: updatedTranscript?.id 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error updating transcript:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 