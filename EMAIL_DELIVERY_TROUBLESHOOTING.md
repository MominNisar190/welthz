# Email Delivery Troubleshooting Guide

## Issue: Email Sent Successfully But Not Received

### Symptoms
- ✅ Success message: "Report sent successfully!"
- ✅ Shows email address in confirmation
- ❌ Email not in inbox
- ❌ Email not in spam/junk folder

## Root Cause
Using Resend's default test email `onboarding@resend.dev` has limitations:
- May be blocked by some email providers
- Lower deliverability rate
- Not suitable for production use

## Quick Fixes

### Fix 1: Check Spam/Junk Folder
1. Open Gmail
2. Click "Spam" or "Junk" in left sidebar
3. Search for "welth" or "financial report"
4. If found, mark as "Not Spam"

### Fix 2: Check Resend Dashboard
1. Go to: https://resend.com/emails
2. Login with your account
3. Check "Emails" tab
4. Look for your sent email
5. Check delivery status:
   - ✅ Delivered
   - ⏳ Pending
   - ❌ Failed

### Fix 3: Add Sender to Contacts
1. Add `onboarding@resend.dev` to Gmail contacts
2. Try sending report again
3. Should improve deliverability

## Permanent Solution: Verify Your Domain

### Step 1: Add Domain to Resend
1. Go to: https://resend.com/domains
2. Click "Add Domain"
3. Enter your domain (e.g., `yourdomain.com`)
4. Click "Add"

### Step 2: Add DNS Records
Resend will provide DNS records like:
```
Type: TXT
Name: _resend
Value: resend-verify=abc123...

Type: MX
Name: @
Value: feedback-smtp.resend.com
Priority: 10

Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
```

Add these to your domain's DNS settings (GoDaddy, Namecheap, Cloudflare, etc.)

### Step 3: Wait for Verification
- Usually takes 5-10 minutes
- Check status at https://resend.com/domains
- Status should change to "Verified"

### Step 4: Update Sender Email
Once verified, update `actions/send-email.js`:

```javascript
// Before
from: "Finance App <onboarding@resend.dev>",

// After (use your domain)
from: "Welth Finance <noreply@yourdomain.com>",
```

## Alternative: Use Gmail SMTP (Not Recommended)

If you don't have a domain, you could use Gmail SMTP, but it's not recommended for production:
- Limited to 500 emails/day
- May be marked as spam
- Less reliable
- Against Gmail TOS for automated emails

## Testing Email Delivery

### Test 1: Send to Different Email
Try sending to:
- Gmail account
- Yahoo account
- Outlook account
- Work email

This helps identify if it's a specific provider issue.

### Test 2: Check Server Logs
Check your terminal/console for errors:
```bash
# Look for errors like:
Failed to send email: [error message]
```

### Test 3: Verify API Key
Ensure your Resend API key is valid:
1. Go to: https://resend.com/api-keys
2. Check if key is active
3. Check usage limits

## Common Issues & Solutions

### Issue: "Email not found in Resend dashboard"
**Cause**: API key invalid or request failed
**Solution**: 
1. Check `.env` file has correct `RESEND_API_KEY`
2. Restart dev server: `npm run dev`
3. Try sending again

### Issue: "Email shows as 'Bounced' in Resend"
**Cause**: Recipient email invalid or blocked
**Solution**:
1. Verify recipient email is correct
2. Check if email exists
3. Try different email address

### Issue: "Email shows as 'Delivered' but not in inbox"
**Cause**: Email filtered by recipient's email provider
**Solution**:
1. Check spam/junk folder
2. Add sender to contacts
3. Verify domain (permanent fix)

### Issue: "Rate limit exceeded"
**Cause**: Sent too many emails
**Solution**:
- Free tier: 100 emails/day, 3,000/month
- Wait 24 hours or upgrade plan

## Debugging Steps

### Step 1: Check Environment Variables
```bash
# In terminal
echo $RESEND_API_KEY
# Should show: re_iQtP5L7s_E9vJyjtLmKxRv558ebE1SKuU
```

### Step 2: Check Server Console
Look for logs in terminal:
```
=== Sending Email ===
To: user@example.com
Subject: Your Financial Report - March 2026
Status: Success
```

### Step 3: Test with Simple Email
Create a test file to isolate the issue:

```javascript
// test-email.js
import { Resend } from "resend";

const resend = new Resend("re_iQtP5L7s_E9vJyjtLmKxRv558ebE1SKuU");

async function test() {
  const result = await resend.emails.send({
    from: "Finance App <onboarding@resend.dev>",
    to: "your-email@gmail.com",
    subject: "Test Email",
    html: "<h1>Test</h1><p>If you see this, email works!</p>",
  });
  
  console.log("Result:", result);
}

test();
```

Run: `node test-email.js`

## Recommended Setup for Production

### 1. Get a Domain
- Buy from: Namecheap, GoDaddy, Google Domains
- Cost: ~$10-15/year

### 2. Verify with Resend
- Add domain to Resend
- Configure DNS records
- Wait for verification

### 3. Update Sender Email
```javascript
from: "Welth Finance <noreply@yourdomain.com>",
```

### 4. Benefits
- ✅ 99%+ deliverability
- ✅ Professional appearance
- ✅ Not marked as spam
- ✅ Build sender reputation
- ✅ Track email metrics

## Quick Workaround for Testing

If you need to test immediately without domain verification:

### Option 1: Use Your Personal Email as Sender
```javascript
// In actions/send-email.js
from: "Your Name <your-verified-email@gmail.com>",
```

Note: You need to verify this email in Resend first:
1. Go to: https://resend.com/domains
2. Click "Add Single Sender"
3. Enter your email
4. Verify via email link

### Option 2: Send to Yourself Only
For testing, just send reports to your own email:
- You'll receive them more reliably
- Can forward to others if needed

## Email Delivery Checklist

Before sending emails in production:
- [ ] Domain verified with Resend
- [ ] DNS records configured correctly
- [ ] Sender email uses verified domain
- [ ] SPF, DKIM, DMARC records added
- [ ] Test emails sent successfully
- [ ] Emails not going to spam
- [ ] Resend API key is valid
- [ ] Rate limits understood
- [ ] Error handling in place

## Support Resources

### Resend Support
- Documentation: https://resend.com/docs
- Email Logs: https://resend.com/emails
- API Status: https://status.resend.com
- Support: support@resend.com

### Common Email Providers
- Gmail: Check spam, add to contacts
- Outlook: Check junk, add to safe senders
- Yahoo: Check spam, add to contacts
- ProtonMail: Check spam folder

## Summary

**Immediate Actions:**
1. ✅ Check spam/junk folder
2. ✅ Check Resend dashboard for delivery status
3. ✅ Add sender to contacts

**Long-term Solution:**
1. 🌐 Get a domain
2. ✅ Verify with Resend
3. 📧 Update sender email
4. 🚀 Enjoy reliable email delivery

The default `onboarding@resend.dev` works for testing but has limitations. For production use, always verify your own domain!
