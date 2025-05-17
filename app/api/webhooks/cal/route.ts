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

    // Process the webhook based on the type
    const { triggerEvent, payload: eventPayload } = data;
    console.log("📊 Event type:", triggerEvent);
    console.log("📦 Event payload:", eventPayload);

    if (triggerEvent === "BOOKING_CREATED") {
      console.log("🆕 New booking created, saving to database");
      
      // Extract fields matching your previous working code
      const { uid, title, startTime, endTime, organizer, location, metadata, conferenceData } = eventPayload;
      console.log("📝 New booking details:", { uid, title, startTime, endTime });
      
      // Extract meeting link - could be Google Meet, Zoom, etc.
      let meetingLink = null;
      
      // Check for conference data (Google Meet, Zoom, etc.)
      if (conferenceData?.entryPoints?.length > 0) {
        // Find video entry point
        const videoEntry = conferenceData.entryPoints.find((ep: { entryPointType: string, uri: string }) => ep.entryPointType === 'video');
        if (videoEntry) {
          meetingLink = videoEntry.uri;
          console.log('🔗 Found meeting link from conferenceData:', meetingLink);
        }
      }
      
      // If no conferenceData, check location for meeting URLs
      if (!meetingLink && location) {
        // Check if location is a URL
        if (location.startsWith('http') || location.includes('meet.google.com') || location.includes('zoom.us')) {
          meetingLink = location;
          console.log('🔗 Found meeting link from location:', meetingLink);
        }
      }
      
      // If still no link, check metadata for custom fields
      if (!meetingLink && metadata?.videoCallUrl) {
        meetingLink = metadata.videoCallUrl;
        console.log('🔗 Found meeting link from metadata:', meetingLink);
      }
      
      // Extract client/attendee info
    const attendees = eventPayload?.attendees || [];
      const clientAttendee = attendees.find((a: { email: string }) => a.email !== organizer.email) || {};
    
    const clientName = clientAttendee.name;
    const clientEmail = clientAttendee.email;
    const hostName = organizer.name;
    const hostEmail = organizer.email;
    const notes = eventPayload?.description;
    const meetingType = eventPayload?.eventType?.title;
    
    // Calculate duration in minutes if both start and end times are available
    let duration = null;
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    }

      // Create booking record in database - use meeting transcript table
    const transcript = await prisma.meetingTranscript.upsert({
        where: { bookingUid: uid },
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
          location: meetingLink || location, // Use meeting link if available
          notes
      },
      create: {
          bookingUid: uid,
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
          location: meetingLink || location, // Use meeting link if available
          notes
        }
      });

      console.log("✅ Successfully saved booking to database:", transcript.id);
      return NextResponse.json(
        { message: "Booking created successfully", id: transcript.id },
        { status: 200 }
      );
    } 
    else if (triggerEvent === "BOOKING_CANCELLED") {
      // Meeting was cancelled
      const { uid } = eventPayload;
      console.log("❌ Booking cancelled:", uid);
      
      // Find the meeting transcript
      const transcript = await prisma.meetingTranscript.findUnique({
        where: { bookingUid: uid },
      });
      
      if (transcript) {
        console.log("🔍 Found transcript to cancel:", transcript.id);
        // Update status to cancelled
        await prisma.meetingTranscript.update({
          where: { id: transcript.id },
          data: { status: "cancelled" }
        });
        console.log("✅ Transcript marked as cancelled");
      } else {
        console.log("❓ No transcript found for cancellation");
      }
      
      return NextResponse.json({ 
        message: "Booking cancellation processed",
        success: true 
      });
    }
    else if (triggerEvent === "MEETING_ENDED") {
      // Meeting has ended
      const { uid } = eventPayload;
      console.log("🏁 Meeting ended:", uid);
      
      // Find the transcript
      const transcript = await prisma.meetingTranscript.findUnique({
        where: { bookingUid: uid },
      });
      
      if (transcript) {
        console.log("🔍 Found transcript to update end time:", transcript.id);
        // Update the transcript end time
        const updated = await prisma.meetingTranscript.update({
          where: { id: transcript.id },
          data: { 
            endTime: new Date(),
            status: transcript.status === "pending" ? "completed" : transcript.status
      }
    });
        console.log("✅ Transcript updated:", updated.id);
      } else {
        console.log("❓ No transcript found to update end time");
      }
      
      return NextResponse.json({ 
        message: "Meeting end processed",
        success: true 
      });
    }
    // Check if this is a RECORDING_READY event
    else if (triggerEvent === "RECORDING_READY") {
      console.log("🎥 Recording ready, processing for transcription");
      // Extract needed data
      const { 
        uid 
      } = eventPayload;

      if (!uid) {
        console.error("❌ Missing required fields in webhook payload", { uid });
        return NextResponse.json(
          { error: "Missing required fields in webhook payload" },
          { status: 400 }
        );
      }

      console.log("🔍 Cal.com notified us that a recording is ready for booking:", uid);

      // Update meeting transcript record with recording status
      const transcript = await prisma.meetingTranscript.findUnique({
        where: { bookingUid: uid },
      });

      if (!transcript) {
        console.error("❌ No transcript found for recording:", uid);
        return NextResponse.json(
          { error: "No transcript found for this recording" },
          { status: 404 }
        );
      }

      // Set status to processing while we fetch the recording
      await prisma.meetingTranscript.update({
        where: { id: transcript.id },
        data: { 
          status: "processing"
        }
      });

      console.log("✅ Updated database record status to processing:", transcript.id);

      // Fetch the recording download link from Cal.com API
      console.log("🔄 Fetching recording download link from Cal.com API");
      const calApiKey = process.env.CALCOM_API || process.env.CAL_API_KEY;
      
      if (!calApiKey) {
        console.error("❌ Cal.com API key not found in environment variables");
        
        // Update status to failed
        await prisma.meetingTranscript.update({
          where: { id: transcript.id },
          data: { status: "failed" }
        });
        
        return NextResponse.json(
          { error: "Cal.com API key missing" },
          { status: 500 }
        );
      }
      
      // Make API call to Cal.com to get recording download links
      const recordingsResponse = await fetch(`https://api.cal.com/v1/bookings/${uid}/recordings?apiKey=${calApiKey}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      
      if (!recordingsResponse.ok) {
        console.error(`❌ Failed to fetch recordings from Cal.com API: ${recordingsResponse.status} ${recordingsResponse.statusText}`);
        
        // Update status to failed
        await prisma.meetingTranscript.update({
          where: { id: transcript.id },
          data: { status: "failed" }
        });
        
        return NextResponse.json(
          { error: "Failed to fetch recording from Cal.com" },
          { status: 500 }
        );
      }
      
      const recordings = await recordingsResponse.json();
      console.log("📋 Recordings data:", JSON.stringify(recordings, null, 2));
      
      if (!recordings || recordings.length === 0) {
        console.error("❌ No recordings found for this booking");
        
        // Update status to failed
        await prisma.meetingTranscript.update({
          where: { id: transcript.id },
          data: { status: "failed" }
        });
        
        return NextResponse.json(
          { error: "No recordings found for this booking" },
          { status: 404 }
        );
      }
      
      // Get the first recording's download link
      const downloadUrl = recordings[0].download_link;
      
      if (!downloadUrl) {
        console.error("❌ No download link found in the recording data");
        
        // Update status to failed
        await prisma.meetingTranscript.update({
          where: { id: transcript.id },
          data: { status: "failed" }
        });
        
        return NextResponse.json(
          { error: "No download link found in the recording data" },
          { status: 500 }
        );
      }

      // Update the transcript with recording URL
      const updated = await prisma.meetingTranscript.update({
        where: { id: transcript.id },
        data: { 
          recordingUrl: downloadUrl
        }
      });

      console.log("✅ Updated database record with recording URL:", updated.id);

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
          bookingUid: uid,
          title: transcript.title,
          startTime: transcript.startTime,
          endTime: transcript.endTime,
          clientName: transcript.clientName,
          clientEmail: transcript.clientEmail,
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
      return NextResponse.json({
        message: "Recording processing started", 
        id: transcript.id
      });
    }

    console.log("ℹ️ Received unhandled event type:", triggerEvent);
    return NextResponse.json({
      message: `Processed ${triggerEvent} event`,
      success: true
    });
  } catch (error) {
    console.error("❌ Error processing Cal.com webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 