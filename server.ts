import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

const blockedUsers = new Set<string>(); // Store blocked emails/phones/websites

console.log("Server is running on http://localhost:8000");

// Run monitoring every 2 seconds
setInterval(checkForViolations, 2000);

serve(async (req) => {
  const url = new URL(req.url);
  const email = url.searchParams.get("email");
  const phone = url.searchParams.get("phone");
  const website = url.searchParams.get("url");

  let response = { message: "Invalid request", status: "error" };

  if (email) {
    response = validateEmail(email);
  } else if (phone) {
    response = validatePhone(phone);
  } else if (website) {
    response = validateWebsite(website);
  }

  return new Response(JSON.stringify(response), {
    headers: { "Content-Type": "application/json" },
  });
});

// Background monitoring function (Runs every 2 sec)
function checkForViolations() {
  blockedUsers.forEach((user) => {
    console.log(`🚨 User blocked: ${user}`);
    // Implement actual blocking logic here (Firewall, database, etc.)
  });
}

// Email validation and blocking logic
function validateEmail(email: string) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    blockedUsers.add(email); // Block invalid emails
    return { message: "❌ Invalid email blocked!", status: "error" };
  }
  return { message: "✅ Valid email format!", status: "safe" };
}

// Phone validation and blocking logic
function validatePhone(phone: string) {
  const phoneRegex = /^[0-9]{10}$/;
  if (!phoneRegex.test(phone)) {
    blockedUsers.add(phone); // Block invalid phones
    return { message: "❌ Invalid phone blocked!", status: "error" };
  }
  return { message: "✅ Valid phone number!", status: "safe" };
}

// Website validation and blocking logic
function validateWebsite(url: string) {
  const urlRegex = /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})([\/\w .-]*)*\/?$/i;
  if (!urlRegex.test(url)) {
    blockedUsers.add(url); // Block invalid websites
    return { message: "❌ Invalid website blocked!", status: "error" };
  }
  return { message: "✅ Valid website URL!", status: "safe" };
}
