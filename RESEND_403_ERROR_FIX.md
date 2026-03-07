# Fix: Resend 403 Error - Domain Restriction

## The Problem

**Error**: `403 - Testing domain restriction`

**Message**: "The resend.dev domain is for testing and can only send to your own email address."

## What This Means

When using `onboarding@resend.dev` (Resend's test domain), you can ONLY send emails to:
- ✅ The email address you used to sign up for Resend
- ❌ NOT to any other email addresses

## Your Situation

- Your Clerk account email: `mominnisar500@gmail.com`
- Your Resend account email: **Different email** (the one you used to sign up for Resend)
- Result: 403 Error

## Solutions

### Solution 1: Send to Your Resend Email (Quick Test)

**Step 1**: Find out which email you used for Resend
1. Go to: https://resend.com/settings
2. Check "Account Email"
3. This is the ONLY email that will receive test emails

**Step 2**: Update your Clerk account to use the same email
1. Go to your app's user settings
2. Change email to match your Resend account email
3. Try sending report again

### Solution 2: Verify Your Domain (Recommended)

This is the BEST solution for production use.

#### Step 1: Get a Domain
If you don't have one:
- Buy from: Namecheap (~$10/year), GoDaddy, Google Domains
- Or use a free subdomain service

#### Step 2: Add Domain to Resend
1. Go to: https://resend.com/domains
2. Click "Add Domain"
3. Enter your domain (e.g., `yourdomain.com`)
4. Click "Add"

#### Step 3: Configure DNS Records
Resend will show you DNS records to add. Example:

```
Type: TXT
Name: _resend
Value: resend-verify=abc123xyz...
TTL: 3600

Type: MX  
Name: @
Value: feedback-smtp.resend.com
Priority: 10
TTL: 3600

Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
TTL: 3600
```

**Where to add these:**
- **Namecheap**: Advanced DNS → Add New Record
- **GoDaddy**: DNS Management → Add Record
- **Cloudflare**: DNS → Add Record
- **Google Domains**: DNS → Custom Records

#### Step 4: Wait for Verification
- Takes 5-10 minutes (sometimes up to 24 hours)
- Check status at: https://resend.com/domains
- Status should show: ✅ Verified

#### Step 5: Update Sender Email in Code

Update `actions/send-email.js`:

```javascript
// Before
from: "Finance App <onboarding@resend.dev>",

// After (use your verified domain)
from: "Welth Finance <noreply@yourdomain.com>",
```

#### Step 6: Restart Server
```bash
npm run dev
```

#### Step 7: Test Again
- Send monthly report
- Should work for ANY email address now!

### Solution 3: Add Single Sender Email (Alternative)

If you don't want to buy a domain, you can verify a single email address:

#### Step 1: Add Single Sender
1. Go to: https://resend.com/domains
2. Click "Add Single Sender" (or similar option)
3. Enter an email you own (e.g., `your-email@gmail.com`)
4. Click "Add"

#### Step 2: Verify Email
1. Check your email inbox
2. Click verification link from Resend
3. Email is now verified

#### Step 3: Update Code
```javascript
// In actions/send-email.js
from: "Your Name <your-verified-email@gmail.com>",
```

#### Limitations:
- Can only use that one email as sender
- Less professional than custom domain
- May still have deliverability issues

## Comparison of Solutions

| Solution | Cost | Time | Deliverability | Professional |
|----------|------|------|----------------|--------------|
| Use Resend email | Free | 0 min | ❌ Low | ❌ No |
| Single sender | Free | 5 min | ⚠️ Medium | ⚠️ Okay |
| Verify domain | ~$10/year | 30 min | ✅ High | ✅ Yes |

## Recommended Approach

### For Testing (Right Now)
1. Check which email you used for Resend
2. Update your Clerk account to use that email
3. Test the feature

### For Production (Before Launch)
1. Buy a domain (~$10/year)
2. Verify it with Resend
3. Update sender email in code
4. Enjoy reliable email delivery

## Step-by-Step: Verify Domain (Detailed)

### Example with Namecheap

**1. Buy Domain**
- Go to: https://www.namecheap.com
- Search for domain (e.g., `mywelthapp.com`)
- Purchase (~$10/year)

**2. Access DNS Settings**
- Login to Namecheap
- Go to "Domain List"
- Click "Manage" next to your domain
- Click "Advanced DNS" tab

**3. Add Resend DNS Records**

Add TXT Record for Verification:
```
Type: TXT Record
Host: _resend
Value: [copy from Resend dashboard]
TTL: Automatic
```

Add MX Record:
```
Type: MX Record
Host: @
Value: feedback-smtp.resend.com
Priority: 10
TTL: Automatic
```

Add SPF Record:
```
Type: TXT Record
Host: @
Value: v=spf1 include:_spf.resend.com ~all
TTL: Automatic
```

Add DKIM Record (if provided):
```
Type: TXT Record
Host: resend._domainkey
Value: [copy from Resend dashboard]
TTL: Automatic
```

**4. Save Changes**
- Click "Save All Changes"
- Wait 5-10 minutes

**5. Verify in Resend**
- Go back to: https://resend.com/domains
- Click "Verify" next to your domain
- Should show: ✅ Verified

**6. Update Code**
```javascript
// actions/send-email.js
from: "Welth Finance <noreply@mywelthapp.com>",
```

**7. Test**
- Restart server: `npm run dev`
- Send monthly report
- Should work for ANY email now!

## Troubleshooting

### "Domain not verified after 24 hours"
- Check DNS records are correct
- Use DNS checker: https://dnschecker.org
- Contact Resend support

### "Still getting 403 error after verification"
- Make sure you updated the sender email in code
- Restart your dev server
- Clear browser cache

### "Emails going to spam"
- Add DMARC record
- Warm up your domain (send gradually)
- Ask recipients to add you to contacts

## Quick Reference

### Current Setup (Not Working)
```javascript
from: "Finance App <onboarding@resend.dev>"
// ❌ Can only send to Resend account email
```

### After Domain Verification (Working)
```javascript
from: "Welth Finance <noreply@yourdomain.com>"
// ✅ Can send to ANY email address
```

## Summary

**The Issue**: `resend.dev` domain can only send to your Resend account email

**Quick Fix**: Use the same email for both Clerk and Resend accounts

**Permanent Fix**: Verify your own domain with Resend (~30 minutes, ~$10/year)

**Result**: Reliable email delivery to any email address! 🎉

## Need Help?

- Resend Docs: https://resend.com/docs/send-with-nextjs
- Resend Support: support@resend.com
- Domain Verification Guide: https://resend.com/docs/dashboard/domains/introduction
