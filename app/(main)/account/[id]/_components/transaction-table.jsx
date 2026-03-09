"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Trash,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { categoryColors } from "@/data/categories";
import { bulkDeleteTransactions } from "@/actions/account";
import useFetch from "@/hooks/use-fetch";
import { BarLoader } from "react-spinners";
import { useRouter } from "next/navigation";
import { generateMonthlyReport } from "@/lib/excel-report";
import { generateMonthlyPDFReport } from "@/lib/pdf-report";

const ITEMS_PER_PAGE = 10;

const RECURRING_INTERVALS = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

export function TransactionTable({ transactions, accountName }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    field: "date",
    direction: "desc",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [recurringFilter, setRecurringFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [reportFormat, setReportFormat] = useState("excel");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  // Memoized filtered and sorted transactions
  const filteredAndSortedTransactions = useMemo(() => {
    let result = [...transactions];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter((transaction) =>
        transaction.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply type filter
    if (typeFilter) {
      result = result.filter((transaction) => transaction.type === typeFilter);
    }

    // Apply recurring filter
    if (recurringFilter) {
      result = result.filter((transaction) => {
        if (recurringFilter === "recurring") return transaction.isRecurring;
        return !transaction.isRecurring;
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortConfig.field) {
        case "date":
          comparison = new Date(a.date) - new Date(b.date);
          break;
        case "amount":
          comparison = a.amount - b.amount;
          break;
        case "category":
          comparison = a.category.localeCompare(b.category);
          break;
        default:
          comparison = 0;
      }

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    return result;
  }, [transactions, searchTerm, typeFilter, recurringFilter, sortConfig]);

  // Pagination calculations
  const totalPages = Math.ceil(
    filteredAndSortedTransactions.length / ITEMS_PER_PAGE
  );
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedTransactions.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );
  }, [filteredAndSortedTransactions, currentPage]);

  const handleSort = (field) => {
    setSortConfig((current) => ({
      field,
      direction:
        current.field === field && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleSelect = (id) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds((current) =>
      current.length === paginatedTransactions.length
        ? []
        : paginatedTransactions.map((t) => t.id)
    );
  };

  const {
    loading: deleteLoading,
    fn: deleteFn,
    data: deleted,
  } = useFetch(bulkDeleteTransactions);

  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedIds.length} transactions?`
      )
    )
      return;

    deleteFn(selectedIds);
  };

  useEffect(() => {
    if (deleted && !deleteLoading) {
      toast.error("Transactions deleted successfully");
      setSelectedIds([]); // Clear selections after delete
    }
  }, [deleted, deleteLoading]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setTypeFilter("");
    setRecurringFilter("");
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    setSelectedIds([]); // Clear selections on page change
  };

  // Get available months from transactions
  const availableMonths = useMemo(() => {
    const months = new Set();
    transactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      months.add(monthYear);
    });
    return Array.from(months).sort().reverse();
  }, [transactions]);

  const handleDownloadReport = async () => {
    if (!selectedMonth) {
      toast.error("Please select a month");
      return;
    }

    setIsDownloading(true);

    try {
      const [year, month] = selectedMonth.split("-");
      const monthNumber = parseInt(month);

      // Filter transactions for selected month
      const monthTransactions = transactions.filter((transaction) => {
        const date = new Date(transaction.date);
        return (
          date.getFullYear() === parseInt(year) &&
          date.getMonth() + 1 === monthNumber
        );
      });

      if (monthTransactions.length === 0) {
        toast.error("No transactions found for the selected month");
        setIsDownloading(false);
        return;
      }

      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      // Generate report based on selected format
      if (reportFormat === "pdf") {
        await generateMonthlyPDFReport(monthTransactions, monthNames[monthNumber - 1], year, accountName);
      } else {
        await generateMonthlyReport(monthTransactions, monthNames[monthNumber - 1], year);
      }

      toast.success(`${reportFormat.toUpperCase()} report downloaded successfully!`);
      setSelectedMonth("");
      setReportFormat("excel");
      setIsDialogOpen(false);
    } catch (error) {
      toast.error(error.message || "Failed to generate report");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {deleteLoading && (
        <BarLoader className="mt-4" width={"100%"} color="#9333ea" />
      )}
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px] sm:min-w-[200px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-8 text-sm"
          />
        </div>

        {/* Download Report Button */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2 whitespace-nowrap text-sm h-10">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download Report</span>
              <span className="sm:hidden">Report</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Download Monthly Report</DialogTitle>
              <DialogDescription>
                Select the month and format for your financial report.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="month">Month</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger id="month">
                    <SelectValue placeholder="Choose month..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMonths.map((monthYear) => {
                      const [year, month] = monthYear.split("-");
                      const date = new Date(year, parseInt(month) - 1);
                      return (
                        <SelectItem key={monthYear} value={monthYear}>
                          {format(date, "MMMM yyyy")}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Format</Label>
                <RadioGroup value={reportFormat} onValueChange={setReportFormat}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pdf" id="pdf" />
                    <Label htmlFor="pdf" className="font-normal cursor-pointer">
                      PDF
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="excel" id="excel" />
                    <Label htmlFor="excel" className="font-normal cursor-pointer">
                      Excel
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setSelectedMonth("");
                  setReportFormat("excel");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDownloadReport}
                disabled={!selectedMonth || isDownloading}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                {isDownloading ? "Generating..." : "Download Report"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Select
          value={typeFilter}
          onValueChange={(value) => {
            setTypeFilter(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-auto min-w-[100px] sm:min-w-[130px] text-sm h-10">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="INCOME">Income</SelectItem>
            <SelectItem value="EXPENSE">Expense</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={recurringFilter}
          onValueChange={(value) => {
            setRecurringFilter(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-auto min-w-[100px] sm:min-w-[130px] text-sm h-10">
            <SelectValue placeholder="All Transactions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recurring">Recurring Only</SelectItem>
            <SelectItem value="non-recurring">Non-recurring Only</SelectItem>
          </SelectContent>
        </Select>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            className="whitespace-nowrap text-sm h-10"
          >
            <Trash className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Delete Selected ({selectedIds.length})</span>
            <span className="sm:hidden">Delete ({selectedIds.length})</span>
          </Button>
        )}

        {(searchTerm || typeFilter || recurringFilter) && (
          <Button
            variant="outline"
            size="icon"
            onClick={handleClearFilters}
            title="Clear filters"
            className="h-10 w-10"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Transactions Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px] sm:w-[50px]">
                <Checkbox
                  checked={
                    selectedIds.length === paginatedTransactions.length &&
                    paginatedTransactions.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead
                className="cursor-pointer min-w-[100px]"
                onClick={() => handleSort("date")}
              >
                <div className="flex items-center text-xs sm:text-sm">
                  Date
                  {sortConfig.field === "date" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead className="min-w-[120px] text-xs sm:text-sm">Description</TableHead>
              <TableHead
                className="cursor-pointer min-w-[100px]"
                onClick={() => handleSort("category")}
              >
                <div className="flex items-center text-xs sm:text-sm">
                  Category
                  {sortConfig.field === "category" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer text-right min-w-[100px]"
                onClick={() => handleSort("amount")}
              >
                <div className="flex items-center justify-end text-xs sm:text-sm">
                  Amount
                  {sortConfig.field === "amount" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead className="min-w-[100px] text-xs sm:text-sm">Recurring</TableHead>
              <TableHead className="w-[40px] sm:w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTransactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground text-sm"
                >
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              paginatedTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(transaction.id)}
                      onCheckedChange={() => handleSelect(transaction.id)}
                    />
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm">
                    {format(new Date(transaction.date), "PP")}
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm">{transaction.description}</TableCell>
                  <TableCell className="capitalize">
                    <span
                      style={{
                        background: categoryColors[transaction.category],
                      }}
                      className="px-2 py-1 rounded text-white text-xs"
                    >
                      {transaction.category}
                    </span>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-medium text-xs sm:text-sm",
                      transaction.type === "EXPENSE"
                        ? "text-red-500"
                        : "text-green-500"
                    )}
                  >
                    {transaction.type === "EXPENSE" ? "-" : "+"}$
                    {transaction.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {transaction.isRecurring ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge
                              variant="secondary"
                              className="gap-1 bg-purple-100 text-purple-700 hover:bg-purple-200 text-xs"
                            >
                              <RefreshCw className="h-2 w-2 sm:h-3 sm:w-3" />
                              <span className="hidden sm:inline">
                                {
                                  RECURRING_INTERVALS[
                                    transaction.recurringInterval
                                  ]
                                }
                              </span>
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm">
                              <div className="font-medium">Next Date:</div>
                              <div>
                                {format(
                                  new Date(transaction.nextRecurringDate),
                                  "PPP"
                                )}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-xs">
                        <Clock className="h-2 w-2 sm:h-3 sm:w-3" />
                        <span className="hidden sm:inline">One-time</span>
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                          <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(
                              `/transaction/create?edit=${transaction.id}`
                            )
                          }
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteFn([transaction.id])}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-9 w-9 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs sm:text-sm px-2">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-9 w-9 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
