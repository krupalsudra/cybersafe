import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

const NUMVERIFY_API_KEY = Deno.env.get("5e2a3ffcf66a18e7cd53cae072b0a63c") || ""; 
const GOOGLE_SAFE_BROWSING_API_KEY = Deno.env.get("AIzaSyDMb0G6Oc-msfdigMLBI76PE_oAb-Mbk0M") || "";
const NUMVERIFY_API_URL = "http://apilayer.net/api/validate";
const blockedUsers = new Set();
const connectedClients = new Set();

// **Phone Number Validation**
async function validatePhone(phone) {
  try {
    const response = await fetch(`${NUMVERIFY_API_URL}?access_key=${NUMVERIFY_API_KEY}&number=${phone}&format=1`);
    const data = await response.json();

    if (!data.valid) {
      sendPushNotification("🚨 Fake Phone Number Detected!");
      blockUser("❌ Fake Phone Blocked!", phone);
      return jsonResponse("alert", "❌ Fake Phone Number Blocked!");
    }

    return jsonResponse("safe", `✅ Valid Phone Number: ${phone} (${data.country_name}, ${data.carrier})`);
  } catch (error) {
    return jsonResponse("error", "❌ Error validating phone number. Try again later.");
  }
}

// **Website Safety Check**
async function validateWebsite(url) {
  if (!url.startsWith("https://")) {
    sendPushNotification("🚨 Unsafe Website Detected!");
    blockUser("❌ Fake Website Blocked!", url);
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

    if (data.matches && Object.keys(data.matches).length > 0) {
      sendPushNotification("🚨 Fake Link Detected!");
      blockUser("❌ Fake Link Blocked!", url);
      return jsonResponse("alert", "❌ Fake Link Blocked!");
    }

    return jsonResponse("safe", `✅ Safe Website: ${url}`);
  } catch (error) {
    return jsonResponse("error", "❌ Error checking website safety. Try again later.");
  }
}

// **Block Users**
function blockUser(reason, clientId) {
  blockedUsers.add(clientId);
  sendPushNotification(reason);
  setTimeout(() => {
    for (const client of connectedClients) {
      if (blockedUsers.has(client.id)) {
        client.send("❌ You have been blocked!");
      }
    }
  }, 2000);
}

// **Send Push Notifications**
function sendPushNotification(message) {
  for (const client of connectedClients) {
    client.send(message);
  }
}

// **Helper Function for JSON Response**
function jsonResponse(status, message) {
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
    const url = searchParams.get("url");
    const phone = searchParams.get("phone");

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
