# Testing the Receipt Scanner

## What Was Fixed
The Gemini API 404 error has been resolved by updating from the deprecated `gemini-1.5-flash` model to the stable `gemini-flash-latest` alias.

## How to Test

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Navigate to Create Transaction Page
- Go to http://localhost:3000/transaction/create
- You should see the "Scan Receipt with AI" button

### 3. Test Receipt Scanning
1. Click the "Scan Receipt with AI" button
2. Upload a clear receipt image (JPG, PNG, WebP)
3. Wait for processing (should take 3-10 seconds)
4. The form should auto-fill with:
   - Amount
   - Date
   - Merchant name
   - Description
   - Category

### 4. Check Console Logs
Open browser DevTools (F12) and check the Console tab for:
- "Converting image to base64..."
- "Sending to Gemini API..."
- "Scan result: {...}"

### 5. Check Server Logs
In your terminal running `npm run dev`, you should see:
- "=== Receipt Scan Started ==="
- "API key found: AIzaSyCQNg..."
- "Initializing Gemini AI..."
- "Gemini model initialized successfully"
- "Gemini API call successful"
- "=== Receipt Scan Successful ==="

## Expected Behavior

### Success Case
- ✅ Loading toast appears: "Scanning receipt..."
- ✅ Success toast: "Receipt scanned successfully!"
- ✅ Form fields auto-populate with extracted data
- ✅ Amount shows as a number (e.g., 45.99)
- ✅ Merchant name appears
- ✅ Category is auto-selected

### Error Cases

#### If image is unclear:
- ⚠️ Error: "Could not read receipt clearly"
- Solution: Try with a clearer, well-lit image

#### If image is too large:
- ⚠️ Error: "Image too large"
- Solution: Use an image smaller than 5MB

#### If API quota exceeded:
- ⚠️ Error: "AI service quota exceeded"
- Solution: Wait a few minutes and try again

## Sample Receipt Images to Test
You can test with:
1. A photo of a physical receipt
2. A screenshot of a digital receipt
3. An invoice PDF converted to image

## Tips for Best Results
- Use good lighting
- Capture the entire receipt
- Avoid shadows and glare
- Keep the receipt flat
- Use images under 5MB

## Troubleshooting

### Still getting 404 errors?
1. Clear Next.js cache: `rm -rf .next`
2. Restart dev server: `npm run dev`
3. Check .env file has GEMINI_API_KEY

### API key issues?
Verify in .env:
```
GEMINI_API_KEY=AIzaSyCQNg7MVJt7mlIBEQkMblxfMYMdIz6plZI
```

### No response from API?
1. Check internet connection
2. Verify API key is valid at https://aistudio.google.com/apikey
3. Check API quota at https://console.cloud.google.com/

## Success Indicators
✅ No 404 errors in console
✅ Receipt data extracted correctly
✅ Form auto-fills with reasonable values
✅ Processing completes in under 10 seconds
