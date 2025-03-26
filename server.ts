import "https://deno.land/x/dotenv/load.ts"; // Load environment variables
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

const FREE_SPAM_CALL_DB = "https://scammer.info/api/phone/";
const LEAKCHECK_API_KEY = Deno.env.get("LEAKCHECK_API_KEY") || "";
const GOOGLE_SAFE_BROWSING_KEY = Deno.env.get("GOOGLE_SAFE_BROWSING_KEY") || "";

const LEAKED_EMAIL_API = `https://api.leakcheck.io/check?key=${LEAKCHECK_API_KEY}&email=`;
const SAFE_BROWSING_API = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${GOOGLE_SAFE_BROWSING_KEY}`;

const jsonResponse = (status: string, message: string) =>
  new Response(JSON.stringify({ status, message }), { headers: { "Content-Type": "application/json" } });

function isValidEmail(email: string): boolean {
  return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email);
}

function isValidPhone(phone: string): boolean {
  return /^\d{10}$/.test(phone);
}

async function checkEmail(email: string) {
  if (!isValidEmail(email)) return jsonResponse("alert", "❌ Invalid email format or contains uppercase letters!");
  if (!LEAKCHECK_API_KEY) return jsonResponse("error", "❌ Missing LeakCheck API Key!");

  const response = await fetch(`${LEAKED_EMAIL_API}${email}`);
  const data = await response.json();

  return data.status === "found"
    ? jsonResponse("alert", `⚠️ Fake Email Detected: ${email}`)
    : jsonResponse("safe", `✅ Safe Email: ${email}`);
}

async function checkWebsite(url: string) {
  if (!GOOGLE_SAFE_BROWSING_KEY) return jsonResponse("error", "❌ Missing Google Safe Browsing API Key!");
  if (!url.startsWith("https://")) return jsonResponse("alert", "❌ HTTP sites are not safe!");

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

  return data.matches
    ? jsonResponse("alert", `⚠️ Unsafe Website Detected: ${url}`)
    : jsonResponse("safe", `✅ Safe Website: ${url}`);
}

async function checkPhone(phone: string) {
  if (!isValidPhone(phone)) return jsonResponse("alert", "❌ Phone number must be exactly 10 digits!");
  
  const response = await fetch(`${FREE_SPAM_CALL_DB}${phone}`);
  const data = await response.json();

  return data.found
    ? jsonResponse("alert", `❌ Spam Phone Number Detected: ${phone}`)
    : jsonResponse("safe", `✅ Safe Phone Number: ${phone}`);
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
          <title>Security Checker</title>
          <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
              input, button { padding: 10px; margin: 10px; font-size: 16px; }
              #result { font-weight: bold; margin-top: 20px; }
          </style>
      </head>
      <body>
          <h1>🛡️ Security Checker</h1>
          <p>Check spam calls, fake emails, and unsafe websites.</p>

          <input type="text" id="input" placeholder="Enter email, website, or phone">
          
          <br>
          <button onclick="checkData('email')">Check Email</button>
          <button onclick="checkData('phone')">Check Phone</button>
          <button onclick="checkData('url')">Check Website</button>

          <p id="result"></p>

          <script>
              async function checkData(type) {
                  const input = document.getElementById("input").value;
                  const result = document.getElementById("result");

                  if (!input) {
                      result.innerHTML = "❌ Please enter a valid input!";
                      return;
                  }

                  const response = await fetch(\`/check?\${type}=\${encodeURIComponent(input)}\`);
                  const data = await response.json();

                  result.innerHTML = data.message;
              }
          </script>
      </body>
      </html>
    `, { headers: { "Content-Type": "text/html" } });
  }

  if (pathname === "/check") {
    const email = searchParams.get("email");
    const url = searchParams.get("url");
    const phone = searchParams.get("phone");

    if (email) return await checkEmail(email);
    if (url) return await checkWebsite(url);
    if (phone) return await checkPhone(phone);
  }

  return jsonResponse("error", "❌ Invalid request!");
});
