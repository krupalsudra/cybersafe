import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

// ✅ Free External APIs for Fake Detection
const FREE_SPAM_CALL_DB = "https://scammer.info/api/phone/";
const LEAKED_EMAIL_API = "https://api.leakcheck.io/check?key=1aa966cec1397b3b48af57b9113cd1a43844e75f&email=";
const SAFE_BROWSING_API = "https://safebrowsing.googleapis.com/v4/threatMatches:find?key=AIzaSyDMb0G6Oc-msfdigMLBI76PE_oAb-Mbk0M"; // Replace with your API key// ✅ Utility function for JSON responses
const jsonResponse = (status: string, message: string) =>
  new Response(JSON.stringify({ status, message }), {
    headers: { "Content-Type": "application/json" },
  });

// ✅ Send Notification via Notifym
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
      ? jsonResponse("success", "✅ Notification sent!")
      : jsonResponse("error", "❌ Failed to send notification.");
  } catch (error) {
    return jsonResponse("error", "❌ Server error while sending notification.");
  }
}

// ✅ Check Fake Email
async function checkEmail(email: string) {
  const response = await fetch(`${LEAKED_EMAIL_API}${email}`);
  const data = await response.json();

  if (data.status === "found") {
    await sendPushNotification("⚠️ Spam Alert!", `Fake Email: ${email}`);
    return jsonResponse("alert", `⚠️ Fake Email Detected: ${email}`);
  }
  return jsonResponse("safe", `✅ Email is Safe: ${email}`);
}

// ✅ Check Fake Website
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

  const response = await fetch(SAFE_BROWSING_API, {
    method: "POST",
    body: JSON.stringify(requestBody),
    headers: { "Content-Type": "application/json" },
  });

  const data = await response.json();
  if (data.matches) {
    await sendPushNotification("⚠️ Security Alert!", `Unsafe Website: ${url}`);
    return jsonResponse("alert", `⚠️ Fake or Unsafe Website Detected: ${url}`);
  }
  return jsonResponse("safe", `✅ Website is Safe: ${url}`);
}

// ✅ Check Spam Phone Number
async function checkPhone(phone: string) {
  const response = await fetch(`${FREE_SPAM_CALL_DB}${phone}`);
  const data = await response.json();

  if (data.found) {
    await sendPushNotification("📢 Spam Call Alert!", `Spam Phone: ${phone}`);
    return jsonResponse("alert", `❌ Spam Phone Number Detected: ${phone}`);
  }
  return jsonResponse("safe", `✅ Phone Number is Safe: ${phone}`);
}

// ✅ Handle API Requests (One URL for All)
serve(async (req) => {
  const { pathname, searchParams } = new URL(req.url);

  if (pathname === "/") {
    return new Response(
      "✅ API is running! Use /check?email=test@example.com&url=http://example.com&phone=+1234567890",
      { headers: { "Content-Type": "text/plain" } },
    );
  }

  if (pathname === "/check") {
    const email = searchParams.get("email");
    const url = searchParams.get("url");
    const phone = searchParams.get("phone");

    let results = [];

    if (email) results.push(await checkEmail(email));
    if (url) results.push(await checkWebsite(url));
    if (phone) results.push(await checkPhone(phone));

    return new Response(JSON.stringify(results), { headers: { "Content-Type": "application/json" } });
  }

  return jsonResponse("error", "❌ Invalid request!");
});
