import { format } from "date-fns";

/**
 * Generate a professional PDF report for monthly transactions
 * @param {Array} transactions - Array of transaction objects
 * @param {string} month - Month name (e.g., "January")
 * @param {number} year - Year (e.g., 2026)
 * @returns {Promise<void>} - Downloads the PDF file
 */
export async function generateMonthlyPDFReport(transactions, month, year) {
  // Dynamic import for client-side only
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  if (!transactions || transactions.length === 0) {
    throw new Error("No transactions available for the selected month");
  }

  // Calculate summary
  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // Create PDF document
  const doc = new jsPDF();

  // Set colors matching dashboard theme
  const primaryColor = [147, 51, 234]; // Purple
  const greenColor = [0, 176, 80]; // Green for income
  const redColor = [255, 0, 0]; // Red for expense
  const headerBgColor = [68, 114, 196]; // Blue header

  // Title
  doc.setFontSize(20);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Monthly Financial Report", 105, 20, { align: "center" });

  // Subtitle with month, year, and generated date
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`${month} ${year}`, 105, 30, { align: "center" });
  doc.setFontSize(10);
  doc.text(
    `Generated: ${format(new Date(), "MMM dd, yyyy")}`,
    105,
    37,
    { align: "center" }
  );

  // Prepare table data
  const tableData = transactions.map((transaction) => [
    format(new Date(transaction.date), "MMM dd, yyyy"),
    transaction.description || "N/A",
    transaction.category || "Uncategorized",
    transaction.type === "INCOME" ? "Income" : "Expense",
    `$${transaction.amount.toFixed(2)}`,
    transaction.isRecurring ? "Yes" : "No",
  ]);

  // Generate table
  autoTable(doc, {
    startY: 45,
    head: [["Date", "Description", "Category", "Type", "Amount", "Recurring"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: headerBgColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 25 }, // Date
      1: { cellWidth: 45 }, // Description
      2: { cellWidth: 25 }, // Category
      3: { cellWidth: 25 }, // Type
      4: { cellWidth: 25, halign: "right" }, // Amount
      5: { cellWidth: 20, halign: "center" }, // Recurring
    },
    didParseCell: function (data) {
      // Color code amounts based on transaction type
      if (data.column.index === 4 && data.section === "body") {
        const rowIndex = data.row.index;
        const transactionType = transactions[rowIndex].type;
        if (transactionType === "INCOME") {
          data.cell.styles.textColor = greenColor;
          data.cell.styles.fontStyle = "bold";
        } else if (transactionType === "EXPENSE") {
          data.cell.styles.textColor = redColor;
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  // Get the final Y position after the table
  const finalY = doc.lastAutoTable.finalY + 10;

  // Summary Section
  doc.setFillColor(242, 242, 242); // Light gray background
  doc.rect(15, finalY, 180, 35, "F");

  // Summary title
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, "bold");
  doc.text("Summary", 20, finalY + 8);

  // Summary details
  doc.setFontSize(11);
  doc.setFont(undefined, "normal");

  // Total Income
  doc.setTextColor(greenColor[0], greenColor[1], greenColor[2]);
  doc.setFont(undefined, "bold");
  doc.text("Total Income:", 20, finalY + 18);
  doc.text(`$${totalIncome.toFixed(2)}`, 180, finalY + 18, { align: "right" });

  // Total Expense
  doc.setTextColor(redColor[0], redColor[1], redColor[2]);
  doc.text("Total Expense:", 20, finalY + 25);
  doc.text(`$${totalExpense.toFixed(2)}`, 180, finalY + 25, { align: "right" });

  // Net Balance
  const balanceColor = netBalance >= 0 ? greenColor : redColor;
  doc.setTextColor(balanceColor[0], balanceColor[1], balanceColor[2]);
  doc.text("Net Balance:", 20, finalY + 32);
  doc.text(`$${netBalance.toFixed(2)}`, 180, finalY + 32, { align: "right" });

  // Generate filename
  const filename = `financial-report-${month}-${year}.pdf`;

  // Download the file
  doc.save(filename);
}
