import { format } from "date-fns";

/**
 * Generate a professional Excel report for monthly transactions
 * @param {Array} transactions - Array of transaction objects
 * @param {string} month - Month name (e.g., "January")
 * @param {number} year - Year (e.g., 2026)
 * @returns {Promise<void>} - Downloads the Excel file
 */
export async function generateMonthlyReport(transactions, month, year) {
  // Dynamic import for client-side only
  const XLSX = await import("xlsx");
  if (!transactions || transactions.length === 0) {
    throw new Error("No transactions available for the selected month");
  }

  // Prepare data for Excel
  const reportData = transactions.map((transaction) => ({
    Date: format(new Date(transaction.date), "MMM dd, yyyy"),
    Description: transaction.description || "N/A",
    Category: transaction.category || "Uncategorized",
    "Transaction Type": transaction.type === "INCOME" ? "Income" : "Expense",
    Amount: transaction.amount,
    Recurring: transaction.isRecurring ? "Yes" : "No",
  }));

  // Calculate summary
  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // Add summary rows
  reportData.push({});
  reportData.push({
    Date: "SUMMARY",
    Description: "",
    Category: "",
    "Transaction Type": "",
    Amount: "",
    Recurring: "",
  });
  reportData.push({
    Date: "Total Income",
    Description: "",
    Category: "",
    "Transaction Type": "",
    Amount: totalIncome,
    Recurring: "",
  });
  reportData.push({
    Date: "Total Expense",
    Description: "",
    Category: "",
    "Transaction Type": "",
    Amount: totalExpense,
    Recurring: "",
  });
  reportData.push({
    Date: "Net Balance",
    Description: "",
    Category: "",
    "Transaction Type": "",
    Amount: netBalance,
    Recurring: "",
  });

  // Create workbook and worksheet
  const worksheet = XLSX.utils.json_to_sheet(reportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Financial Report");

  // Style the worksheet
  const range = XLSX.utils.decode_range(worksheet["!ref"]);

  // Auto-size columns
  const colWidths = [
    { wch: 15 }, // Date
    { wch: 30 }, // Description
    { wch: 15 }, // Category
    { wch: 18 }, // Transaction Type
    { wch: 12 }, // Amount
    { wch: 12 }, // Recurring
  ];
  worksheet["!cols"] = colWidths;

  // Apply styles to cells
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!worksheet[cellAddress]) continue;

      const cell = worksheet[cellAddress];

      // Header row (bold)
      if (R === 0) {
        cell.s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "4472C4" } },
          alignment: { horizontal: "center", vertical: "center" },
        };
      }

      // Amount column - format as currency
      if (C === 4 && R > 0 && typeof cell.v === "number") {
        cell.z = "$#,##0.00";

        // Color coding for amounts
        const transactionType = worksheet[XLSX.utils.encode_cell({ r: R, c: 3 })];
        if (transactionType && transactionType.v === "Income") {
          cell.s = { font: { color: { rgb: "00B050" } } }; // Green
        } else if (transactionType && transactionType.v === "Expense") {
          cell.s = { font: { color: { rgb: "FF0000" } } }; // Red
        }
      }

      // Summary section styling
      if (R >= transactions.length + 2) {
        cell.s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "F2F2F2" } },
        };

        // Color code summary amounts
        if (C === 4 && typeof cell.v === "number") {
          if (R === transactions.length + 3) {
            // Total Income
            cell.s.font.color = { rgb: "00B050" }; // Green
          } else if (R === transactions.length + 4) {
            // Total Expense
            cell.s.font.color = { rgb: "FF0000" }; // Red
          } else if (R === transactions.length + 5) {
            // Net Balance
            cell.s.font.color = { rgb: cell.v >= 0 ? "00B050" : "FF0000" };
          }
        }
      }
    }
  }

  // Generate filename
  const filename = `financial-report-${month}-${year}.xlsx`;

  // Download the file
  XLSX.writeFile(workbook, filename);
}
