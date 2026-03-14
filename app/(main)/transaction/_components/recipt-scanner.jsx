"use client";

import { useRef, useEffect, useState } from "react";
import { Camera, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { scanReceipt } from "@/actions/transaction";

export function ReceiptScanner({ onScanComplete }) {
  const fileInputRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Convert file to base64 on client side
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove the data:image/xxx;base64, prefix
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleReceiptScan = async (file) => {
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large", {
        description: "Please upload an image smaller than 5MB"
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Invalid file type", {
        description: "Please upload an image file (JPG, PNG, etc.)"
      });
      return;
    }

    // Show processing state
    setIsProcessing(true);
    const toastId = toast.loading("Scanning receipt...", {
      description: "This may take a few seconds"
    });

    try {
      // Convert file to base64 on client side
      console.log("Converting image to base64...");
      const base64String = await fileToBase64(file);
      
      console.log("Sending to Gemini API...", {
        fileSize: file.size,
        fileType: file.type,
        base64Length: base64String.length
      });

      // Call server action with base64 string and metadata
      const result = await scanReceipt({
        base64: base64String,
        mimeType: file.type,
        fileName: file.name,
        fileSize: file.size
      });

      console.log("Scan result:", result);

      toast.dismiss(toastId);
      setIsProcessing(false);

      if (result && result.amount && result.amount > 0) {
        onScanComplete(result);
        toast.success("Receipt scanned successfully!", {
          description: `Amount: ₹${result.amount.toFixed(2)} from ${result.merchantName}`
        });
      } else {
        toast.error("Could not read receipt", {
          description: "Please ensure the image is clear and well-lit, or enter details manually"
        });
      }
    } catch (error) {
      console.error("Receipt scan error:", error);
      toast.dismiss(toastId);
      setIsProcessing(false);
      
      toast.error("Scan failed", {
        description: error.message || "Please try again with a clearer image",
        action: {
          label: "Try again",
          onClick: () => fileInputRef.current?.click()
        }
      });
    }
  };

  return (
    <div className="space-y-2">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleReceiptScan(file);
        }}
        disabled={isProcessing}
      />
      
      <Button
        type="button"
        variant="outline"
        className="w-full h-12 bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 animate-gradient hover:opacity-90 transition-opacity text-white hover:text-white border-0 shadow-md"
        onClick={() => fileInputRef.current?.click()}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            <span className="font-medium">Scanning Receipt...</span>
          </>
        ) : (
          <>
            <Camera className="mr-2 h-5 w-5" />
            <span className="font-medium">Scan Receipt with AI</span>
          </>
        )}
      </Button>

      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium mb-1">Tips for best results:</p>
          <ul className="space-y-0.5 list-disc list-inside">
            <li>Ensure good lighting and clear image</li>
            <li>Capture the entire receipt</li>
            <li>Avoid shadows and glare</li>
            <li>Image should be less than 5MB</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
