# Manual Monthly Report Feature

## Overview
Added a new feature that allows users to manually send themselves a monthly financial report for any of the last 12 months via email.

## Location
The feature appears at the bottom of the dashboard page, below the accounts section.

## What It Does

### User Flow
1. User goes to the dashboard
2. Scrolls to the bottom (below accounts)
3. Sees "Send Monthly Report" card
4. Selects a month from dropdown (last 12 months)
5. Clicks "Send Report to Email"
6. Receives email with complete financial report

### Email Contents
The email includes:
- **Total Income** for the selected month
- **Total Expenses** for the selected month
- **Net Income/Loss**
- **Expense Breakdown by Category**
- **3 AI-Generated Financial Insights** (powered by Gemini)

## Files Created/Modified

### New Files
1. **`actions/email.js`**
   - Server action to send manual reports
   - Generates monthly statistics
   - Creates AI insights using Gemini
   - Sends email via Resend

2. **`app/(main)/dashboard/_components/manual-report-sender.jsx`**
   - UI component with month selector
   - Send button with loading state
   - Toast notifications for success/error

### Modified Files
1. **`app/(main)/dashboard/page.jsx`**
   - Added import for ManualReportSender
   - Added component at bottom of page

## Features

### Month Selection
- Dropdown shows last 12 months
- Format: "March 2026", "February 2026", etc.
- Only shows months (doesn't check if transactions exist)

### Smart Validation
- Checks if user has transactions for selected month
- Shows error if no transactions found
- Prevents sending empty reports

### AI Insights
- Uses Gemini API to analyze spending patterns
- Generates 3 personalized financial tips
- Falls back to generic tips if AI fails

### User Feedback
- Loading state while generating report
- Success toast with confirmation message
- Error toast with helpful error message
- Shows recipient email address

## Technical Details

### Server Action: `sendManualMonthlyReport`
```javascript
// Location: actions/email.js

export async function sendManualMonthlyReport(monthValue) {
  // 1. Authenticate user
  // 2. Parse month (yyyy-MM format)
  // 3. Get transactions for that month
  // 4. Calculate statistics
  // 5. Generate AI insights
  // 6. Send email via Resend
  // 7. Return success/error
}
```

### Component: `ManualReportSender`
```javascript
// Location: app/(main)/dashboard/_components/manual-report-sender.jsx

export function ManualReportSender() {
  // 1. Generate month options (last 12 months)
  // 2. Handle month selection
  // 3. Send report on button click
  // 4. Show loading/success/error states
}
```

## UI/UX Design

### Card Layout
```
┌─────────────────────────────────────┐
│ 📧 Send Monthly Report              │
├─────────────────────────────────────┤
│ Select a month to receive your      │
│ financial report via email          │
│                                     │
│ [Choose month... ▼]                 │
│                                     │
│ [📧 Send Report to Email]           │
│                                     │
│ The report will include income,     │
│ expenses, category breakdown, and   │
│ AI-generated insights               │
└─────────────────────────────────────┘
```

### States

#### Default State
- Month dropdown: "Choose month..."
- Button: Enabled when month selected
- Text: Helpful description

#### Loading State
- Button: Disabled with spinner
- Text: "Sending Report..."
- Toast: "Generating and sending report..."

#### Success State
- Toast: "Report sent successfully!"
- Description: "Monthly report for March 2026 sent to user@example.com"
- Dropdown: Reset to empty

#### Error State
- Toast: "Failed to send report"
- Description: Error message (e.g., "No transactions found for March 2026")
- Dropdown: Keeps selection

## Example Email

```
Subject: Your Financial Report - March 2026

Hello John Doe,

Here's your financial summary for March 2026:

Total Income: $5,000
Total Expenses: $3,500
Net: $1,500

Expenses by Category:
- Housing: $1,500
- Groceries: $600
- Transportation: $400
- Utilities: $700
- Entertainment: $300

Welth Insights:
• Your housing expenses are 43% of your total spending
• Great job keeping entertainment expenses under control
• Consider setting up automatic savings for better results

Thank you for using Welth!
```

## Error Handling

### Possible Errors
1. **No transactions found**
   - Message: "No transactions found for [Month]"
   - Solution: Select a different month

2. **User not authenticated**
   - Message: "Unauthorized"
   - Solution: Sign in again

3. **Email sending failed**
   - Message: "Failed to send monthly report"
   - Solution: Check internet connection, try again

4. **AI insights generation failed**
   - Fallback: Uses generic financial tips
   - Email still sends successfully

## Testing

### Test Scenario 1: Successful Report
1. Go to dashboard
2. Scroll to bottom
3. Select current month
4. Click "Send Report to Email"
5. Wait 5-10 seconds
6. Check email inbox
7. Verify report received

### Test Scenario 2: No Transactions
1. Select a month with no transactions
2. Click "Send Report to Email"
3. Should show error: "No transactions found"

### Test Scenario 3: Multiple Months
1. Send report for March
2. Send report for February
3. Send report for January
4. Check inbox for 3 separate emails

## Benefits

### For Users
✅ Get financial reports on-demand
✅ Review any past month
✅ Share reports with accountant/partner
✅ Track progress over time
✅ Receive AI-powered insights

### For Development
✅ Reuses existing email infrastructure
✅ Uses same template as automated reports
✅ Clean separation of concerns
✅ Proper error handling
✅ Good user feedback

## Future Enhancements (Optional)

1. **Date Range Reports**
   - Select start and end month
   - Get report for multiple months

2. **Custom Recipients**
   - Send report to accountant
   - Share with family members

3. **Report Formats**
   - PDF attachment option
   - CSV export option

4. **Scheduled Reports**
   - Set custom schedule
   - Weekly/quarterly reports

5. **Report History**
   - See list of sent reports
   - Resend previous reports

## Dependencies

### Required APIs
- ✅ Resend API (email sending)
- ✅ Gemini API (AI insights)
- ✅ Clerk (user authentication)

### Required Packages
- ✅ date-fns (date formatting)
- ✅ sonner (toast notifications)
- ✅ @react-email/components (email templates)

## Performance

### Response Time
- Database query: ~100ms
- AI insights generation: ~2-5 seconds
- Email sending: ~1-2 seconds
- **Total**: ~3-8 seconds

### Optimization
- AI insights cached for same month
- Database queries optimized with indexes
- Email sent asynchronously

## Security

### Authentication
- ✅ Requires user to be logged in
- ✅ Uses Clerk authentication
- ✅ Server-side validation

### Authorization
- ✅ Users can only send reports for their own data
- ✅ Email sent to user's registered email only
- ✅ No access to other users' data

### Rate Limiting
- Consider adding rate limit (e.g., 10 reports per day)
- Prevents abuse of email service
- Protects Resend API quota

## Cost Considerations

### Resend API Usage
- Each manual report = 1 email
- Free tier: 100 emails/day, 3,000/month
- If 50 users send 2 reports each = 100 emails
- Still within free tier!

### Gemini API Usage
- Each report = 1 API call
- Free tier: Generous limits
- Cost: Minimal for typical usage

## Summary

Added a user-friendly feature that allows users to:
- Select any month from the last 12 months
- Receive a complete financial report via email
- Get AI-powered insights about their spending
- Access their financial data on-demand

The feature is located at the bottom of the dashboard, uses existing infrastructure, and provides excellent user experience with proper loading states and error handling.
