import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

const blockedUsers = new Set<string>(); // Store blocked users

console.log("🚀 Server is running on http://localhost:8000");

// Run background monitoring every 2 seconds (24/7)
setInterval(checkForViolations, 2000);

serve(async (req) => {
  try {
    const url = new URL(req.url, `http://${req.headers.get("host")}`);
    const email = url.searchParams.get("email");
    const phone = url.searchParams.get("phone");
    const website = url.searchParams.get("url");

    if (!email && !phone && !website) {
      return jsonResponse("❌ Invalid request! Provide email, phone, or URL.", "error");
    }

    let response;
    if (email) response = validateEmail(email);
    if (phone) response = validatePhone(phone);
    if (website) response = validateWebsite(website);

    return jsonResponse(response.message, response.status);
  } catch (error) {
    console.error("❌ Server error:", error);
    return jsonResponse("❌ Server error!", "error");
  }
});

// 24/7 Monitoring: Logs blocked users every 2 seconds
function checkForViolations() {
  if (blockedUsers.size > 0) {
    console.log("🚨 Blocked Users:", Array.from(blockedUsers));
  }
}

// 📌 Email Validation & Blocking
function validateEmail(email: string) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    blockedUsers.add(email);
    return { message: "❌ Invalid email blocked!", status: "error" };
  }
  return { message: "✅ Valid email!", status: "safe" };
}

// 📌 Phone Validation & Blocking
function validatePhone(phone: string) {
  const phoneRegex = /^[0-9]{10,15}$/; // Accepts 10-15 digits
  if (!phoneRegex.test(phone)) {
    blockedUsers.add(phone);
    return { message: "❌ Invalid phone number blocked!", status: "error" };
  }
  return { message: "✅ Valid phone number!", status: "safe" };
}

// 📌 Website URL Validation & Blocking
function validateWebsite(url: string) {
  try {
    new URL(url); // Checks if it's a valid URL
    return { message: "✅ Valid website URL!", status: "safe" };
  } catch {
    blockedUsers.add(url);
    return { message: "❌ Invalid website URL blocked!", status: "error" };
  }
}

// Helper function for JSON response
function jsonResponse(message: string, status: string) {
  return new Response(
    JSON.stringify({ message, status }),
    { headers: { "Content-Type": "application/json" } }
  );
}
