"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";
import aj from "@/lib/arcjet";
import { request } from "@arcjet/next";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const serializeAmount = (obj) => ({
  ...obj,
  amount: obj.amount.toNumber(),
});

// Create Transaction
export async function createTransaction(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Get request data for ArcJet
    const req = await request();

    // Check rate limit
    const decision = await aj.protect(req, {
      userId,
      requested: 1, // Specify how many tokens to consume
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        const { remaining, reset } = decision.reason;
        console.error({
          code: "RATE_LIMIT_EXCEEDED",
          details: {
            remaining,
            resetInSeconds: reset,
          },
        });

        throw new Error("Too many requests. Please try again later.");
      }

      throw new Error("Request blocked");
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const account = await db.account.findUnique({
      where: {
        id: data.accountId,
        userId: user.id,
      },
    });

    if (!account) {
      throw new Error("Account not found");
    }

    // Calculate new balance
    const balanceChange = data.type === "EXPENSE" ? -data.amount : data.amount;
    const newBalance = account.balance.toNumber() + balanceChange;

    // Create transaction and update account balance
    const transaction = await db.$transaction(async (tx) => {
      const newTransaction = await tx.transaction.create({
        data: {
          ...data,
          userId: user.id,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(data.date, data.recurringInterval)
              : null,
        },
      });

      await tx.account.update({
        where: { id: data.accountId },
        data: { balance: newBalance },
      });

      return newTransaction;
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${transaction.accountId}`);

    return { success: true, data: serializeAmount(transaction) };
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getTransaction(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const transaction = await db.transaction.findUnique({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!transaction) throw new Error("Transaction not found");

  return serializeAmount(transaction);
}

export async function updateTransaction(id, data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    // Get original transaction to calculate balance change
    const originalTransaction = await db.transaction.findUnique({
      where: {
        id,
        userId: user.id,
      },
      include: {
        account: true,
      },
    });

    if (!originalTransaction) throw new Error("Transaction not found");

    // Calculate balance changes
    const oldBalanceChange =
      originalTransaction.type === "EXPENSE"
        ? -originalTransaction.amount.toNumber()
        : originalTransaction.amount.toNumber();

    const newBalanceChange =
      data.type === "EXPENSE" ? -data.amount : data.amount;

    const netBalanceChange = newBalanceChange - oldBalanceChange;

    // Update transaction and account balance in a transaction
    const transaction = await db.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: {
          id,
          userId: user.id,
        },
        data: {
          ...data,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(data.date, data.recurringInterval)
              : null,
        },
      });

      // Update account balance
      await tx.account.update({
        where: { id: data.accountId },
        data: {
          balance: {
            increment: netBalanceChange,
          },
        },
      });

      return updated;
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${data.accountId}`);

    return { success: true, data: serializeAmount(transaction) };
  } catch (error) {
    throw new Error(error.message);
  }
}

// Get User Transactions
export async function getUserTransactions(query = {}) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const transactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        ...query,
      },
      include: {
        account: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    return { success: true, data: transactions };
  } catch (error) {
    throw new Error(error.message);
  }
}

