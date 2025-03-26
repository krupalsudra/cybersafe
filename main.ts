// ✅ Import required modules
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

// ✅ Notifym API Configuration
const NOTIFYM_API_URL = "https://ntfy.sh";
const NOTIFYM_AUTH_KEY = "tk_cycnmsip5nm3viywsslo7w7hoh911"; // Replace with your actual key

// ✅ Free External APIs for Fake Detection
const FREE_SPAM_CALL_DB = "https://scammer.info/api/phone/";
const LEAKED_EMAIL_API = "https://api.leakcheck.io/check?key=1aa966cec1397b3b48af57b9113cd1a43844e75f&email=";
const SAFE_BROWSING_API = "https://safebrowsing.googleapis.com/v4/threatMatches:find?key=AIzaSyDMb0G6Oc-msfdigMLBI76PE_oAb-Mbk0M"; // Replace with your API key

// ✅ Utility function for JSON responses with CORS
const jsonResponse = (status: string, message: string) =>
  new Response(JSON.stringify({ status, message }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*", // Allows API calls from any domain
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });

// ✅ Function to send push notifications via Notifym
async function sendPushNotification(title: string, message: string) {
  try {
    const response = await fetch(`${NOTIFYM_API_URL}/my_notifications`, {
      method: "POST",
      body: JSON.stringify({ title, message }),
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${NOTIFYM_AUTH_KEY}`,
      },
    });

    return response.ok
      ? jsonResponse("success", "✅ Notification sent successfully!")
      : jsonResponse("error", "❌ Failed to send notification.");
  } catch {
    return jsonResponse("error", "❌ Server error while sending notification.");
  }
}

// ✅ Function to check fake emails
async function checkEmail(email: string) {
  try {
    const response = await fetch(`${LEAKED_EMAIL_API}${email}`);
    const data = await response.json();

    if (data.status === "found") {
      await sendPushNotification("⚠️ Spam Alert!", `Fake or Leaked Email Detected: ${email}`);
      return jsonResponse("alert", "⚠️ Fake or Leaked Email Detected!");
    }

    return jsonResponse("safe", "✅ Email is Safe!");
  } catch {
    return jsonResponse("error", "❌ Error checking email.");
  }
}

// ✅ Function to check fake websites
async function checkWebsite(url: string) {
  const requestBody = {
    client: { clientId: "security-checker", clientVersion: "1.0" },
    threatInfo: {
      threatTypes: ["MALWARE", "SOCIAL_ENGINEERING"],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: [{ url }],
    },
  };

  try {
    const response = await fetch(SAFE_BROWSING_API, {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();

    if (data.matches) {
      await sendPushNotification("⚠️ Security Alert!", `Fake or Unsafe Website Detected: ${url}`);
      return jsonResponse("alert", "⚠️ Fake or Unsafe Website Detected!");
    }

    return jsonResponse("safe", "✅ Website is Safe!");
  } catch {
    return jsonResponse("error", "❌ Error checking website.");
  }
}

// ✅ Function to check spam phone numbers
async function checkPhone(phone: string) {
  try {
    const response = await fetch(`${FREE_SPAM_CALL_DB}${phone}`);
    const data = await response.json();

    if (data.found) {
      await sendPushNotification("📢 Spam Call Alert!", `Fake or Spam Phone Number: ${phone}`);
      return jsonResponse("alert", "❌ Fake or Spam Phone Number Detected!");
    }

    return jsonResponse("safe", "✅ Phone Number is Safe!");
  } catch {
    return jsonResponse("error", "❌ Error checking phone number.");
  }
}

// ✅ Handle incoming API requests in Deno Deploy
Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (req.method !== "POST") {
      return jsonResponse("error", "❌ Only POST requests are allowed!");
    }

    const { pathname } = new URL(req.url);
    const { email, url, phone } = await req.json();

    if (pathname === "/check_email" && email) return checkEmail(email);
    if (pathname === "/check_website" && url) return checkWebsite(url);
    if (pathname === "/check_phone" && phone) return checkPhone(phone);

    return jsonResponse("error", "❌ Invalid request!");
  } catch {
    return jsonResponse("error", "❌ Server error, please try again!");
  }
});
