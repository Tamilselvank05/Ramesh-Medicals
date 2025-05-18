
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InvoiceItemsDisplay } from "@/components/InvoiceItemsDisplay";
import { supabase } from "@/integrations/supabase/client";
import { Printer, X } from "lucide-react";
import { toast } from "sonner";
import { handlePrintInvoice } from "@/utils/printHandler";
import { format } from "date-fns";

interface InvoiceDetailProps {
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
  payment_method: string;
  subtotal: number;
  tax_total: number;
  total: number;
  amount_received: number | null;
  change_returned: number | null;
  biller_name: string;
}

const InvoiceDetail = ({ invoiceId, open, onOpenChange }: InvoiceDetailProps) => {
  const [invoice, setInvoice] = React.useState<Invoice | null>(null);
  const [invoiceItems, setInvoiceItems] = React.useState<InvoiceItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (open && invoiceId) {
      fetchInvoiceDetails();
    }
  }, [open, invoiceId]);

  const fetchInvoiceDetails = async () => {
    if (!invoiceId) return;
    
    setIsLoading(true);
    try {
      // Fetch invoice details
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .select("*, users!invoices_biller_id_fkey(username)")
        .eq("id", invoiceId)
        .single();

      if (invoiceError) throw invoiceError;

      // Format invoice data
      const invoice = {
        ...invoiceData,
        biller_name: invoiceData.users?.username || "Unknown"
      };

      // Fetch invoice items
      const { data: itemsData, error: itemsError } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", invoiceId);

      if (itemsError) throw itemsError;

      setInvoice(invoice);
      setInvoiceItems(itemsData || []);
    } catch (error) {
      console.error("Error fetching invoice details:", error);
      toast.error("Failed to load invoice details");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintInvoiceButton = () => {
    if (!invoice) return;

    try {
      handlePrintInvoice({
        ...invoice,
        items: invoiceItems
      });
      
      toast.success("Invoice prepared for printing");
    } catch (error) {
      console.error("Error printing invoice:", error);
      toast.error("Failed to print invoice");
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy h:mm a");
  };

  // Calculate total discount amount
  const calculateTotalDiscount = () => {
    return invoiceItems.reduce((total, item) => {
      if (!item.discount || item.discount <= 0) return total;
      
      const discountAmount = item.unit_price * (item.discount / 100) * item.quantity;
      return total + discountAmount;
    }, 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl overflow-y-auto max-h-[90vh]">
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
        
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Invoice Details</DialogTitle>
          <DialogDescription>
            Complete information about this transaction
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
          </div>
        ) : invoice ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="Ramesh Medicals" className="w-14 h-14" />
                  <div>
                    <h3 className="font-bold text-lg">Ramesh Medicals</h3>
                    <p className="text-xs text-gray-500">Medical Store & Pharmacy</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">Anaimalai - Poolankinar Rd, Erisinampatti</p>
                <p className="text-sm text-gray-600">Tamil Nadu 642207</p>
                <p className="text-sm text-gray-600">Phone: 9443654109</p>
                <p className="text-sm text-gray-600">Email: r.mailtoramesh@gmail.com</p>
              </div>
              <div className="text-right space-y-1">
                <h3 className="font-bold text-lg">Invoice #{invoice.invoice_number}</h3>
                <p className="text-sm text-gray-600">Date: {formatDate(invoice.date)}</p>
                <p className="text-sm text-gray-600">Biller: {invoice.biller_name}</p>
              </div>
            </div>

            <div className="border-t border-b py-4 space-y-2">
              <h4 className="font-semibold">Customer Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Name:</span> {invoice.customer_name}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Phone:</span> {invoice.customer_phone || "N/A"}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Payment Method:</span>{" "}
                  <span className="capitalize">{invoice.payment_method}</span>
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Items Purchased</h4>
              {invoiceItems && invoiceItems.length > 0 ? (
                <InvoiceItemsDisplay items={invoiceItems} showDiscountAmount={true} />
              ) : (
                <p className="text-sm text-gray-500 italic">No items found for this invoice</p>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>₹{invoice.subtotal.toFixed(2)}</span>
              </div>
              {calculateTotalDiscount() > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Discount Total:</span>
                  <span className="text-green-600">-₹{calculateTotalDiscount().toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Tax:</span>
                <span>₹{invoice.tax_total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold">
                <span>Total:</span>
                <span>₹{invoice.total.toFixed(2)}</span>
              </div>

              {invoice.payment_method === "cash" && (
                <>
                  <div className="flex justify-between text-sm">
                    <span>Amount Received:</span>
                    <span>₹{invoice.amount_received?.toFixed(2) || "0.00"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Change:</span>
                    <span>₹{invoice.change_returned?.toFixed(2) || "0.00"}</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-between pt-2">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="border-gray-300"
              >
                Close
              </Button>
              <Button onClick={handlePrintInvoiceButton} variant="medical">
                <Printer className="mr-2 h-4 w-4" /> Print Invoice
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-center py-8 text-gray-500">No invoice data available.</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDetail;