// Scan Receipt with Gemini AI - Production Ready
export async function scanReceipt(fileData) {
  const startTime = Date.now();
  
  try {
    console.log("=== Receipt Scan Started ===");
    console.log("File data received:", {
      hasBase64: !!fileData.base64,
      base64Length: fileData.base64?.length,
      mimeType: fileData.mimeType,
      fileSize: fileData.fileSize
    });

    // Step 1: Validate input
    if (!fileData || !fileData.base64) {
      throw new Error("No image data provided");
    }

    if (!fileData.mimeType || !fileData.mimeType.startsWith('image/')) {
      throw new Error("Invalid file type");
    }

    // Step 2: Validate API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
      console.error("GEMINI_API_KEY is not configured");
      throw new Error("AI service not configured. Please contact support");
    }

    console.log("API key found:", apiKey.substring(0, 10) + "...");

    // Step 3: Initialize Gemini
    console.log("Initializing Gemini AI...");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest", // Using latest stable alias instead of deprecated version
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 2048,
      },
    });

    console.log("Gemini model initialized successfully");

    // Step 4: Create optimized prompt
    const prompt = `You are a receipt data extraction expert. Analyze this receipt image and extract transaction details.

CRITICAL: Return ONLY valid JSON with no markdown formatting or explanations.

Required fields:
- amount: Total amount (number, no currency symbols)
- date: Transaction date (YYYY-MM-DD format)
- description: Brief item description (max 100 chars)
- merchantName: Store/merchant name
- category: One of: groceries, food, shopping, transportation, utilities, entertainment, healthcare, education, personal, travel, housing, insurance, gifts, bills, other-expense

Response format:
{
  "amount": 0.00,
  "date": "2024-01-01",
  "description": "Items purchased",
  "merchantName": "Store Name",
  "category": "groceries"
}

If receipt is unreadable:
{
  "amount": 0,
  "date": null,
  "description": null,
  "merchantName": null,
  "category": null
}`;

    // Step 5: Call Gemini API with retry logic
    let result;
    const maxRetries = 2;
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Gemini API attempt ${attempt + 1}/${maxRetries + 1}...`);
        
        result = await Promise.race([
          model.generateContent([
            {
              inlineData: {
                data: fileData.base64,
                mimeType: fileData.mimeType,
              },
            },
            prompt,
          ]),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Request timeout after 30s")), 30000)
          ),
        ]);
        
        console.log("Gemini API call successful");
        break; // Success
      } catch (error) {
        lastError = error;
        console.error(`Gemini API attempt ${attempt + 1} failed:`, {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          stack: error.stack
        });

        if (attempt === maxRetries) {
          // Final attempt failed - provide detailed error
          console.error("All retry attempts failed. Last error:", error);
          
          if (error.message?.includes("404") || error.message?.includes("not found")) {
            throw new Error("AI model not available. Error: " + error.message);
          }
          if (error.message?.includes("403") || error.message?.includes("API key") || error.message?.includes("PERMISSION_DENIED")) {
            throw new Error("AI service authentication failed. Check API key. Error: " + error.message);
          }
          if (error.message?.includes("429") || error.message?.includes("quota") || error.message?.includes("RESOURCE_EXHAUSTED")) {
            throw new Error("AI service quota exceeded. Try again in a few minutes");
          }
          if (error.message?.includes("timeout")) {
            throw new Error("Request timed out. Try with a smaller image");
          }
          
          // Return the actual error message for debugging
          throw new Error("AI service error: " + (error.message || "Unknown error"));
        }

        // Wait before retry (exponential backoff)
        const waitTime = 1000 * (attempt + 1);
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    // Step 6: Extract response
    console.log("Extracting response...");
    const response = await result.response;
    const text = response.text();
    console.log("Raw AI response:", text);

    // Step 7: Parse JSON response
    let data;
    try {
      // Remove markdown code blocks
      const cleanedText = text
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      
      data = JSON.parse(cleanedText);
      console.log("Parsed data:", data);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      
      // Try to extract JSON from text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          data = JSON.parse(jsonMatch[0]);
          console.log("Extracted data from text:", data);
        } catch {
          throw new Error("Could not parse AI response. Response: " + text.substring(0, 200));
        }
      } else {
        throw new Error("Invalid response format. Response: " + text.substring(0, 200));
      }
    }

    // Step 8: Validate extracted data
    if (!data || typeof data !== 'object') {
      throw new Error("Invalid data structure from AI");
    }

    if (!data.amount || data.amount <= 0) {
      throw new Error("Could not read receipt clearly. Ensure image is clear and well-lit");
    }

    // Step 9: Sanitize data
    const sanitizedData = {
      amount: parseFloat(data.amount) || 0,
      date: data.date ? new Date(data.date) : new Date(),
      description: (data.description || "Receipt transaction").substring(0, 200).trim(),
      category: data.category || "other-expense",
      merchantName: (data.merchantName || "Unknown merchant").substring(0, 100).trim(),
    };

    // Step 10: Final validation
    if (sanitizedData.amount <= 0 || sanitizedData.amount > 1000000) {
      throw new Error("Invalid amount detected: " + sanitizedData.amount);
    }

    if (isNaN(sanitizedData.date.getTime())) {
      throw new Error("Invalid date detected");
    }

    // Log success
    const duration = Date.now() - startTime;
    console.log("=== Receipt Scan Successful ===");
    console.log({
      amount: sanitizedData.amount,
      merchant: sanitizedData.merchantName,
      category: sanitizedData.category,
      duration: `${duration}ms`,
    });

    return sanitizedData;
  } catch (error) {
    // Comprehensive error logging
    const duration = Date.now() - startTime;
    console.error("=== Receipt Scan Failed ===");
    console.error({
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    // Return detailed error messages for debugging
    throw new Error(error.message || "Failed to scan receipt");
  }
}

// Helper function to calculate next recurring date
function calculateNextRecurringDate(startDate, interval) {
  const date = new Date(startDate);

  switch (interval) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date;
}
