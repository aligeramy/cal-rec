import { NextResponse } from "next/server";
import crypto from "crypto";

// This is a direct test using the provided webhook secret
export async function GET() {
  try {
    // Use the explicitly provided webhook secret for testing
    const webhookSecret = "kIcx1x5uamWgZQ3n00DHfodONd8Ga9RcX8YZZZDfP+o=";
    
    // Get the webhook endpoint URL
    const webhookUrl = process.env.NEXT_PUBLIC_URL 
      ? `${process.env.NEXT_PUBLIC_URL}/api/webhooks/cal` 
      : "https://cal.softx.ca/api/webhooks/cal";
    
    // Create a sample booking created event
    const bookingCreatedPayload = {
      triggerEvent: "BOOKING_CREATED",
      bookingUid: `test-${Date.now()}`,
      title: "Test Booking",
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      payload: {
        attendees: [
          { email: "client@example.com", name: "Test Client" }
        ],
        organizer: { email: "host@example.com", name: "Test Host" },
        location: "Zoom",
        description: "This is a test booking",
        eventType: { title: "Test Meeting" }
      }
    };
    
    const payloadString = JSON.stringify(bookingCreatedPayload);
    
    // Generate the signature using the explicitly provided webhook secret
    const hmac = crypto.createHmac("sha256", webhookSecret);
    hmac.update(payloadString);
    const signature = hmac.digest("hex");
    
    console.log("🧪 Testing webhook with provided webhook secret");
    console.log("🔐 Generated signature:", signature);
    
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
      message: "Direct webhook test completed",
      status: response.status,
      success: response.ok,
      response: responseData,
      requestDetails: {
        url: webhookUrl,
        headers: {
          "Content-Type": "application/json",
          "x-cal-signature-256": signature
        },
        body: bookingCreatedPayload
      }
    });
  } catch (error) {
    console.error("❌ Error testing webhook:", error);
    return NextResponse.json(
      { error: "Internal server error", message: (error as Error).message },
      { status: 500 }
    );
  }
} 