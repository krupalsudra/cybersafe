import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

const FAKE_EMAIL_DOMAINS = [
  "mailinator.com", "tempmail.com", "10minutemail.com", "fakeinbox.com", 
  "guerrillamail.com", "sharklasers.com", "maildrop.cc", "yopmail.com"
];

const jsonResponse = (status: string, message: string) =>
  new Response(JSON.stringify({ status, message }), { headers: { "Content-Type": "application/json" } });

function validateEmail(email: string) {
  if (email !== email.toLowerCase()) {
    return jsonResponse("alert", "⚠️ Email contains uppercase letters! It is not safe.");
  }

  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  if (!emailRegex.test(email)) {
    return jsonResponse("alert", "❌ Invalid email format!");
  }

  const domain = email.split("@")[1];
  if (FAKE_EMAIL_DOMAINS.includes(domain)) {
    return jsonResponse("alert", `❌ Fake Email Detected: ${email}`);
  }

  return jsonResponse("safe", `✅ Safe Email: ${email}`);
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
          <title>Email Checker</title>
          <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
              input, button { padding: 10px; margin: 10px; font-size: 16px; }
              #result { font-weight: bold; margin-top: 20px; color: blue; }
              .error { color: red; font-weight: bold; }
          </style>
      </head>
      <body>
          <h1>📧 Email Security Checker</h1>
          <p>Check if an email is fake or unsafe.</p>

          <input type="text" id="input" placeholder="Enter email">
          <br>
          <button onclick="checkEmail()">Check Email</button>

          <p id="result"></p>

          <script>
              async function checkEmail() {
                  const input = document.getElementById("input").value.trim();
                  const result = document.getElementById("result");
                  if (!input.includes("@")) {
                      result.innerHTML = "<span class='error'>❌ Invalid email format!</span>";
                      return;
                  }
                  const response = await fetch(\`/check?email=\${encodeURIComponent(input)}\`);
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
    if (email) return validateEmail(email);
  }

  return jsonResponse("error", "❌ Invalid request!");
});
