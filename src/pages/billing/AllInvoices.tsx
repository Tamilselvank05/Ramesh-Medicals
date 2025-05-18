
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import InvoiceDetail from "@/components/InvoiceDetail";
import { toast } from "sonner";
import { Search, Eye, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  tax: number;
  discount?: number;
  subtotal: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  date: string;
  customer_name: string;
  customer_phone: string;
  total: number;
  payment_method: string;
  biller_id: string;
  biller_name?: string;
  items?: InvoiceItem[];
}

const AllInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [showInvoiceDetail, setShowInvoiceDetail] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredInvoices(invoices);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = invoices.filter(invoice => 
        invoice.invoice_number.toLowerCase().includes(query) || 
        invoice.customer_name.toLowerCase().includes(query) || 
        (invoice.biller_name && invoice.biller_name.toLowerCase().includes(query))
      );
      setFilteredInvoices(filtered);
    }
  }, [searchQuery, invoices]);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      // Fetch all invoices
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .order('date', { ascending: false });
        
      if (invoiceError) throw invoiceError;
      
      // Fetch invoice items for each invoice
      const invoicesWithItems: Invoice[] = [];
      
      for (const invoice of invoiceData || []) {
        const { data: itemsData } = await supabase
          .from('invoice_items')
          .select('*')
          .eq('invoice_id', invoice.id);
          
        invoicesWithItems.push({
          ...invoice,
          items: itemsData || []
        });
      }
      
      // Fetch billers (users)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, username');
        
      if (userError) throw userError;
      
      // Map biller name to invoices
      const invoicesWithBillers = invoicesWithItems.map(invoice => {
        const biller = userData?.find(user => user.id === invoice.biller_id);
        return {
          ...invoice,
          biller_name: biller?.username || "Unknown"
        };
      }) || [];
      
      setInvoices(invoicesWithBillers);
      setFilteredInvoices(invoicesWithBillers);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Failed to load invoices");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewInvoice = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setShowInvoiceDetail(true);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy h:mm a");
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const getItemsSummary = (items?: InvoiceItem[]) => {
    if (!items || items.length === 0) return "No items";
    
    if (items.length === 1) {
      const item = items[0];
      return `${item.name} (${item.quantity}) - ${item.discount ? `${item.discount}% off` : 'No discount'}`;
    }
    
    let discountCount = 0;
    items.forEach(item => {
      if (item.discount && item.discount > 0) discountCount++;
    });
    
    return `${items[0].name} (${items[0].quantity}) + ${items.length - 1} more${discountCount > 0 ? `, ${discountCount} with discount` : ''}`;
  };

  // Calculate average discount for an invoice
  const getAverageDiscount = (items?: InvoiceItem[]) => {
    if (!items || items.length === 0) return 0;
    
    let totalDiscount = 0;
    let itemsWithDiscount = 0;
    
    items.forEach(item => {
      if (item.discount && item.discount > 0) {
        totalDiscount += item.discount;
        itemsWithDiscount++;
      }
    });
    
    if (itemsWithDiscount === 0) return 0;
    
    return totalDiscount / itemsWithDiscount;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">All Invoices</h1>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>System-Wide Invoices</CardTitle>
          <div className="relative w-64">
            <Input
              type="text"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 border-gray-300"
            />
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="mt-2 text-lg font-medium">No invoices found</h3>
              <p className="text-sm text-gray-500">
                {searchQuery.trim() ? "Try adjusting your search" : "There are no invoices in the system"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Invoice #</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Customer</TableHead>
                    <TableHead className="font-semibold">Biller</TableHead>
                    <TableHead className="font-semibold">Items</TableHead>
                    <TableHead className="font-semibold">Discount</TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">Payment</TableHead>
                    <TableHead className="text-center font-semibold">View Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => {
                    const avgDiscount = getAverageDiscount(invoice.items);
                    
                    return (
                      <TableRow key={invoice.id} highlightOnHover clickable onClick={() => handleViewInvoice(invoice.id)}>
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>{formatDate(invoice.date)}</TableCell>
                        <TableCell>{invoice.customer_name}</TableCell>
                        <TableCell>{invoice.biller_name || "Unknown"}</TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {getItemsSummary(invoice.items)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {avgDiscount > 0 ? (
                            <span className="text-green-600">{avgDiscount.toFixed(1)}%</span>
                          ) : (
                            "0%"
                          )}
                        </TableCell>
                        <TableCell>{formatCurrency(invoice.total)}</TableCell>
                        <TableCell>
                          <span className="capitalize">{invoice.payment_method}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewInvoice(invoice.id);
                            }}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View Invoice Details</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Invoice Detail Dialog */}
      <InvoiceDetail 
        invoiceId={selectedInvoiceId} 
        open={showInvoiceDetail} 
        onOpenChange={setShowInvoiceDetail}
      />
    </div>
  );
};

export default AllInvoices;
