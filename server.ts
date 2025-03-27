import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

const blockedUsers = new Set<string>(); // Store blocked users

console.log("🚀 Server is running on http://localhost:8000");

// Run background monitoring every 2 seconds
setInterval(checkForViolations, 2000);

serve(async (req) => {
  try {
    const url = new URL(req.url, `http://${req.headers.get("host")}`);

    // Get query parameters
    const email = url.searchParams.get("email")?.trim();
    const phone = url.searchParams.get("phone")?.trim();
    const website = url.searchParams.get("url")?.trim();

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
  } catch (error) {
    return new Response(JSON.stringify({ message: "❌ Server Error", status: "error" }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// 🚨 Logs blocked users every 2 seconds
function checkForViolations() {
  if (blockedUsers.size > 0) {
    console.log("🚨 Blocked Users:", Array.from(blockedUsers));
  }
}

// 📌 Email Validation & Blocking
function validateEmail(email: string) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    blockedUsers.add(email);
    return { message: "❌ Invalid email blocked!", status: "error" };
  }
  return { message: "✅ Valid email!", status: "safe" };
}

// 📌 Phone Validation & Blocking
function validatePhone(phone: string) {
  const phoneRegex = /^[0-9]{10}$/; // Only exactly 10 digits allowed
  if (!phoneRegex.test(phone)) {
    blockedUsers.add(phone);
    return { message: "❌ Invalid phone number blocked!", status: "error" };
  }
  return { message: "✅ Valid phone number!", status: "safe" };
}

// 📌 Website URL Validation & Blocking
function validateWebsite(url: string) {
  const urlRegex = /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})([\/\w .-]*)*\/?$/i;
  if (!urlRegex.test(url)) {
    blockedUsers.add(url);
    return { message: "❌ Invalid website URL blocked!", status: "error" };
  }
  return { message: "✅ Valid website URL!", status: "safe" };
}
