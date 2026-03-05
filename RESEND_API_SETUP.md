# Resend API Setup Guide

## What is Resend?
Resend is an email service used in your finance app to send:
- **Monthly financial reports** (automated via Inngest)
- **Budget alerts** (when spending exceeds 80% of budget)

## Current Status
❌ **RESEND_API_KEY is missing** in your `.env` file

## How to Get Your Resend API Key

### Step 1: Sign Up
1. Go to: https://resend.com/signup
2. Sign up with your email or GitHub account
3. Verify your email address

### Step 2: Create API Key
1. After login, go to: https://resend.com/api-keys
2. Click "Create API Key"
3. Give it a name (e.g., "Finance App")
4. Select permissions: **Full Access** (or at minimum: "Sending access")
5. Click "Create"
6. **Copy the API key** (you'll only see it once!)

### Step 3: Add to .env File
1. Open your `.env` file
2. Find the line: `RESEND_API_KEY=`
3. Paste your API key after the `=`
4. Example:
   ```
   RESEND_API_KEY=re_123abc456def789ghi
   ```

### Step 4: Verify Domain (Optional but Recommended)
For production use, verify your domain:
1. Go to: https://resend.com/domains
2. Click "Add Domain"
3. Enter your domain (e.g., yourdomain.com)
4. Add the DNS records provided by Resend
5. Wait for verification (usually 5-10 minutes)

### Step 5: Update Email Sender (After Domain Verification)
If you verify a domain, update the sender in `actions/send-email.js`:
```javascript
from: "Finance App <noreply@yourdomain.com>",
```

## Free Tier Limits
Resend free tier includes:
- ✅ 100 emails per day
- ✅ 3,000 emails per month
- ✅ Full API access
- ✅ Email templates support

This is sufficient for:
- Testing and development
- Small user base (< 100 users)
- Monthly reports and alerts

## Email Features in Your App

### 1. Monthly Financial Reports
**When**: Sent on the 1st of each month (automated via Inngest)
**To**: All users
**Contains**:
- Total income and expenses
- Expense breakdown by category
- AI-generated financial insights
- Spending trends

**Code Location**: `lib/inngest/function.js` → `generateMonthlyReports`

### 2. Budget Alerts
**When**: Sent when spending exceeds 80% of budget
**To**: User who set the budget
**Contains**:
- Current spending percentage
- Budget amount
- Total expenses
- Account name

**Code Location**: `lib/inngest/function.js` → `checkBudgetAlerts`

## Testing Email Functionality

### Test 1: Manual Email Test
Create a test file `test-email.js`:
```javascript
import { sendEmail } from "./actions/send-email.js";
import EmailTemplate from "./emails/template.jsx";

await sendEmail({
  to: "your-email@example.com",
  subject: "Test Email",
  react: EmailTemplate({
    userName: "Test User",
    type: "budget-alert",
    data: {
      percentageUsed: 85,
      budgetAmount: 1000,
      totalExpenses: 850,
      accountName: "Main Account"
    }
  })
});
```

Run: `node test-email.js`

### Test 2: Check Inngest Functions
The email functions run automatically via Inngest:
- Monthly reports: 1st of each month at midnight
- Budget alerts: Every 6 hours

To test immediately, trigger via Inngest dashboard.

## Troubleshooting

### Issue: "API key not found"
**Solution**: 
1. Check `.env` file has `RESEND_API_KEY=your_key`
2. Restart dev server: `npm run dev`
3. Verify no extra spaces around the key

### Issue: "Email not sending"
**Solution**:
1. Check API key is valid at https://resend.com/api-keys
2. Check free tier limits (100/day, 3000/month)
3. Check console logs for error messages
4. Verify recipient email is valid

### Issue: "Sender domain not verified"
**Solution**:
- For testing: Use `onboarding@resend.dev` (default)
- For production: Verify your domain at https://resend.com/domains

### Issue: "Emails going to spam"
**Solution**:
1. Verify your domain with SPF, DKIM, DMARC records
2. Use a professional sender address
3. Avoid spam trigger words in subject/content
4. Warm up your domain (start with low volume)

## Environment Variables Summary

Your `.env` should now have:
```env
# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# APIs
ARCJET_KEY=ajkey_...
GEMINI_API_KEY=AIzaSy...
RESEND_API_KEY=re_...  # ← ADD THIS
```

## Production Checklist

Before deploying to production:
- [ ] Get Resend API key
- [ ] Add to `.env` file
- [ ] Verify your domain
- [ ] Update sender email address
- [ ] Test email sending
- [ ] Monitor email delivery rates
- [ ] Set up email templates
- [ ] Configure Inngest for production

## Useful Links
- Resend Dashboard: https://resend.com/overview
- API Keys: https://resend.com/api-keys
- Domains: https://resend.com/domains
- Documentation: https://resend.com/docs
- Email Logs: https://resend.com/emails

## Cost Estimate
- **Free Tier**: $0/month (100 emails/day)
- **Pro Tier**: $20/month (50,000 emails/month)
- **Business Tier**: Custom pricing

For most small apps, the free tier is sufficient!
