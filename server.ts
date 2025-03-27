import express from "express";
import cors from "cors";
import dns from "dns";

const app = express();
app.use(cors());
const PORT = 3000;

// Function to validate email format
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Function to check if an email domain exists
function checkEmailDomain(email: string, callback: (isValid: boolean) => void) {
    const domain = email.split("@")[1];
    dns.resolveMx(domain, (err, addresses) => {
        callback(!err && addresses && addresses.length > 0);
    });
}

// Function to validate phone number (simple numeric check)
function isValidPhone(phone: string): boolean {
    return /^[0-9]{10}$/.test(phone);
}

// Function to validate URL
function isValidURL(url: string): boolean {
    try {
        new URL(url);
        return /^https?:\/\//.test(url);
    } catch (e) {
        return false;
    }
}

// API route for email validation
app.get("/check", (req, res) => {
    const { email, phone, url } = req.query;
    
    if (email) {
        if (!isValidEmail(email as string)) {
            return res.json({ status: "error", message: "❌ Invalid email format!" });
        }
        checkEmailDomain(email as string, (isValid) => {
            if (isValid) {
                res.json({ status: "safe", message: "✅ Valid email!" });
            } else {
                res.json({ status: "error", message: "❌ Email domain not found!" });
            }
        });
        return;
    }
    
    if (phone) {
        if (isValidPhone(phone as string)) {
            return res.json({ status: "safe", message: "✅ Valid phone number!" });
        } else {
            return res.json({ status: "error", message: "❌ Invalid phone number!" });
        }
    }
    
    if (url) {
        if (isValidURL(url as string)) {
            return res.json({ status: "safe", message: "✅ Valid website URL!" });
        } else {
            return res.json({ status: "error", message: "❌ Invalid website URL!" });
        }
    }
    
    res.json({ status: "error", message: "❌ No input provided!" });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
