# Resend API Usage in Your Finance App

## Overview
The Resend API is used to send **2 types of automated emails** to users in your finance tracking application.

---

## 1. Monthly Financial Reports 📊

### When It Sends
- **Automatically on the 1st of every month at midnight**
- Triggered by Inngest cron job: `{ cron: "0 0 1 * *" }`

### Who Receives It
- **All users** in your database

### What It Contains
```
Subject: Your Monthly Financial Report - [Month Name]

Content:
├── Total Income: $5,000
├── Total Expenses: $3,500
├── Net: $1,500
├── Expenses by Category:
│   ├── Housing: $1,500
│   ├── Groceries: $600
│   ├── Transportation: $400
│   └── Utilities: $700
└── AI Insights (3 personalized tips):
    ├── "Your housing expenses are 43% of total spending"
    ├── "Great job keeping entertainment under control"
    └── "Consider setting up automatic savings"
```

### Code Flow
```
lib/inngest/function.js
  ↓
generateMonthlyReports() function
  ↓
Runs on: 1st of each month at midnight
  ↓
For each user:
  1. Get last month's transactions
  2. Calculate stats (income, expenses, categories)
  3. Generate AI insights using Gemini API
  4. Send email via Resend API
```

### Code Location
**File**: `lib/inngest/function.js`
**Function**: `generateMonthlyReports`
**Lines**: ~170-210

```javascript
await sendEmail({
  to: user.email,
  subject: `Your Monthly Financial Report - ${monthName}`,
  react: EmailTemplate({
    userName: user.name,
    type: "monthly-report",
    data: {
      stats,
      month: monthName,
      insights,
    },
  }),
});
```

---

## 2. Budget Alerts ⚠️

