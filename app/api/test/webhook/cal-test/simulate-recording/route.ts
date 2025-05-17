import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

// This endpoint simulates a RECORDING_READY event from Cal.com
export async function POST(req: Request) {
  try {
    // Parse request body for optional parameters
    let requestBody = {};
    try {
      requestBody = await req.json();
    } catch (e) {
      // Ignore parsing errors, use defaults
    }
    
    // Use the webhook secret for testing
    const webhookSecret = process.env.CAL_WEBHOOK_SECRET || "kIcx1x5uamWgZQ3n00DHfodONd8Ga9RcX8YZZZDfP+o=";
    
    // Get the webhook endpoint URL
    const webhookUrl = process.env.NEXT_PUBLIC_URL 
      ? `${process.env.NEXT_PUBLIC_URL}/api/webhooks/cal` 
      : "https://cal.softx.ca/api/webhooks/cal";
    
    // First, get a real booking ID from the database to use
    const existingTranscript = await prisma.meetingTranscript.findFirst({
      where: {
        status: "pending" // Find a pending transcript that needs processing
      },
      orderBy: {
        createdAt: "desc"
      }
    });
    
    if (!existingTranscript) {
      return NextResponse.json(
        { error: "No pending transcripts found to simulate recording for" },
        { status: 404 }
      );
    }
    
    // Use a real video URL for testing instead of example.com
    const realVideoUrl = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
    
    // Create a sample RECORDING_READY event
    const recordingReadyPayload = {
      triggerEvent: "RECORDING_READY",
      payload: {
        uid: existingTranscript.bookingUid,
        downloadUrl: realVideoUrl
      }
    };
    
    const payloadString = JSON.stringify(recordingReadyPayload);
    
    // Generate the signature
    const hmac = crypto.createHmac("sha256", webhookSecret);
    hmac.update(payloadString);
    const signature = hmac.digest("hex");
    
    console.log("🧪 Simulating RECORDING_READY webhook with signature:", signature);
    console.log("📦 Using payload:", payloadString);
    
    // Make the actual HTTP request to our webhook
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cal-signature-256": signature
      },
      body: payloadString
    });
    
    // Get the response
    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }
    
    return NextResponse.json({
      message: "RECORDING_READY simulation completed",
      status: response.status,
      success: response.ok,
      bookingUid: existingTranscript.bookingUid,
      videoUrl: realVideoUrl,
      response: responseData,
      debug_info: {
        url: webhookUrl,
        headers: {
          "Content-Type": "application/json",
          "x-cal-signature-256": signature
        },
        payload: recordingReadyPayload
      }
    });
  } catch (error) {
    console.error("❌ Error simulating RECORDING_READY webhook:", error);
    return NextResponse.json(
      { error: "Internal server error", message: (error as Error).message },
      { status: 500 }
    );
  }
}

// Also support GET for ease of testing
export async function GET() {
  return POST(new Request('https://cal.softx.ca', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: '{}'
  }));
} 