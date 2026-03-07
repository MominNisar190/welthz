"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { sendManualMonthlyReport } from "@/actions/email";
import { getDashboardData } from "@/actions/dashboard";

export function ManualReportSender() {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [monthOptions, setMonthOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Generate month options based on available transactions
  useEffect(() => {
    const fetchMonthsWithData = async () => {
      try {
        setIsLoading(true);
        const transactions = await getDashboardData();

        if (!transactions || transactions.length === 0) {
          setMonthOptions([]);
          setIsLoading(false);
          return;
        }

        // Get unique months from transactions
        const monthsWithTransactions = new Set();
        
        transactions.forEach((transaction) => {
          const date = new Date(transaction.date);
          const monthKey = format(date, "yyyy-MM");
          monthsWithTransactions.add(monthKey);
        });

        // Convert to array and sort (newest first)
        const sortedMonths = Array.from(monthsWithTransactions).sort((a, b) => {
          return b.localeCompare(a);
        });

        // Map to option objects
        const options = sortedMonths.map((monthKey) => {
          const [year, month] = monthKey.split("-");
          const date = new Date(parseInt(year), parseInt(month) - 1, 1);
          return {
            value: monthKey,
            label: format(date, "MMMM yyyy"),
          };
        });

        setMonthOptions(options);
      } catch (error) {
        console.error("Error fetching months:", error);
        setMonthOptions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMonthsWithData();
  }, []);

  const handleSendReport = async () => {
    if (!selectedMonth) {
      toast.error("Please select a month");
      return;
    }

    setIsSending(true);
    const toastId = toast.loading("Generating and sending report...");

    try {
      const result = await sendManualMonthlyReport(selectedMonth);
      
      toast.dismiss(toastId);
      toast.success("Report sent successfully!", {
        description: result.message,
      });
      
      // Reset selection
      setSelectedMonth("");
    } catch (error) {
      toast.dismiss(toastId);
      toast.error("Failed to send report", {
        description: error.message || "Please try again later",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-normal flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Send Monthly Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">
            Select a month to receive your financial report via email
          </label>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : monthOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No transactions available yet
            </p>
          ) : (
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Choose month..." />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Button
          onClick={handleSendReport}
          disabled={!selectedMonth || isSending || monthOptions.length === 0}
          className="w-full"
        >
          {isSending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending Report...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Send Report to Email
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          The report will include income, expenses, category breakdown, and AI-generated insights
        </p>
      </CardContent>
    </Card>
  );
}
