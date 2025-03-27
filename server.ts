import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

console.log("🚀 Server running on Deno Deploy...");

function jsonResponse(data: object) {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  try {
    const url = new URL(req.url, `http://${req.headers.get("host")}`);

    const email = url.searchParams.get("email")?.trim() || "";
    const phone = url.searchParams.get("phone")?.trim() || "";
    const website = url.searchParams.get("url")?.trim() || "";

    // If all fields are empty, return error
    if (!email && !phone && !website) {
      return jsonResponse({ message: "❌ Invalid request! Provide email, phone, or URL.", status: "error" });
    }

    let response = {};

    if (email) response = validateEmail(email);
    if (phone) response = validatePhone(phone);
    if (website) response = validateWebsite(website);

    return jsonResponse(response);
  } catch (error) {
    return jsonResponse({ message: "❌ Server error!", status: "error" });
  }
});

// ✅ Email Validation
function validateEmail(email: string) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email)
    ? { message: "✅ Valid email!", status: "safe" }
    : { message: "❌ Invalid email!", status: "error" };
}

// ✅ Phone Validation (Only 10 Digits)
function validatePhone(phone: string) {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone)
    ? { message: "✅ Valid phone number!", status: "safe" }
    : { message: "❌ Invalid phone number! Must be exactly 10 digits.", status: "error" };
}

// ✅ Website URL Validation
function validateWebsite(url: string) {
  const urlRegex = /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})([\/\w .-]*)*\/?$/i;
  return urlRegex.test(url)
    ? { message: "✅ Valid website URL!", status: "safe" }
    : { message: "❌ Invalid website URL!", status: "error" };
}
