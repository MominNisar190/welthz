# Gemini API 404 Error - Fixed

## Problem
The receipt scanner was failing with the error:
```
[GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent: [404 Not Found] models/gemini-1.5-flash is not found for API version v1beta
```

## Root Cause
Google deprecated the specific model version `gemini-1.5-flash` and removed it from the API. The `@google/generative-ai` SDK defaults to using the v1beta endpoint, where this specific version is no longer available.

## Solution
Updated all Gemini API calls to use the stable model alias `gemini-flash-latest` instead of the deprecated `gemini-1.5-flash`. This alias always points to the latest stable Flash model, preventing future deprecation issues.

## Files Changed

### 1. `actions/transaction.js`
- Updated `scanReceipt()` function
- Changed model from `"gemini-1.5-flash"` to `"gemini-flash-latest"`

### 2. `lib/inngest/function.js`
- Updated `generateFinancialInsights()` function
- Changed model from `"gemini-1.5-flash"` to `"gemini-flash-latest"`

### 3. `lib/gemini.js`
- Updated `getVisionModel()` function
- Changed model from `"gemini-1.5-flash"` to `"gemini-flash-latest"`

### 4. Documentation Updates
- `RECEIPT_SCANNER_GUIDE.md` - Updated model references
- `RECEIPT_SCANNER_FIX.md` - Updated troubleshooting info

## Benefits of Using `gemini-flash-latest`

1. **Future-proof**: Automatically uses the latest stable Flash model
2. **No breaking changes**: Google maintains backward compatibility with aliases
3. **Better performance**: Always get the latest optimizations
4. **No deprecation issues**: Aliases are maintained long-term

## Testing
After this fix, the receipt scanner should work correctly:
1. Upload a receipt image
2. The image is converted to base64 on the client
3. Sent to Gemini API using `gemini-flash-latest` model
4. Receipt data is extracted and returned

## Alternative Models
If you need different capabilities:
- `gemini-flash-latest` - Fast, cost-effective (recommended)
- `gemini-pro-latest` - More accurate, slower, higher cost

## References
- [Google AI API Versions Documentation](https://ai.google.dev/gemini-api/docs/api-versions)
- [Model Deprecation Guide](https://openillumi.com/en/en-gemini-api-404-model-not-found-fix/)
