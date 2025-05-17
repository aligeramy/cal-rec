import { NextResponse } from "next/server";

// This endpoint helps register your webhook with Cal.com
export async function GET() {
  try {
    // Get the Cal.com API key
    const apiKey = process.env.CAL_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "CAL_API_KEY is not set in environment variables" },
        { status: 500 }
      );
    }
    
    // Get the webhook URL
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
    
    // Register webhook with Cal.com
    console.log("🔄 Attempting to register webhook with Cal.com");
    const response = await fetch("https://api.cal.com/v1/webhooks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subscriberUrl: webhookUrl,
        eventTriggers: [
          "BOOKING_CREATED",
          "BOOKING_RESCHEDULED",
          "BOOKING_CANCELLED",
          "MEETING_ENDED",
          "RECORDING_READY"
        ],
        active: true,
        secret: webhookSecret,
        apiKey: apiKey
      })
    });
    
    const responseData = await response.json();
    console.log("📝 Cal.com webhook registration response:", responseData);
    
    // Return information for follow-up
    return NextResponse.json({
      message: response.ok 
        ? "Webhook registration attempt completed" 
        : "Webhook registration failed",
      status: response.status,
      success: response.ok,
      response: responseData,
      webhookUrl,
      manual_instructions: {
        step1: "Go to your Cal.com dashboard",
        step2: "Navigate to Settings > Developer > Webhooks",
        step3: "Click 'Add new webhook'",
        step4: `Enter your webhook URL: ${webhookUrl}`,
        step5: "Select event triggers: BOOKING_CREATED, BOOKING_CANCELLED, MEETING_ENDED, RECORDING_READY",
        step6: `Enter your webhook secret: ${webhookSecret}`,
        step7: "Save the webhook"
      }
    });
  } catch (error) {
    console.error("❌ Error registering webhook:", error);
    return NextResponse.json(
      { error: "Internal server error", message: (error as Error).message },
      { status: 500 }
    );
  }
} 