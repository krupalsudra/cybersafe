import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

const FREE_SPAM_CALL_DB = "https://scammer.info/api/phone/";
const LEAKED_EMAIL_API = `https://api.leakcheck.io/check?key=${Deno.env.get("1aa966cec1397b3b48af57b9113cd1a43844e75f")}&email=`;
const SAFE_BROWSING_API = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${Deno.env.get("AIzaSyDMb0G6Oc-msfdigMLBI76PE_oAb-Mbk0M")}`;

const jsonResponse = (status: string, message: string) =>
  new Response(JSON.stringify({ status, message }), { headers: { "Content-Type": "application/json" } });

async function checkEmail(email: string) {
  const response = await fetch(`${LEAKED_EMAIL_API}${email}`);
  const data = await response.json();
  return data.status === "found" ? jsonResponse("alert", `⚠️ Fake Email: ${email}`) : jsonResponse("safe", `✅ Safe Email: ${email}`);
}

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
  return data.matches ? jsonResponse("alert", `⚠️ Unsafe Website: ${url}`) : jsonResponse("safe", `✅ Safe Website: ${url}`);
}

async function checkPhone(phone: string) {
  const response = await fetch(`${FREE_SPAM_CALL_DB}${phone}`);
  const data = await response.json();
  return data.found ? jsonResponse("alert", `❌ Spam Phone: ${phone}`) : jsonResponse("safe", `✅ Safe Phone: ${phone}`);
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

          <select id="type">
              <option value="email">Email</option>
              <option value="url">Website</option>
              <option value="phone">Phone</option>
          </select>
          
          <input type="text" id="input" placeholder="Enter email, website, or phone">
          <button onclick="checkData()">Check</button>

          <p id="result"></p>

          <script>
              async function checkData() {
                  const type = document.getElementById("type").value;
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
