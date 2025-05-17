import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// Function to verify the webhook signature
function verifyCalcomWebhookSignature(
  payload: string,
  signature: string,
  secret: string
) {
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(payload).digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(digest),
    Buffer.from(signature)
  );
}

export async function POST(req: Request) {
  try {
    // Get the signature from the header
    const signature = req.headers.get("cal-signature");
    if (!signature) {
      return NextResponse.json(
        { error: "Missing Cal.com signature" },
        { status: 401 }
      );
    }

    // Get the webhook secret from environment variables
    const webhookSecret = process.env.CAL_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("CAL_WEBHOOK_SECRET is not set");
      return NextResponse.json(
        { error: "Server misconfiguration" },
        { status: 500 }
      );
    }

    // Get the raw body for verification
    const payload = await req.text();
    
    // Verify the signature
    const isValid = verifyCalcomWebhookSignature(
      payload,
      signature,
      webhookSecret
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    // Parse the JSON payload
    const data = JSON.parse(payload);

    // Check if this is a RECORDING_READY event
    if (data.triggerEvent !== "RECORDING_READY") {
      return NextResponse.json(
        { message: "Ignoring non-RECORDING_READY event" },
        { status: 200 }
      );
    }

    // Extract needed data
    const { 
      bookingUid, 
      title, 
      startTime,
      endTime,
      payload: eventPayload 
    } = data;

    // Extract more details if available
    const attendees = eventPayload?.attendees || [];
    const organizer = eventPayload?.organizer || {};
    const clientAttendee = attendees.find((a: { email: string }) => a.email !== organizer.email) || {};
    
    const clientName = clientAttendee.name;
    const clientEmail = clientAttendee.email;
    const hostName = organizer.name;
    const hostEmail = organizer.email;
    const location = eventPayload?.location;
    const notes = eventPayload?.description;
    const meetingType = eventPayload?.eventType?.title;
    
    // Calculate duration in minutes if both start and end times are available
    let duration = null;
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    }

    const downloadUrl = eventPayload?.downloadUrl;

    if (!bookingUid || !downloadUrl) {
      return NextResponse.json(
        { error: "Missing required fields in webhook payload" },
        { status: 400 }
      );
    }

    // Create or update meeting transcript record in database with all available information
    const transcript = await prisma.meetingTranscript.upsert({
      where: { bookingUid },
      update: { 
        title,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        status: "processing",
        clientName,
        clientEmail,
        hostName,
        hostEmail,
        duration,
        meetingType,
        location,
        notes,
        recordingUrl: downloadUrl
      },
      create: {
        bookingUid,
        title,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        status: "processing",
        clientName,
        clientEmail,
        hostName,
        hostEmail,
        duration,
        meetingType,
        location,
        notes,
        recordingUrl: downloadUrl
      }
    });

    // Send the recording to the VPS for processing
    const response = await fetch("https://transcribe.softx.ca/process", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        downloadUrl,
        bookingUid,
        title,
        startTime,
        endTime,
        clientName,
        clientEmail,
        callbackUrl: `${process.env.NEXT_PUBLIC_URL || "https://cal.softx.ca"}/api/transcripts/update`
      })
    });

    if (!response.ok) {
      // Update the transcript status to failed
      await prisma.meetingTranscript.update({
        where: { id: transcript.id },
        data: { status: "failed" }
      });

      console.error(`Failed to send to VPS: ${await response.text()}`);
      return NextResponse.json(
        { error: "Failed to process recording" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Webhook received and processing started", id: transcript.id },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing Cal.com webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 