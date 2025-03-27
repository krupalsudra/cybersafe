import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

const blockedUsers = new Set<string>(); // Stores blocked users
console.log("🚀 Server is running on http://localhost:8000");

// 24/7 Monitoring: Logs blocked users every 2 seconds
setInterval(() => {
  if (blockedUsers.size > 0) {
    console.log("🚨 Blocked Users:", Array.from(blockedUsers));
  }
}, 2000);

serve(async (req) => {
  const url = new URL(req.url, `http://${req.headers.get("host")}`);
  const email = url.searchParams.get("email");
  const phone = url.searchParams.get("phone");
  const website = url.searchParams.get("url");

  if (!email && !phone && !website) {
    return sendResponse("❌ Invalid request! Provide email, phone, or URL.", "error");
  }

  if (email) return sendResponse(validateEmail(email));
  if (phone) return sendResponse(validatePhone(phone));
  if (website) return sendResponse(validateWebsite(website));

  return sendResponse("❌ Unknown error!", "error");
});

// 📌 Email Validation & Blocking
function validateEmail(email: string) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    blockedUsers.add(email);
    return { message: "❌ Invalid email blocked!", status: "error" };
  }
  return { message: "✅ Valid email!", status: "safe" };
}

// 📌 Phone Validation (EXACTLY 10 DIGITS)
function validatePhone(phone: string) {
  const phoneRegex = /^[0-9]{10}$/; // Exactly 10 digits
  if (!phoneRegex.test(phone)) {
    blockedUsers.add(phone);
    return { message: "❌ Invalid phone number blocked! Must be exactly 10 digits.", status: "error" };
  }
  return { message: "✅ Valid phone number!", status: "safe" };
}

// 📌 Website URL Validation & Blocking
function validateWebsite(url: string) {
  try {
    const hostname = new URL(url).hostname; // Extracts domain
    if (!hostname.includes(".")) throw new Error();
    return { message: "✅ Valid website URL!", status: "safe" };
  } catch {
    blockedUsers.add(url);
    return { message: "❌ Invalid website URL blocked!", status: "error" };
  }
}

// 📌 Response Helper
function sendResponse(message: string, status: string = "safe") {
  return new Response(JSON.stringify({ message, status }), {
    headers: { "Content-Type": "application/json" },
  });
}
