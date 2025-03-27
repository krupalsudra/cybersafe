import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

console.log("🚀 Server is running on http://localhost:8000");

// Start the server
serve(async (req) => {
  const url = new URL(req.url, `http://${req.headers.get("host")}`);

  // Extract query parameters
  const email = url.searchParams.get("email");
  const phone = url.searchParams.get("phone");
  const website = url.searchParams.get("url");

  let response;

  if (email) {
    response = validateEmail(email);
  } else if (phone) {
    response = validatePhone(phone);
  } else if (website) {
    response = validateWebsite(website);
  } else {
    response = { message: "❌ Invalid request! Provide email, phone, or URL.", status: "error" };
  }

  return new Response(JSON.stringify(response), {
    headers: { "Content-Type": "application/json" },
  });
});

// ✅ Email Validation
function validateEmail(email: string) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return { message: "❌ Invalid email!", status: "error" };
  }
  return { message: "✅ Valid email!", status: "success" };
}

// ✅ Phone Validation (Only 10 digits allowed)
function validatePhone(phone: string) {
  const phoneRegex = /^[0-9]{10}$/;
  if (!phoneRegex.test(phone)) {
    return { message: "❌ Invalid phone number! Must be exactly 10 digits.", status: "error" };
  }
  return { message: "✅ Valid phone number!", status: "success" };
}

// ✅ Website URL Validation
function validateWebsite(url: string) {
  const urlRegex = /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})([\/\w .-]*)*\/?$/i;
  if (!urlRegex.test(url)) {
    return { message: "❌ Invalid website URL!", status: "error" };
  }
  return { message: "✅ Valid website URL!", status: "success" };
}
