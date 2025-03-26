import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

const NUMVERIFY_API_KEY = "5e2a3ffcf66a18e7cd53cae072b0a63c"; // Replace with your Numverify API key
const GOOGLE_SAFE_BROWSING_API_KEY = "AIzaSyDMb0G6Oc-msfdigMLBI76PE_oAb-Mbk0M"; // Replace with Google Safe Browsing API key
const NUMVERIFY_API_URL = "http://apilayer.net/api/validate";
const GOOGLE_EMAIL_VERIFICATION_API = "https://emailvalidation.abstractapi.com/v1/?api_key=246131644673-f29qhp9n24emsmn9j6cmv66i399mke4l.apps.googleusercontent.com";

// **Real-Time Email Verification**
async function validateEmail(email: string) {
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
    return jsonResponse("alert", "❌ Invalid Email Format!");
  }

  try {
    const response = await fetch(`${GOOGLE_EMAIL_VERIFICATION_API}&email=${email}`);
    const data = await response.json();

    if (!data.is_valid) {
      sendPushNotification("🚨 Fake Email Detected!");
      return jsonResponse("alert", "❌ Invalid Email!");
    }

    return jsonResponse("safe", `✅ Valid Email: ${email}`);
  } catch (error) {
    return jsonResponse("error", "❌ Error validating email. Try again later.");
  }
}

// **Real-Time Phone Number Validation (Numverify API)**
async function validatePhone(phone: string) {
  if (!/^\d{10}$/.test(phone)) {
    return jsonResponse("alert", "❌ Phone number must be exactly 10 digits!");
  }

  try {
    const response = await fetch(`${NUMVERIFY_API_URL}?access_key=${NUMVERIFY_API_KEY}&number=${phone}&format=1`);
    const data = await response.json();

    if (!data.valid) {
      sendPushNotification("🚨 Fake Phone Number Detected!");
      return jsonResponse("alert", "❌ Fake Phone Number!");
    }

    return jsonResponse("safe", `✅ Valid Phone Number: ${phone} (${data.country_name}, ${data.carrier})`);
  } catch (error) {
    return jsonResponse("error", "❌ Error validating phone number. Try again later.");
  }
}

// **Fake Link Detection (Google Safe Browsing API)**
async function validateWebsite(url: string) {
  if (!url.startsWith("https://")) {
    return jsonResponse("alert", "❌ Unsafe Website! Only HTTPS is allowed.");
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
            threatEntries: [{ url }]
          }
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
  return new Response(JSON.stringify({ status, message }), { headers: { "Content-Type": "application/json" } });
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
