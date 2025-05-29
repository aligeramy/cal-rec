import { NextResponse } from "next/server";

// This is a debug endpoint to help diagnose webhook issues
export async function POST(req: Request) {
  console.log("🔍 DEBUG WEBHOOK received");
  
  try {
    // Log all request headers
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log("📋 Headers:", JSON.stringify(headers, null, 2));
    
    // Log the request body
    const body = await req.text();
    console.log("📦 Body:", body);
    
    // Try to parse the body as JSON for better logging
    try {
      const jsonBody = JSON.parse(body);
      console.log("🔄 Parsed JSON:", JSON.stringify(jsonBody, null, 2));
    } catch {
      console.log("⚠️ Body is not valid JSON");
    }
    
    // Return all information for inspection
    return NextResponse.json({
      message: "Webhook debug information captured",
      headers,
      body: body.length > 1000 ? body.substring(0, 1000) + "..." : body,
    });
  } catch (error) {
    console.error("❌ Error debugging webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 