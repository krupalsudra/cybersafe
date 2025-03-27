import streamlit as st
import re

# ✅ Email Validation Function
def validate_email(email):
    email_regex = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    if re.match(email_regex, email):
        return "✅ Valid Email!"
    return "❌ Invalid Email!"

# ✅ Phone Validation Function (Only 10 digits)
def validate_phone(phone):
    phone_regex = r"^\d{10}$"
    if re.match(phone_regex, phone):
        return "✅ Valid Phone Number!"
    return "❌ Invalid Phone Number! Must be exactly 10 digits."

# ✅ Website URL Validation Function
def validate_website(url):
    url_regex = r"^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})([\/\w .-]*)*\/?$"
    if re.match(url_regex, url):
        return "✅ Valid Website URL!"
    return "❌ Invalid Website URL!"

# 🎨 Streamlit UI
st.title("🔍 Validation Checker (Email, Phone, URL)")

# 📩 Email Validation
st.subheader("📧 Email Validation")
email = st.text_input("Enter Email:")
if st.button("Check Email"):
    st.success(validate_email(email))

# 📞 Phone Validation
st.subheader("📱 Phone Validation")
phone = st.text_input("Enter Phone Number (10 digits):")
if st.button("Check Phone"):
    st.success(validate_phone(phone))

# 🌍 Website Validation
st.subheader("🌎 Website Validation")
url = st.text_input("Enter Website URL:")
if st.button("Check URL"):
    st.success(validate_website(url))

# 🎉 Footer
st.markdown("---")
st.markdown("**Made with ❤️ using Streamlit**")
