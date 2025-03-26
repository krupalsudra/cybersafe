import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

const FAKE_EMAIL_DOMAINS = [
  "mailinator.com", "tempmail.com", "10minutemail.com", "fakeinbox.com", 
  "guerrillamail.com", "sharklasers.com", "maildrop.cc", "yopmail.com"
];

const jsonResponse = (status: string, message: string) =>
  new Response(JSON.stringify({ status, message }), { headers: { "Content-Type": "application/json" } });

function validateEmail(email: string) {
  if (email !== email.toLowerCase()) {
    sendPushNotification("⚠️ Email contains uppercase letters! It is not safe.");
    return jsonResponse("alert", "⚠️ Email contains uppercase letters! It is not safe.");
  }

  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  if (!emailRegex.test(email)) {
    sendPushNotification("❌ Invalid email format!");
    return jsonResponse("alert", "❌ Invalid email format!");
  }

  const domain = email.split("@")[1];
  if (FAKE_EMAIL_DOMAINS.includes(domain)) {
    sendPushNotification(`❌ Fake Email Detected: ${email}`);
    return jsonResponse("alert", `❌ Fake Email Detected: ${email}`);
  }

  return jsonResponse("safe", `✅ Safe Email: ${email}`);
}

function validatePhone(phone: string) {
  if (!/^\d{10}$/.test(phone)) {
    sendPushNotification("❌ Phone number must be exactly 10 digits!");
    return jsonResponse("alert", "❌ Phone number must be exactly 10 digits!");
  }

  return jsonResponse("safe", `✅ Safe Phone Number: ${phone}`);
}

function validateWebsite(url: string) {
  if (!url.startsWith("https://")) {
    sendPushNotification(`❌ Unsafe Website Detected: ${url}`);
    return jsonResponse("alert", "❌ Unsafe Website! Only HTTPS is allowed.");
  }

  return jsonResponse("safe", `✅ Safe Website: ${url}`);
}

// Function to Send Push Notifications
function sendPushNotification(message: string) {
  const clients = connectedClients;
  clients.forEach(client => {
    client.postMessage(message);
  });
}

const connectedClients = new Set<WebSocket>();

serve(async (req) => {
  const { pathname, searchParams } = new URL(req.url);

  if (pathname === "/") {
    return new Response(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Security Checker</title>
          <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
              input, button { padding: 10px; margin: 10px; font-size: 16px; }
              #result { font-weight: bold; margin-top: 20px; color: blue; }
              .error { color: red; font-weight: bold; }
          </style>
      </head>
      <body>
          <h1>🛡️ Security Checker</h1>
          <p>Check for fake emails, unsafe websites, and invalid phone numbers.</p>

          <input type="text" id="input" placeholder="Enter email, website, or phone">
          <br>
          <button onclick="checkData()">Check</button>

          <p id="result"></p>

          <script>
              async function checkData() {
                  const input = document.getElementById("input").value.trim();
                  const result = document.getElementById("result");

                  if (!input) {
                      result.innerHTML = "<span class='error'>❌ Please enter a valid input!</span>";
                      return;
                  }

                  let type = "";
                  if (input.includes("@")) {
                      type = "email";
                  } else if (/^https?:\/\//.test(input)) {
                      type = "url";
                  } else if (/^\d+$/.test(input)) {
                      type = "phone";
                  } else {
                      result.innerHTML = "<span class='error'>❌ Invalid input type!</span>";
                      return;
                  }

                  const response = await fetch(\`/check?\${type}=\${encodeURIComponent(input)}\`);
                  const data = await response.json();

                  result.innerHTML = data.message;
              }

              // WebSocket connection for Push Notifications
              const ws = new WebSocket("ws://localhost:8000/ws");
              ws.onmessage = (event) => {
                  alert("🔔 Notification: " + event.data);
              };
          </script>
      </body>
      </html>
    `, { headers: { "Content-Type": "text/html" } });
  }

  if (pathname === "/check") {
    const email = searchParams.get("email");
    const url = searchParams.get("url");
    const phone = searchParams.get("phone");

    if (email) return validateEmail(email);
    if (url) return validateWebsite(url);
    if (phone) return validatePhone(phone);
  }

  return jsonResponse("error", "❌ Invalid request!");
});

// WebSocket Server for Push Notifications
const wsServer = new WebSocket("ws://localhost:8000/ws");
wsServer.onopen = () => console.log("WebSocket connected for push notifications.");
wsServer.onmessage = (event) => console.log("Notification sent: ", event.data);
