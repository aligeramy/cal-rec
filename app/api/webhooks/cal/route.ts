import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

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
    const signature = req.headers.get("x-cal-signature-256");
    console.log("🔐 Signature:", signature);
    
    // Debug: Log all headers to see what Cal.com is sending
    console.log("📋 All headers:", Object.fromEntries([...req.headers.entries()]));
    
    if (!signature || !process.env.CAL_WEBHOOK_SECRET) {
      console.error("❌ Missing signature or webhook secret");
      console.log("Headers received:", Object.fromEntries([...req.headers.entries()]));
      return NextResponse.json(
        { error: "Missing signature or webhook secret" },
        { status: 401 }
      );
    }
    
    // Get the raw body for verification
    const rawBody = await req.text();
    console.log("📦 Raw webhook payload:", rawBody.substring(0, 200) + "...");
    
    const data = JSON.parse(rawBody);
    console.log("📊 Event type:", data.triggerEvent);
    
    // Generate HMAC directly like the working code
    const hmac = crypto.createHmac("sha256", process.env.CAL_WEBHOOK_SECRET);
    hmac.update(rawBody);
    const calculatedSignature = hmac.digest("hex");
    
    console.log("🔐 Calculated signature:", calculatedSignature);
    console.log("🔐 Received signature:", signature);
    
    // Compare signatures
    if (calculatedSignature !== signature) {
      console.error("❌ Signature mismatch");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }
    
    console.log("✅ Signature verified successfully");

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