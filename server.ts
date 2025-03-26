import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

// Load API Keys from Environment Variables
const NUMVERIFY_API_KEY = Deno.env.get("5e2a3ffcf66a18e7cd53cae072b0a63c") || ""; 
const GOOGLE_SAFE_BROWSING_API_KEY = Deno.env.get("AIzaSyDMb0G6Oc-msfdigMLBI76PE_oAb-Mbk0M") || "";
const NUMVERIFY_API_URL = "http://apilayer.net/api/validate";

// Blocked Users List
const blockedUsers = new Set();
const connectedClients = new Set();

// **Validate Email Address**
function validateEmail(email: string): Response {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    sendPushNotification("🚨 Invalid Email Detected!");
    blockUser("❌ Invalid Email Blocked!", email);
    return jsonResponse("alert", "❌ Invalid Email Address!");
  }

  return jsonResponse("safe", `✅ Valid Email Address: ${email}`);
}

// **Validate Phone Number**
async function validatePhone(phone: string): Promise<Response> {
  try {
    const response = await fetch(`${NUMVERIFY_API_URL}?access_key=${NUMVERIFY_API_KEY}&number=${phone}&format=1`);
    const data = await response.json();

    if (!data.valid) {
      sendPushNotification("🚨 Fake Phone Number Detected!");
      blockUser("❌ Fake Phone Blocked!", phone);
      return jsonResponse("alert", "❌ Invalid or Fake Phone Number!");
    }

    return jsonResponse("safe", `✅ Valid Phone: ${phone} (${data.country_name}, ${data.carrier})`);
  } catch (error) {
    return jsonResponse("error", "❌ Error validating phone number. Try again later.");
  }
}

// **Validate Website Safety**
async function validateWebsite(url: string): Promise<Response> {
  if (!url.startsWith("https://")) {
    sendPushNotification("🚨 Unsafe Website Detected!");
    blockUser("❌ Unsafe Website Blocked!", url);
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
      sendPushNotification("🚨 Fake Website Detected!");
      blockUser("❌ Fake Website Blocked!", url);
      return jsonResponse("alert", "❌ Fake Website Blocked!");
    }

    return jsonResponse("safe", `✅ Safe Website: ${url}`);
  } catch (error) {
    return jsonResponse("error", "❌ Error checking website safety. Try again later.");
  }
}

// **Block Users**
function blockUser(reason: string, clientId: string) {
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
function sendPushNotification(message: string) {
  for (const client of connectedClients) {
    client.send(message);
  }
}

// **Helper Function for JSON Response**
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
    const url = searchParams.get("url");
    const phone = searchParams.get("phone");
    const email = searchParams.get("email");

    if (email) return validateEmail(email);
    if (phone) return await validatePhone(phone);
    if (url) return await validateWebsite(url);
  }

  if (pathname === "/ws") {
    const { socket, response } = Deno.upgradeWebSocket(req);
    connectedClients.add(socket);
    socket.onclose = () => connectedClients.delete(socket);
    return response;
  }

  return jsonResponse("error", "❌ Invalid request!");
});