### When It Sends
- **Every 6 hours** (checks if alert needed)
- Triggered by Inngest cron job: `{ cron: "0 */6 * * *" }`
- Only sends if spending ≥ 80% of budget
- Only sends once per month (won't spam)

### Who Receives It
- **Users who have set a budget** and exceeded 80% of it

### What It Contains
```
Subject: Budget Alert for [Account Name]

Content:
├── You've used 85.0% of your monthly budget
├── Budget Amount: $4,000
├── Spent So Far: $3,400
└── Remaining: $600
```

### Trigger Conditions
1. ✅ User has set a budget
2. ✅ Spending ≥ 80% of budget
3. ✅ No alert sent this month yet (prevents spam)

### Code Flow
```
lib/inngest/function.js
  ↓
checkBudgetAlerts() function
  ↓
Runs every 6 hours
  ↓
For each budget:
  1. Calculate total expenses for current month
  2. Calculate percentage used
  3. If ≥ 80% and not alerted this month:
     → Send email via Resend API
     → Mark alert as sent
```

### Code Location
**File**: `lib/inngest/function.js`
**Function**: `checkBudgetAlerts`
**Lines**: ~215-290

```javascript
if (
  percentageUsed >= 80 && 
  (!budget.lastAlertSent || isNewMonth(budget.lastAlertSent, new Date()))
) {
  await sendEmail({
    to: budget.user.email,
    subject: `Budget Alert for ${defaultAccount.name}`,
    react: EmailTemplate({
      userName: budget.user.name,
      type: "budget-alert",
      data: {
        percentageUsed,
        budgetAmount,
        totalExpenses,
        accountName: defaultAccount.name,
      },
    }),
  });
}
```

---

## Email Template System

### Template File
**Location**: `emails/template.jsx`

### Two Template Types

#### 1. Monthly Report Template
```jsx
<EmailTemplate
  userName="John Doe"
  type="monthly-report"
  data={{
    month: "December",
    stats: { totalIncome, totalExpenses, byCategory },
    insights: ["tip 1", "tip 2", "tip 3"]
  }}
/>
```

#### 2. Budget Alert Template
```jsx
<EmailTemplate
  userName="John Doe"
  type="budget-alert"
  data={{
    percentageUsed: 85,
    budgetAmount: 4000,
    totalExpenses: 3400,
    accountName: "Main Account"
  }}
/>
```

---

## Resend API Integration

### Send Email Function
**Location**: `actions/send-email.js`

```javascript
import { Resend } from "resend";

export async function sendEmail({ to, subject, react }) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  const data = await resend.emails.send({
    from: "Finance App <onboarding@resend.dev>",
    to,
    subject,
    react,
  });
  
  return { success: true, data };
}
```

### Email Sender
- **Default**: `Finance App <onboarding@resend.dev>`
- **For Production**: Verify your domain and use your own email

---

## Complete Email Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    INNGEST SCHEDULER                     │
│  (Background job runner - runs automated tasks)          │
└─────────────────────────────────────────────────────────┘
                          │
                          ├─────────────────────────────────┐
                          │                                 │
                          ▼                                 ▼
              ┌───────────────────────┐       ┌───────────────────────┐
              │  Monthly Reports      │       │  Budget Alerts        │
              │  Cron: 0 0 1 * *     │       │  Cron: 0 */6 * * *   │
              │  (1st of month)       │       │  (Every 6 hours)      │
              └───────────────────────┘       └───────────────────────┘
                          │                                 │
                          ▼                                 ▼
              ┌───────────────────────┐       ┌───────────────────────┐
              │  Get all users        │       │  Get all budgets      │
              │  Calculate stats      │       │  Check if ≥ 80%      │
              │  Generate AI insights │       │  Check not sent yet   │
              └───────────────────────┘       └───────────────────────┘
                          │                                 │
                          └─────────────┬───────────────────┘
                                        │
                                        ▼
                          ┌───────────────────────┐
                          │   sendEmail()         │
                          │   actions/send-email  │
                          └───────────────────────┘
                                        │
                                        ▼
                          ┌───────────────────────┐
                          │   RESEND API          │
                          │   (Email Service)     │
                          └───────────────────────┘
                                        │
                                        ▼
                          ┌───────────────────────┐
                          │   User's Email Inbox  │
                          │   📧                  │
                          └───────────────────────┘
```

---

## Email Frequency

| Email Type | Frequency | Trigger | Recipients |
|------------|-----------|---------|------------|
| Monthly Report | Once per month | 1st at midnight | All users |
| Budget Alert | Max once per month | Every 6 hours (if ≥80%) | Users with budgets |

---

## Testing Emails

### Test Monthly Report
1. Wait until 1st of next month, OR
2. Manually trigger via Inngest dashboard, OR
3. Create a test script:

```javascript
// test-monthly-report.js
import { sendEmail } from "./actions/send-email.js";
import EmailTemplate from "./emails/template.jsx";

await sendEmail({
  to: "your-email@example.com",
  subject: "Test Monthly Report",
  react: EmailTemplate({
    userName: "Test User",
    type: "monthly-report",
    data: {
      month: "March",
      stats: {
        totalIncome: 5000,
        totalExpenses: 3500,
        byCategory: {
          groceries: 600,
          housing: 1500,
        }
      },
      insights: [
        "Great spending habits!",
        "Consider saving more",
        "Track your expenses daily"
      ]
    }
  })
});
```

### Test Budget Alert
1. Set a budget (e.g., $1000)
2. Add expenses totaling $800+ (80%+)
3. Wait up to 6 hours for the check
4. Email will be sent automatically

---

## Email Costs (Resend Pricing)

### Free Tier (Current)
- ✅ 100 emails/day
- ✅ 3,000 emails/month
- ✅ Perfect for testing

### Example Usage
- 50 users × 1 monthly report = 50 emails/month
- 10 users × 1 budget alert = 10 emails/month
- **Total**: 60 emails/month (well within free tier!)

### When to Upgrade
- If you have 3,000+ users
- If you send 100+ emails per day
- Cost: $20/month for 50,000 emails

---

## Key Files Summary

| File | Purpose |
|------|---------|
| `actions/send-email.js` | Resend API wrapper function |
| `emails/template.jsx` | Email HTML templates |
| `lib/inngest/function.js` | Automated email triggers |
| `.env` | RESEND_API_KEY configuration |

---

## Benefits of This Email System

✅ **Automated** - No manual work required
✅ **Personalized** - AI-generated insights for each user
✅ **Timely** - Monthly reports and real-time budget alerts
✅ **Professional** - Beautiful HTML email templates
✅ **Scalable** - Handles thousands of users
✅ **Cost-effective** - Free tier covers most use cases

---

## Summary

**Resend API is used for:**
1. 📊 Monthly financial reports (1st of each month)
2. ⚠️ Budget alerts (when spending ≥ 80%)

**Both emails are:**
- Automated via Inngest
- Personalized per user
- Beautifully designed
- Sent reliably via Resend

Your API key is now configured and ready to send emails! 🎉
