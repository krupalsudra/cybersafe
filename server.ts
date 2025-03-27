import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { lookup } from "https://deno.land/x/dns/mod.ts";

// **Email Validation Without API**
async function validateEmail(email: string) {
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
    return jsonResponse("alert", "❌ Invalid Email Format!");
  }

  const domain = email.split("@")[1];
  try {
    const mxRecords = await lookup(domain, "MX");
    if (mxRecords.length > 0) {
      return jsonResponse("safe", `✅ Valid Email: ${email}`);
    }
  } catch (error) {
    return jsonResponse("alert", "❌ Invalid Email (Domain not found)!");
  }
  return jsonResponse("alert", "❌ Email domain does not exist!");
}

// **Phone Number Validation Without API**
function validatePhone(phone: string) {
  if (!/^\d{10}$/.test(phone)) {
    return jsonResponse("alert", "❌ Phone number must be exactly 10 digits!");
  }
  return jsonResponse("safe", `✅ Valid Phone Number: ${phone}`);
}

// **Website URL Validation Without API**
function validateWebsite(url: string) {
  try {
    const parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return jsonResponse("alert", "❌ Unsafe Website! Must use HTTP or HTTPS.");
    }
    return jsonResponse("safe", `✅ Safe Website: ${url}`);
  } catch (error) {
    return jsonResponse("alert", "❌ Invalid Website URL!");
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
    if (url) return validateWebsite(url);
    if (phone) return validatePhone(phone);
  }

  return jsonResponse("error", "❌ Invalid request!");
});
