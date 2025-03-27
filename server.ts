import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

const GOOGLE_SAFE_BROWSING_API_KEY = "YOUR_GOOGLE_SAFE_BROWSING_API_KEY";
const GOOGLE_EMAIL_VERIFICATION_API = "https://emailvalidation.googleapis.com/v1beta1/validate?key=YOUR_GOOGLE_EMAIL_API_KEY";

// **Real-Time Email Verification (Google Only)**
async function validateEmail(email: string) {
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
    return jsonResponse("alert", "❌ Invalid Email Format!");
  }

  try {
    const response = await fetch(GOOGLE_EMAIL_VERIFICATION_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!data.result || data.result.verdict !== "VALID") {
      sendPushNotification("🚨 Unsafe Email Detected!");
      return jsonResponse("alert", "❌ Unverified Email!");
    }

    return jsonResponse("safe", `✅ Verified Email: ${email}`);
  } catch (error) {
    return jsonResponse("error", "❌ Error verifying email. Try again later.");
  }
}

// **Phone Number Validation (Basic Format Check)**
async function validatePhone(phone: string) {
  if (!/^\d{10,15}$/.test(phone)) {
    return jsonResponse("alert", "❌ Phone number must be between 10-15 digits!");
  }
  
  return jsonResponse("safe", `✅ Phone Number Format is Valid: ${phone}`);
}

// **Website Safety Check (Google Safe Browsing API)**
async function validateWebsite(url: string) {
  if (!url.startsWith("https://")) {
    return jsonResponse("alert", "❌ Only HTTPS websites are allowed.");
  }

  try {
    const response = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${GOOGLE_SAFE_BROWSING_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: { clientId: "my-app", clientVersion: "1.0" },
          threatInfo: {
            threatTypes: ["MALWARE", "SOCIAL_ENGINEERING"],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url }],
          },
        }),
      }
    );

    const data = await response.json();

    if (data.matches) {
      sendPushNotification("🚨 Fake Link Detected!");
      return jsonResponse("alert", "❌ Fake Link Blocked!");
    }

    return jsonResponse("safe", `✅ Safe Website: ${url}`);
  } catch (error) {
    return jsonResponse("error", "❌ Error checking website safety. Try again later.");
  }
}

// **WebSocket Server for Real-Time Alerts**
const connectedClients = new Set<WebSocket>();

function sendPushNotification(message: string) {
  for (const client of connectedClients) {
    client.send(message);
  }
}

// **Helper function to send JSON responses**
function jsonResponse(status: string, message: string): Response {
  return new Response(JSON.stringify({ status, message }), {
    headers: { "Content-Type": "application/json" },
  });
}

// **Server API Handling**
serve(async (req) => {
  const { pathname, searchParams } = new URL(req.url);

  if (pathname === "/") {
    return new Response(await Deno.readTextFile("index.html"), {
      headers: { "Content-Type": "text/html" },
    });
  }

  if (pathname === "/check") {
    const email = searchParams.get("email");
    const url = searchParams.get("url");
    const phone = searchParams.get("phone");

    if (email) return await validateEmail(email);
    if (url) return await validateWebsite(url);
    if (phone) return await validatePhone(phone);
  }

  if (pathname === "/ws") {
    const { socket, response } = Deno.upgradeWebSocket(req);
    connectedClients.add(socket);
    socket.onclose = () => connectedClients.delete(socket);
    return response;
  }

  return jsonResponse("error", "❌ Invalid request!");
});
