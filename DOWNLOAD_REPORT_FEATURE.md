# Monthly Report Download Feature - PDF & Excel Support

## Overview
Professional report generation system with support for both PDF and Excel formats, integrated into the transactions table toolbar.

## UI Changes

### Toolbar Layout (Left to Right)
1. **Search Transactions** - Reduced width (max-w-xs, ~35% reduction)
2. **Download Report Button** - Opens format selection dialog
3. **All Types Dropdown** - Existing filter
4. **All Transactions Dropdown** - Existing filter

### Download Report Button
- Icon: Download icon (⬇️)
- Style: Outline variant matching other dropdowns
- Behavior: Opens modal dialog for format selection

## Format Selection Dialog

```
┌─────────────────────────────────┐
│ Download Monthly Report         │
│ Select the month and format     │
│                                  │
│ Month: [Choose month... ▼]      │
│                                  │
│ Format:                          │
│ ( ) PDF                          │
│ (•) Excel                        │
│                                  │
│         [Cancel] [Download]      │
└─────────────────────────────────┘
```

Features:
- Modal dialog with clean layout
- Month dropdown (dynamically populated)
- Radio buttons for format selection (PDF or Excel)
- Cancel and Download buttons
- Loading state while generating report
- Dialog closes after successful download

## Report Formats

### Excel Report (.xlsx)

**Sheet Name:** Monthly Financial Report

**Columns:**
1. Date - Formatted as "MMM dd, yyyy"
2. Description - Transaction description
3. Category - Transaction category
4. Transaction Type - "Income" or "Expense"
5. Amount - Formatted as currency
6. Recurring - "Yes" or "No"

**Styling:**
- Header Row: Bold, white text on blue background (#4472C4)
- Income Amounts: Green text (#00B050)
- Expense Amounts: Red text (#FF0000)
- Auto-sized Columns: Optimized for readability

**Summary Section:**
```
SUMMARY
Total Income:    $XX,XXX.XX  (green)
Total Expense:   $XX,XXX.XX  (red)
Net Balance:     $XX,XXX.XX  (green if positive, red if negative)
```

### PDF Report (.pdf)

**Design Structure:**

1. **Header Section:**
   - Title: "Monthly Financial Report" (Purple, 20pt)
   - Subtitle: Month and Year (Gray, 12pt)
   - Generated Date: Current date (Gray, 10pt)

2. **Transaction Table:**
   - Columns: Date, Description, Category, Type, Amount, Recurring
   - Header: Bold, white text on blue background (#4472C4)
   - Grid theme with borders
   - Income amounts: Green (#00B050)
   - Expense amounts: Red (#FF0000)
   - Proper spacing and alignment

3. **Summary Section:**
   - Light gray background box (#F2F2F2)
   - Bold "Summary" title
   - Total Income (green, bold)
   - Total Expense (red, bold)
   - Net Balance (green if positive, red if negative, bold)

## File Naming

**Format:** `financial-report-[Month]-[Year].[extension]`

**Examples:**
- `financial-report-March-2026.pdf`
- `financial-report-March-2026.xlsx`

## Error Handling

1. **No Month Selected:** Toast error "Please select a month"
2. **No Transactions:** Toast error "No transactions found for the selected month"
3. **Generation Error:** Toast error with error message
4. **Success:** Toast success "[FORMAT] report downloaded successfully!"

## Technical Implementation

### Files Created
- `lib/pdf-report.js` - PDF report generation utility
- `lib/excel-report.js` - Excel report generation utility
- `components/ui/dialog.jsx` - Dialog component
- `components/ui/label.jsx` - Label component
- `components/ui/radio-group.jsx` - Radio group component

### Files Modified
- `app/(main)/account/[id]/_components/transaction-table.jsx` - Updated with dialog and format selection

### Dependencies Added
- `jspdf` (^2.5.2) - PDF generation
- `jspdf-autotable` (^3.8.4) - PDF table generation
- `xlsx` (^0.18.5) - Excel file generation
- `@radix-ui/react-label` - Label component
- `@radix-ui/react-radio-group` - Radio group component
- `@radix-ui/react-dialog` - Dialog component

### Key Functions

#### `generateMonthlyPDFReport(transactions, month, year)`
- Generates professional PDF with styled layout
- Uses jsPDF and jspdf-autotable
- Applies color coding and formatting
- Includes summary section with highlighted box
- Triggers file download

#### `generateMonthlyReport(transactions, month, year)`
- Generates Excel workbook with styled cells
- Calculates income/expense totals
- Applies color coding and formatting
- Triggers file download

#### `handleDownloadReport()`
- Validates month selection
- Filters transactions by selected month
- Calls appropriate report generation function based on format
- Handles loading states and errors
- Closes dialog on success

#### `availableMonths` (useMemo)
- Extracts unique month-year combinations from transactions
- Sorted in reverse chronological order
- Format: "YYYY-MM"

## User Flow

1. User clicks "Download Report" button
2. Modal dialog opens with format selection
3. User selects desired month from dropdown
4. User selects format (PDF or Excel) via radio buttons
5. User clicks "Download Report" button
6. System filters transactions for selected month
7. Report file is generated based on selected format
8. File automatically downloads to user's device
9. Success toast notification appears
10. Dialog closes automatically

## Benefits

- Professional, formatted reports in two formats
- Clean modal interface for selection
- Color-coded financial data in both formats
- Automatic summary calculations
- Consistent file naming convention
- Responsive design
- Comprehensive error handling
- Visual appeal with dashboard color theme
