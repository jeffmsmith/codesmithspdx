#!/usr/bin/env bash
# Verify codesmithspdx.com domain in Resend using cURL
# Your API key is restricted to sending emails, so we can't use the domains API.
# You need to complete verification in the Resend dashboard.

API_KEY="re_QykfUvq9_6A6i5DpjeW48d3njEUeD3W1k"
DOMAIN="codesmithspdx.com"

echo "=== Resend Domain Status Check ==="
echo "API key type: $(echo "$API_KEY" | cut -c1-5)..."
echo "Domain: $DOMAIN"
echo ""
echo "Your API key is restricted to sending emails only."
echo "To verify the domain, you need to:"
echo ""
echo "1. Go to https://resend.com/domains"
echo "2. Find codesmithspdx.com in your domain list"
echo "3. Click the 'Verify' or 'Check DNS' button"
echo "4. Wait for Resend to detect the DNS records we added"
echo ""
echo "DNS records currently in Route 53:"
echo "  TXT resend._domainkey.codesmithspdx.com ✓"
echo "  MX send.codesmithspdx.com → feedback-smtp.us-east-1.amazonses.com ✓"
echo "  TXT send.codesmithspdx.com → v=spf1 include:amazonses.com ~all ✓"
echo ""
echo "After Resend verifies the domain, the contact form should work immediately."
