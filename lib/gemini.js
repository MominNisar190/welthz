/**
 * Gemini AI Configuration and Utilities
 * Centralized configuration for Google Gemini API
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// Validate and initialize Gemini AI
export function initializeGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey.trim() === "") {
    console.error("GEMINI_API_KEY environment variable is not set");
    throw new Error("Gemini API key not configured");
  }

  try {
    return new GoogleGenerativeAI(apiKey);
  } catch (error) {
    console.error("Failed to initialize GoogleGenerativeAI:", error);
    throw new Error("Failed to initialize AI service");
  }
}

// Get the appropriate model for vision tasks
export function getVisionModel(genAI) {
  try {
    // Use gemini-flash-latest for image + text processing
    // This model supports vision and is cost-effective
    return genAI.getGenerativeModel({ 
      model: "gemini-flash-latest", // Using latest stable alias instead of deprecated version
      generationConfig: {
        temperature: 0.4, // Lower temperature for more consistent results
        topK: 32,
        topP: 1,
        maxOutputTokens: 2048,
      },
    });
  } catch (error) {
    console.error("Failed to get vision model:", error);
    throw new Error("Failed to initialize vision model");
  }
}

// Validate image file
export function validateImageFile(file) {
  const errors = [];

  if (!file) {
    errors.push("No file provided");
    return { valid: false, errors };
  }

  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds 5MB limit`);
  }

  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  if (!validTypes.includes(file.type)) {
    errors.push(`Invalid file type: ${file.type}. Supported: JPG, PNG, WebP, HEIC`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Convert file to base64
export async function fileToBase64(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    
    if (!base64 || base64.length === 0) {
      throw new Error("Failed to convert file to base64");
    }
    
    return base64;
  } catch (error) {
    console.error("File conversion error:", error);
    throw new Error("Failed to process image file");
  }
}

// Parse and validate Gemini response
export function parseGeminiResponse(text) {
  if (!text || text.trim() === "") {
    throw new Error("Empty response from AI");
  }

  // Remove markdown code blocks
  const cleanedText = text
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();

  try {
    return JSON.parse(cleanedText);
  } catch (parseError) {
    // Try to extract JSON from text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        throw new Error("Could not parse AI response");
      }
    }
    throw new Error("Invalid JSON in AI response");
  }
}

// Sanitize receipt data
export function sanitizeReceiptData(data) {
  if (!data || typeof data !== 'object') {
    throw new Error("Invalid data structure");
  }

  return {
    amount: parseFloat(data.amount) || 0,
    date: data.date ? new Date(data.date) : new Date(),
    description: (data.description || "Receipt transaction").substring(0, 200).trim(),
    category: data.category || "other-expense",
    merchantName: (data.merchantName || "Unknown merchant").substring(0, 100).trim(),
  };
}

// Validate sanitized data
export function validateReceiptData(data) {
  const errors = [];

  if (!data.amount || data.amount <= 0) {
    errors.push("Invalid or missing amount");
  }

  if (data.amount > 1000000) {
    errors.push("Amount exceeds maximum limit");
  }

  if (isNaN(data.date.getTime())) {
    errors.push("Invalid date");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
