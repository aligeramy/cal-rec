import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  try {
    // Get the webhook endpoint URL
    const webhookUrl = process.env.NEXT_PUBLIC_URL 
      ? `${process.env.NEXT_PUBLIC_URL}/api/webhooks/cal` 
      : "https://cal.softx.ca/api/webhooks/cal";
      
    // Get the webhook secret
    const webhookSecret = process.env.CAL_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json(
        { error: "CAL_WEBHOOK_SECRET is not set in environment variables" },
        { status: 500 }
      );
    }
    
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
    
    // Generate the signature exactly as Cal.com does it
    const hmac = crypto.createHmac("sha256", webhookSecret);
    const signature = hmac.update(payloadString).digest("hex");
    
    // Make the actual HTTP request to our webhook
    console.log("🧪 Testing webhook with signature:", signature);
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "cal-signature": signature
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
      message: "Webhook test completed",
      status: response.status,
      success: response.ok,
      response: responseData,
      requestDetails: {
        url: webhookUrl,
        headers: {
          "Content-Type": "application/json",
          "cal-signature": signature
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