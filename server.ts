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

// WebSocket Server for Push Notifications
const connectedClients = new Set<WebSocket>();

function sendPushNotification(message: string) {
  for (const client of connectedClients) {
    client.send(message);
  }
}

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

    if (email) return validateEmail(email);
    if (url) return validateWebsite(url);
    if (phone) return validatePhone(phone);
  }

  if (pathname === "/ws") {
    const { socket, response } = Deno.upgradeWebSocket(req);
    connectedClients.add(socket);
    socket.onclose = () => connectedClients.delete(socket);
    return response;
  }

  return jsonResponse("error", "❌ Invalid request!");
});
