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

// Simple health check endpoint
export async function GET() {
  console.log("⚡ Webhook health check requested");
  const webhookSecret = process.env.CAL_WEBHOOK_SECRET ? "configured" : "missing";
  
  return NextResponse.json({
    status: "healthy",
    webhook_secret: webhookSecret,
    message: "Cal.com webhook endpoint is working. POST to this endpoint with proper Cal.com signature to process webhooks."
  });
}

export async function POST(req: Request) {
  console.log("🔔 Cal.com webhook received");
  
  try {
    // Get the signature from the header
    const signature = req.headers.get("cal-signature");
    if (!signature) {
      console.error("❌ Missing Cal.com signature header");
      console.log("Headers received:", Object.fromEntries([...req.headers.entries()]));
      return NextResponse.json(
        { error: "Missing Cal.com signature" },
        { status: 401 }
      );
    }
    
    console.log("✅ Signature header found:", signature);

    // Get the webhook secret from environment variables
    const webhookSecret = process.env.CAL_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("❌ CAL_WEBHOOK_SECRET is not set in environment variables");
      return NextResponse.json(
        { error: "Server misconfiguration" },
        { status: 500 }
      );
    }
    
    console.log("✅ Webhook secret found in environment");

    // Get the raw body for verification
    const payload = await req.text();
    console.log("📦 Received payload:", payload.substring(0, 200) + "...");
    
    // Verify the signature
    let isValid;
    try {
      isValid = verifyCalcomWebhookSignature(
        payload,
        signature,
        webhookSecret
      );
      console.log("🔐 Signature verification result:", isValid);
    } catch (error) {
      console.error("❌ Error verifying signature:", error);
      return NextResponse.json(
        { error: "Error verifying signature" },
        { status: 401 }
      );
    }

    if (!isValid) {
      console.error("❌ Invalid webhook signature");
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    // Parse the JSON payload
    const data = JSON.parse(payload);
    console.log("📊 Event type:", data.triggerEvent);
    console.log("📅 Booking UID:", data.bookingUid);

    // Handle different event types
    if (data.triggerEvent === "BOOKING_CREATED") {
      console.log("🆕 New booking created, saving to database");
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

      // Create booking record in database
      await prisma.meetingTranscript.upsert({
        where: { bookingUid },
        update: { 
          title,
          startTime: startTime ? new Date(startTime) : undefined,
          endTime: endTime ? new Date(endTime) : undefined,
          status: "pending",
          clientName,
          clientEmail,
          hostName,
          hostEmail,
          duration,
          meetingType,
          location,
          notes
        },
        create: {
          bookingUid,
          title,
          startTime: startTime ? new Date(startTime) : undefined,
          endTime: endTime ? new Date(endTime) : undefined,
          status: "pending",
          clientName,
          clientEmail,
          hostName,
          hostEmail,
          duration,
          meetingType,
          location,
          notes
        }
      });

      console.log("✅ Successfully saved booking to database");
      return NextResponse.json(
        { message: "Booking created successfully" },
        { status: 200 }
      );
    }
    
    // Check if this is a RECORDING_READY event
    if (data.triggerEvent === "RECORDING_READY") {
      console.log("🎥 Recording ready, processing for transcription");
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
        console.error("❌ Missing required fields in webhook payload", { bookingUid, hasDownloadUrl: !!downloadUrl });
        return NextResponse.json(
          { error: "Missing required fields in webhook payload" },
          { status: 400 }
        );
      }

      console.log("🔍 Found recording URL:", downloadUrl);

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

      console.log("✅ Updated database record with recording URL");

      // Send the recording to the VPS for processing
      console.log("🚀 Sending recording to transcription service");
      const callbackUrl = `${process.env.NEXT_PUBLIC_URL || "https://cal.softx.ca"}/api/transcripts/update`;
      console.log("📍 Using callback URL:", callbackUrl);
      
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
          callbackUrl
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Failed to send to transcription service: ${response.status} ${response.statusText}`, errorText);
        
        // Update the transcript status to failed
        await prisma.meetingTranscript.update({
          where: { id: transcript.id },
          data: { status: "failed" }
        });

        return NextResponse.json(
          { error: "Failed to process recording" },
          { status: 500 }
        );
      }

      console.log("✅ Successfully sent recording for transcription");
      return NextResponse.json(
        { message: "Webhook received and processing started", id: transcript.id },
        { status: 200 }
      );
    }

    console.log("ℹ️ Received unhandled event type:", data.triggerEvent);
    return NextResponse.json(
      { message: `Ignoring ${data.triggerEvent} event` },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error processing Cal.com webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 