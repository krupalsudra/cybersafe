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
const connectedClients = new Set<WebSocket>();

function sendPushNotification(message: string) {
  for (const client of connectedClients) {
    client.send(message);
  }
}

serve(async (req) => {
  const { pathname, searchParams } = new URL(req.url);

  if (pathname === "/") {
    return new Response(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Cyber Security Checker</title>
          <style>
              body { 
                  font-family: Arial, sans-serif; 
                  text-align: center; 
                  padding: 20px; 
                  background: url('https://source.unsplash.com/1600x900/?cyber,security') no-repeat center center fixed; 
                  background-size: cover; 
                  color: white;
              }
              .container {
                  display: flex; 
                  flex-direction: column; 
                  align-items: center; 
                  gap: 20px; 
                  margin-top: 50px;
              }
              .box {
                  background: rgba(0, 0, 0, 0.7);
                  padding: 20px;
                  border-radius: 10px;
                  width: 400px;
                  box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
              }
              input, button {
                  padding: 10px;
                  margin: 10px;
                  font-size: 16px;
                  width: 100%;
                  border-radius: 5px;
                  border: none;
              }
              input { background: #222; color: white; }
              button {
                  background: #0f62fe; 
                  color: white; 
                  font-weight: bold; 
                  cursor: pointer;
                  transition: 0.3s;
              }
              button:hover { background: #0353e9; }
              #result-email, #result-phone, #result-website { 
                  font-weight: bold; 
                  margin-top: 10px; 
                  color: yellow; 
              }
              .error { color: red; font-weight: bold; }
          </style>
      </head>
      <body>
          <h1>🛡️ Cyber Security Checker</h1>
          <p>Check for fake emails, unsafe websites, and invalid phone numbers.</p>

          <div class="container">
              <div class="box">
                  <h3>📧 Check Email</h3>
                  <input type="text" id="email" placeholder="Enter email">
                  <button onclick="checkEmail()">Check Email</button>
                  <p id="result-email"></p>
              </div>

              <div class="box">
                  <h3>📞 Check Phone</h3>
                  <input type="text" id="phone" placeholder="Enter phone number">
                  <button onclick="checkPhone()">Check Phone</button>
                  <p id="result-phone"></p>
              </div>

              <div class="box">
                  <h3>🌐 Check Website</h3>
                  <input type="text" id="website" placeholder="Enter website URL">
                  <button onclick="checkWebsite()">Check Website</button>
                  <p id="result-website"></p>
              </div>
          </div>

          <script>
              async function checkEmail() {
                  const email = document.getElementById("email").value.trim();
                  const result = document.getElementById("result-email");

                  if (!email) {
                      result.innerHTML = "<span class='error'>❌ Please enter a valid email!</span>";
                      return;
                  }

                  const response = await fetch(\`/check?email=\${encodeURIComponent(email)}\`);
                  const data = await response.json();

                  result.innerHTML = data.message;
              }

              async function checkPhone() {
                  const phone = document.getElementById("phone").value.trim();
                  const result = document.getElementById("result-phone");

                  if (!phone) {
                      result.innerHTML = "<span class='error'>❌ Please enter a valid phone number!</span>";
                      return;
                  }

                  const response = await fetch(\`/check?phone=\${encodeURIComponent(phone)}\`);
                  const data = await response.json();

                  result.innerHTML = data.message;
              }

              async function checkWebsite() {
                  const website = document.getElementById("website").value.trim();
                  const result = document.getElementById("result-website");

                  if (!website) {
                      result.innerHTML = "<span class='error'>❌ Please enter a valid website URL!</span>";
                      return;
                  }

                  const response = await fetch(\`/check?url=\${encodeURIComponent(website)}\`);
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
