"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { sendEmail } from "@/actions/send-email";
import EmailTemplate from "@/emails/template";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Generate AI insights for financial data
async function generateFinancialInsights(stats, month) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const prompt = `
    Analyze this financial data and provide 3 concise, actionable insights.
    Focus on spending patterns and practical advice.
    Keep it friendly and conversational.

    Financial Data for ${month}:
    - Total Income: ${stats.totalIncome}
    - Total Expenses: ${stats.totalExpenses}
    - Net Income: ${stats.totalIncome - stats.totalExpenses}
    - Expense Categories: ${Object.entries(stats.byCategory)
      .map(([category, amount]) => `${category}: ${amount}`)
      .join(", ")}

    Format the response as a JSON array of strings, like this:
    ["insight 1", "insight 2", "insight 3"]
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error generating insights:", error);
    return [
      "Your highest expense category this month might need attention.",
      "Consider setting up a budget for better financial management.",
      "Track your recurring expenses to identify potential savings.",
    ];
  }
}

// Get monthly statistics for a user
async function getMonthlyStats(userId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const transactions = await db.transaction.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  return transactions.reduce(
    (stats, t) => {
      const amount = t.amount.toNumber();
      if (t.type === "EXPENSE") {
        stats.totalExpenses += amount;
        stats.byCategory[t.category] =
          (stats.byCategory[t.category] || 0) + amount;
      } else {
        stats.totalIncome += amount;
      }
      return stats;
    },
    {
      totalExpenses: 0,
      totalIncome: 0,
      byCategory: {},
      transactionCount: transactions.length,
    }
  );
}

// Send manual monthly report
export async function sendManualMonthlyReport(monthValue) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Get user from database
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Parse month value (format: "yyyy-MM")
    const [year, month] = monthValue.split("-").map(Number);
    const monthDate = new Date(year, month - 1, 1);
    const monthName = monthDate.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    // Get monthly statistics
    const stats = await getMonthlyStats(user.id, year, month);

    // Check if there are any transactions
    if (stats.transactionCount === 0) {
      throw new Error(`No transactions found for ${monthName}`);
    }

    // Generate AI insights
    const insights = await generateFinancialInsights(stats, monthName);

    // Send email
    const emailResult = await sendEmail({
      to: user.email,
      subject: `Your Financial Report - ${monthName}`,
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

    // Check if email sending failed
    if (!emailResult.success) {
      // Check for 403 error (domain restriction)
      if (emailResult.error?.message?.includes("403") || 
          emailResult.error?.message?.includes("domain restriction")) {
        throw new Error(
          "Email can only be sent to your Resend account email. " +
          "To send to other emails, verify your own domain at https://resend.com/domains"
        );
      }
      throw new Error(emailResult.error?.message || "Failed to send email");
    }

    return {
      success: true,
      message: `Monthly report for ${monthName} sent to ${user.email}`,
    };
  } catch (error) {
    console.error("Error sending manual monthly report:", error);
    throw new Error(error.message || "Failed to send monthly report");
  }
}
