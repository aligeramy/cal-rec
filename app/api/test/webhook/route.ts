import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
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
  
  // Generate the signature
  const hmac = crypto.createHmac("sha256", webhookSecret);
  const signature = hmac.update(payloadString).digest("hex");
  
  // Provide the information for manual testing
  return NextResponse.json({
    message: "Use this information to test the webhook manually with cURL or Postman",
    curl_command: `curl -X POST ${process.env.NEXT_PUBLIC_URL || "https://cal.softx.ca"}/api/webhooks/cal -H "cal-signature: ${signature}" -H "Content-Type: application/json" -d '${payloadString}'`,
    webhook_url: `${process.env.NEXT_PUBLIC_URL || "https://cal.softx.ca"}/api/webhooks/cal`,
    headers: {
      "cal-signature": signature,
      "Content-Type": "application/json"
    },
    body: bookingCreatedPayload
  });
} 