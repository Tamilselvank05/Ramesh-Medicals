
import { useState, useEffect } from "react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileDown, FileText, Download, Printer, Search, Store } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { InvoiceItemsDisplay } from "@/components/InvoiceItemsDisplay";

interface Medicine {
  id: string;
  name: string;
  stock: number;
  price: number;
  tax: number;
  discount: number;
  expiry_date: string;
  vendors: { id: string, name: string } | null;
}

interface Invoice {
  id: string;
  invoice_number: string;
  biller_id: string;
  customer_name: string;
  customer_phone: string | null;
  date: string;
  subtotal: number;
  tax_total: number;
  total: number;
  payment_method: string;
  amount_received: number | null;
  change_returned: number | null;
  billerName?: string;
  items?: any[];
}

const Reports = () => {
  
  const [activeTab, setActiveTab] = useState("sales");
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const [searchTerm, setSearchTerm] = useState("");
  
  const [vendorSearchQuery, setVendorSearchQuery] = useState("");
  
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoadingMedicines, setIsLoadingMedicines] = useState(true);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  
  useEffect(() => {
    fetchMedicines();
    fetchInvoices();
  }, []);
  
  const fetchMedicines = async (): Promise<Medicine[]> => {
    setIsLoadingMedicines(true);
    try {
      const { data, error } = await supabase
        .from('medicines')
        .select('*, vendors(id, name)')
        .order('name');
      
      if (error) {
        throw error;
      }
      
      setMedicines(data || []);
      return data || [];
    } catch (error) {
      console.error("Error fetching medicines:", error);
      toast.error("Failed to load medicines data");
      return [];
    } finally {
      setIsLoadingMedicines(false);
    }
  };
  
  const fetchInvoices = async () => {
    setIsLoadingInvoices(true);
    try {
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          *,
          users:biller_id (username)
        `)
        .order('date', { ascending: false });
      
      if (invoicesError) {
        throw invoicesError;
      }
      
      // Fetch invoice items for each invoice
      const processedInvoices = await Promise.all((invoicesData || []).map(async (invoice) => {
        const { data: itemsData, error: itemsError } = await supabase
          .from('invoice_items')
          .select('*')
          .eq('invoice_id', invoice.id);
          
        if (itemsError) {
          console.error("Error fetching invoice items:", itemsError);
          return {
            ...invoice,
            billerName: invoice.users?.username || "Unknown",
            items: []
          };
        }
        
        return {
          ...invoice,
          billerName: invoice.users?.username || "Unknown",
          items: itemsData || []
        };
      }));
      
      setInvoices(processedInvoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Failed to load invoice data");
    } finally {
      setIsLoadingInvoices(false);
    }
  };
  
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB");
  };
  
  const handleExport = (type: string, format: "pdf" | "excel") => {
    if (format === "pdf") {
      if (type === "sales") exportSalesPDF();
      else if (type === "stock") exportStockPDF();
      else if (type === "invoices") exportInvoicesPDF();
    } else if (format === "excel") {
      if (type === "sales") exportSalesExcel();
      else if (type === "stock") exportStockExcel();
      else if (type === "invoices") exportInvoicesExcel();
    }
  };
  
  
  const exportSalesPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Add shop header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text("Ramesh Medicals", doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text("Anaimalai - Poolankinar Rd, Erisinampatti, Tamil Nadu 642207", doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });
      doc.text("Phone: 9443654109 | Email: r.mailtoramesh@gmail.com", doc.internal.pageSize.getWidth() / 2, 28, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("Sales Report", 14, 40);
      
      if (startDate || endDate) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Date Range: ${startDate ? formatDate(startDate) : "All"} to ${endDate ? formatDate(endDate) : "Present"}`, 14, 48);
      }
      
      doc.text(`Total Sales: ₹ ${salesData.totalSales.toFixed(2)}`, 14, 56);
      doc.text(`Total Invoices: ${salesData.totalInvoices}`, 14, 64);
      
      doc.setFontSize(12);
      doc.text("Payment Methods:", 14, 75);
      
      let yPos = 85;
      Object.entries(salesData.paymentMethodCounts).forEach(([method, count]) => {
        doc.setFontSize(10);
        doc.text(`${method}: ${count}`, 20, yPos);
        yPos += 10;
      });
      
      // Add footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, {
          align: 'center'
        });
      }
      
      doc.save('sales-report.pdf');
      toast.success('Sales report exported as PDF');
    } catch (error) {
      console.error('Error exporting sales PDF:', error);
      toast.error('Failed to export sales report');
    }
  };
  
  const exportStockPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Add shop header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text("Ramesh Medicals", doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text("Anaimalai - Poolankinar Rd, Erisinampatti, Tamil Nadu 642207", doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });
      doc.text("Phone: 9443654109 | Email: r.mailtoramesh@gmail.com", doc.internal.pageSize.getWidth() / 2, 28, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("Stock Report", 14, 40);
      
      // Create table
      autoTable(doc, {
        head: [['Medicine', 'Vendor', 'Stock', 'Unit Price', 'Discount', 'Price After Discount', 'Total Value', 'Expiry Date', 'Status']],
        body: filteredMedicines.map(medicine => {
          const { status } = getMedicineStatus(medicine);
          const discountedPrice = medicine.price * (1 - (medicine.discount || 0) / 100);
          
          return [
            medicine.name,
            medicine.vendors?.name || 'No vendor',
            medicine.stock.toString(),
            `₹ ${medicine.price.toFixed(2)}`,
            `${medicine.discount || 0}%`,
            `₹ ${discountedPrice.toFixed(2)}`,
            `₹ ${(discountedPrice * medicine.stock).toFixed(2)}`,
            formatDate(medicine.expiry_date),
            status
          ];
        }),
        startY: 48,
        styles: {
          fontSize: 8,
          cellPadding: 3,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
        },
        columnStyles: {
          0: {cellWidth: 'auto'}, // Name
          1: {cellWidth: 'auto'}, // Vendor
          2: {cellWidth: 15, halign: 'center'}, // Stock
          3: {cellWidth: 20, halign: 'right'}, // Price
          4: {cellWidth: 15, halign: 'center'}, // Discount
          5: {cellWidth: 25, halign: 'right'}, // Price After Discount
          6: {cellWidth: 20, halign: 'right'}, // Total Value
          7: {cellWidth: 20, halign: 'center'}, // Expiry
          8: {cellWidth: 20, halign: 'center'}, // Status
        }
      });
      
      // Add footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, {
          align: 'center'
        });
      }
      
      doc.save('stock-report.pdf');
      toast.success('Stock report exported as PDF');
    } catch (error) {
      console.error('Error exporting stock PDF:', error);
      toast.error('Failed to export stock report');
    }
  };
  
  const exportInvoicesPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Add shop header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text("Ramesh Medicals", doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text("Anaimalai - Poolankinar Rd, Erisinampatti, Tamil Nadu 642207", doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });
      doc.text("Phone: 9443654109 | Email: r.mailtoramesh@gmail.com", doc.internal.pageSize.getWidth() / 2, 28, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("Invoice History", 14, 40);
      
      autoTable(doc, {
        head: [['Invoice #', 'Date', 'Customer', 'Payment', 'Total', 'Biller']],
        body: filteredInvoices.map(invoice => [
          invoice.invoice_number,
          formatDate(invoice.date),
          invoice.customer_name,
          invoice.payment_method,
          `₹ ${invoice.total.toFixed(2)}`,
          invoice.billerName
        ]),
        startY: 48,
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
        }
      });
      
      // Add footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, {
          align: 'center'
        });
      }
      
      doc.save('invoice-history.pdf');
      toast.success('Invoice history exported as PDF');
    } catch (error) {
      console.error('Error exporting invoices PDF:', error);
      toast.error('Failed to export invoice history');
    }
  };
  
  const exportSalesExcel = () => {
    try {
      // Header information
      const headerRows = [
        ['Ramesh Medicals'],
        ['Anaimalai - Poolankinar Rd, Erisinampatti, Tamil Nadu 642207'],
        ['Phone: 9443654109 | Email: r.mailtoramesh@gmail.com'],
        [''],
        ['Sales Report'],
        [`Date Range: ${startDate ? formatDate(startDate) : "All"} to ${endDate ? formatDate(endDate) : "Present"}`],
        [''],
      ];
      
      const summary = [
        { 'Total Sales': `₹ ${salesData.totalSales.toFixed(2)}` },
        { 'Total Invoices': salesData.totalInvoices }
      ];
      
      const paymentMethods = Object.entries(salesData.paymentMethodCounts).map(([method, count]) => ({
        'Payment Method': method,
        'Count': count
      }));
      
      const workbook = XLSX.utils.book_new();
      
      // Create header worksheet
      const headerWS = XLSX.utils.aoa_to_sheet(headerRows);
      
      // Create summary worksheet
      const summarySheet = XLSX.utils.json_to_sheet(summary);
      const paymentSheet = XLSX.utils.json_to_sheet(paymentMethods);
      
      XLSX.utils.book_append_sheet(workbook, headerWS, "Sales Report");
      XLSX.utils.sheet_add_json(workbook.Sheets["Sales Report"], summary, { skipHeader: true, origin: 'A8' });
      XLSX.utils.sheet_add_json(workbook.Sheets["Sales Report"], paymentMethods, { origin: 'A12' });
      
      // Set column widths
      const wsColsReport = [
        { wch: 20 },
        { wch: 20 },
      ];
      workbook.Sheets["Sales Report"]["!cols"] = wsColsReport;
      
      XLSX.writeFile(workbook, 'sales-report.xlsx');
      toast.success('Sales report exported as Excel');
    } catch (error) {
      console.error('Error exporting sales Excel:', error);
      toast.error('Failed to export sales report');
    }
  };
  
  const exportStockExcel = () => {
    try {
      // Header information for Excel
      const headerRows = [
        ['Ramesh Medicals'],
        ['Anaimalai - Poolankinar Rd, Erisinampatti, Tamil Nadu 642207'],
        ['Phone: 9443654109 | Email: r.mailtoramesh@gmail.com'],
        [''],
        ['Stock Report'],
        [''],
      ];
      
      const data = filteredMedicines.map(medicine => {
        const { status } = getMedicineStatus(medicine);
        const discountedPrice = medicine.price * (1 - (medicine.discount || 0) / 100);
        
        return {
          'Medicine': medicine.name,
          'Vendor': medicine.vendors?.name || 'No vendor',
          'Stock': medicine.stock,
          'Unit Price': `₹ ${medicine.price.toFixed(2)}`,
          'Discount (%)': medicine.discount || 0,
          'Price After Discount': `₹ ${discountedPrice.toFixed(2)}`,
          'Total Value': `₹ ${(discountedPrice * medicine.stock).toFixed(2)}`,
          'Expiry Date': formatDate(medicine.expiry_date),
          'Status': status
        };
      });
      
      const workbook = XLSX.utils.book_new();
      
      // Create header worksheet
      const headerWS = XLSX.utils.aoa_to_sheet(headerRows);
      
      // Create data worksheet and append to workbook
      XLSX.utils.book_append_sheet(workbook, headerWS, "Stock Report");
      XLSX.utils.sheet_add_json(workbook.Sheets["Stock Report"], data, { origin: 'A7', skipHeader: false });
      
      // Set column widths
      const wsCols = [
        { wch: 30 }, // Medicine
        { wch: 20 }, // Vendor
        { wch: 10 }, // Stock
        { wch: 15 }, // Unit Price
        { wch: 15 }, // Discount
        { wch: 20 }, // Price After Discount
        { wch: 15 }, // Total Value
        { wch: 15 }, // Expiry
        { wch: 15 }  // Status
      ];
      workbook.Sheets["Stock Report"]["!cols"] = wsCols;
      
      XLSX.writeFile(workbook, 'stock-report.xlsx');
      toast.success('Stock report exported as Excel');
    } catch (error) {
      console.error('Error exporting stock Excel:', error);
      toast.error('Failed to export stock report');
    }
  };
  
  const exportInvoicesExcel = () => {
    try {
      // Header information
      const headerRows = [
        ['Ramesh Medicals'],
        ['Anaimalai - Poolankinar Rd, Erisinampatti, Tamil Nadu 642207'],
        ['Phone: 9443654109 | Email: r.mailtoramesh@gmail.com'],
        [''],
        ['Invoice History'],
        [''],
      ];
      
      const data = filteredInvoices.map(invoice => ({
        'Invoice #': invoice.invoice_number,
        'Date': formatDate(invoice.date),
        'Customer': invoice.customer_name,
        'Payment': invoice.payment_method,
        'Total': `₹ ${invoice.total.toFixed(2)}`,
        'Biller': invoice.billerName
      }));
      
      const workbook = XLSX.utils.book_new();
      
      // Create header worksheet
      const headerWS = XLSX.utils.aoa_to_sheet(headerRows);
      
      // Create data worksheet and append
      XLSX.utils.book_append_sheet(workbook, headerWS, "Invoice History");
      XLSX.utils.sheet_add_json(workbook.Sheets["Invoice History"], data, { origin: 'A7', skipHeader: false });
      
      // Set column widths
      const wsCols = [
        { wch: 15 }, // Invoice #
        { wch: 15 }, // Date
        { wch: 25 }, // Customer
        { wch: 15 }, // Payment
        { wch: 15 }, // Total
        { wch: 15 }  // Biller
      ];
      workbook.Sheets["Invoice History"]["!cols"] = wsCols;
      
      XLSX.writeFile(workbook, 'invoice-history.xlsx');
      toast.success('Invoice history exported as Excel');
    } catch (error) {
      console.error('Error exporting invoices Excel:', error);
      toast.error('Failed to export invoice history');
    }
  };
  
  const calculateSalesData = () => {
    let filteredForSales = invoices;
    
    if (startDate || endDate) {
      filteredForSales = invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.date);
        const invoiceDateStr = invoiceDate.toISOString().split('T')[0];
        
        if (startDate && endDate) {
          return invoiceDateStr >= startDate && invoiceDateStr <= endDate;
        } else if (startDate) {
          return invoiceDateStr >= startDate;
        } else if (endDate) {
          return invoiceDateStr <= endDate;
        }
        
        return true;
      });
    }
    
    const totalSales = filteredForSales.reduce((sum, invoice) => sum + invoice.total, 0);
    const totalInvoices = filteredForSales.length;
    
    const paymentMethodCounts = filteredForSales.reduce<Record<string, number>>((acc, invoice) => {
      acc[invoice.payment_method] = (acc[invoice.payment_method] || 0) + 1;
      return acc;
    }, {});
    
    return {
      totalSales,
      totalInvoices,
      paymentMethodCounts
    };
  };
  
  const salesData = calculateSalesData();
  
  // Update getMedicineStatus to support multiple conditions
  const getMedicineStatus = (medicine: Medicine) => {
    let statuses = [];
    let className = "text-green-600";
    
    // Check for expired
    if (isExpired(medicine.expiry_date)) {
      statuses.push("Expired");
      className = "text-red-600";
    }
    
    // Check for near expiry
    else if (isNearExpiry(medicine.expiry_date)) {
      statuses.push("Near Expiry");
      className = "text-amber-600";
    }
    
    // Check for stock issues
    if (medicine.stock === 0) {
      statuses.push("Out of Stock");
      className = "text-red-600";
    }
    // Fixed: Changed condition to <= 50 for low stock
    else if (medicine.stock > 0 && medicine.stock <= 50) {
      statuses.push("Low Stock");
      if (!statuses.includes("Expired")) {
        className = "text-amber-600";
      }
    }
    
    if (statuses.length === 0) {
      statuses.push("In Stock");
    }
    
    return { 
      status: statuses.join(", "), 
      className 
    };
  };
  
  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) <= new Date();
  };
  
  const isNearExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(now.getDate() + 30);
    
    return expiry > now && expiry <= thirtyDaysLater;
  };
  
  const filteredMedicines = medicines.filter(medicine => 
    medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (vendorSearchQuery === "" || 
    (medicine.vendors && 
     medicine.vendors.name.toLowerCase().includes(vendorSearchQuery.toLowerCase())))
  );
  
  // Fixed: Changed the low stock count calculation to use <= 50
  const lowStockCount = medicines.filter(med => med.stock > 0 && med.stock <= 50).length;
  
  const filteredInvoices = invoices.filter(invoice => {
    const invoiceDate = new Date(invoice.date);
    const invoiceDateStr = invoiceDate.toISOString().split('T')[0];
    
    if (startDate && endDate) {
      if (invoiceDateStr < startDate || invoiceDateStr > endDate) {
        return false;
      }
    } else if (startDate) {
      if (invoiceDateStr < startDate) {
        return false;
      }
    } else if (endDate) {
      if (invoiceDateStr > endDate) {
        return false;
      }
    }
    
    if (searchTerm) {
      return (
        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return true;
  });
  
  // Updated the print invoice function to match the biller's invoice format
  const handlePrintInvoice = async (invoice: Invoice) => {
    try {
      if (!invoice.items || invoice.items.length === 0) {
        // Fetch items if they're not already loaded
        const { data: itemsData, error: itemsError } = await supabase
          .from('invoice_items')
          .select('*')
          .eq('invoice_id', invoice.id);
          
        if (itemsError) {
          throw itemsError;
        }
        
        invoice.items = itemsData || [];
      }
      
      // Call the print function with the invoice data
      const doc = new jsPDF();
      
      // Add logo and header
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Ramesh Medicals", doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Anaimalai - Poolankinar Rd, Erisinampatti, Tamil Nadu 642207", doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });
      doc.text("Phone: 9443654109 | Email: r.mailtoramesh@gmail.com", doc.internal.pageSize.getWidth() / 2, 28, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("INVOICE", doc.internal.pageSize.getWidth() / 2, 38, { align: 'center' });
      
      // Add line
      doc.setLineWidth(0.5);
      doc.line(14, 42, doc.internal.pageSize.getWidth() - 14, 42);
      
      // Add invoice details
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Invoice #: ${invoice.invoice_number}`, 14, 52);
      doc.text(`Date: ${formatDate(invoice.date)}`, 14, 58);
      doc.text(`Customer: ${invoice.customer_name}`, 14, 64);
      if (invoice.customer_phone) {
        doc.text(`Phone: ${invoice.customer_phone}`, 14, 70);
      }
      
      // Add biller info on right side
      doc.text(`Biller: ${invoice.billerName || "Unknown"}`, 140, 52);
      doc.text(`Payment: ${invoice.payment_method}`, 140, 58);
      
      // Add items table
      const tableColumn = ["Item", "Qty", "Unit Price", "Tax %", "Subtotal"];
      const tableRows = invoice.items.map((item: any) => [
        item.name,
        item.quantity.toString(),
        `₹ ${Number(item.unit_price).toFixed(2)}`,
        `${Number(item.tax).toFixed(1)}%`,
        `₹ ${Number(item.subtotal).toFixed(2)}`
      ]);
      
      autoTable(doc, {
        startY: 75,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: {
          fillColor: [70, 130, 180],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
        },
        columnStyles: {
          0: { cellWidth: 'auto' }, // Item
          1: { cellWidth: 15, halign: 'center' }, // Qty
          2: { cellWidth: 25, halign: 'right' }, // Unit Price
          3: { cellWidth: 15, halign: 'center' }, // Tax
          4: { cellWidth: 25, halign: 'right' }, // Subtotal
        }
      });
      
      // Add summary
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      
      doc.setFont("helvetica", "normal");
      doc.text(`Subtotal:`, 140, finalY);
      doc.text(`₹ ${Number(invoice.subtotal).toFixed(2)}`, 180, finalY, { align: 'right' });
      
      doc.text(`Tax:`, 140, finalY + 8);
      doc.text(`₹ ${Number(invoice.tax_total).toFixed(2)}`, 180, finalY + 8, { align: 'right' });
      
      doc.line(140, finalY + 12, 180, finalY + 12);
      
      doc.setFont("helvetica", "bold");
      doc.text(`Total:`, 140, finalY + 20);
      doc.text(`₹ ${Number(invoice.total).toFixed(2)}`, 180, finalY + 20, { align: 'right' });
      
      // Add payment details if available
      if (invoice.amount_received) {
        doc.setFont("helvetica", "normal");
        doc.text(`Amount Received:`, 140, finalY + 28);
        doc.text(`₹ ${Number(invoice.amount_received).toFixed(2)}`, 180, finalY + 28, { align: 'right' });
        
        if (invoice.change_returned) {
          doc.text(`Change:`, 140, finalY + 36);
          doc.text(`₹ ${Number(invoice.change_returned).toFixed(2)}`, 180, finalY + 36, { align: 'right' });
        }
      }
      
      // Add footer
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.text("Thank you for your business!", doc.internal.pageSize.getWidth() / 2, 280, { align: 'center' });
      
      // Print the PDF
      doc.autoPrint();
      doc.output('dataurlnewwindow');
    } catch (error) {
      console.error("Error printing invoice:", error);
      toast.error("Failed to print invoice");
    }
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="sales" className="flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            Sales Report
          </TabsTrigger>
          <TabsTrigger value="stock" className="flex items-center">
            <FileDown className="mr-2 h-4 w-4" />
            Stock Report
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            Invoice History
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Sales Report</CardTitle>
                  <CardDescription>
                    View and export sales data based on date range
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport("sales", "pdf")}
                    className="flex items-center"
                  >
                    <Printer className="mr-1 h-4 w-4" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport("sales", "excel")}
                    className="flex items-center"
                  >
                    <Download className="mr-1 h-4 w-4" />
                    Excel
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingInvoices ? (
                <div className="text-center py-8">Loading sales data...</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input
                        type="date"
                        id="start-date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="end-date">End Date</Label>
                      <Input
                        type="date"
                        id="end-date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                          Total Sales
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">
                          ₹{salesData.totalSales.toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                          Invoices
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">
                          {salesData.totalInvoices}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                          Average Per Invoice
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">
                          ₹{salesData.totalInvoices > 0 
                            ? (salesData.totalSales / salesData.totalInvoices).toFixed(2) 
                            : "0.00"}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Payment Method Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex items-center p-4 bg-gray-50 rounded-md">
                          <div className="mr-4 rounded-full bg-green-100 p-2">
                            <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Cash</p>
                            <p className="text-lg font-medium">{salesData.paymentMethodCounts.cash || 0}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center p-4 bg-gray-50 rounded-md">
                          <div className="mr-4 rounded-full bg-blue-100 p-2">
                            <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Card</p>
                            <p className="text-lg font-medium">{salesData.paymentMethodCounts.card || 0}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center p-4 bg-gray-50 rounded-md">
                          <div className="mr-4 rounded-full bg-purple-100 p-2">
                            <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">UPI</p>
                            <p className="text-lg font-medium">{salesData.paymentMethodCounts.upi || 0}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stock">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Medicine Stock Report</CardTitle>
                  <CardDescription>
                    Current stock levels, expiry status, and inventory value
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport("stock", "pdf")}
                    className="flex items-center"
                  >
                    <Printer className="mr-1 h-4 w-4" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport("stock", "excel")}
                    className="flex items-center"
                  >
                    <Download className="mr-1 h-4 w-4" />
                    Excel
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingMedicines ? (
                <div className="text-center py-8">Loading stock data...</div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                          Total Medicines
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">
                          {medicines.length}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                          Total Stock Value
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">
                          ₹{medicines
                            .reduce((total, med) => {
                              const discountedPrice = med.price * (1 - (med.discount || 0) / 100);
                              return total + discountedPrice * med.stock;
                            }, 0)
                            .toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                          Low Stock Items
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">
                          {lowStockCount}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                          Expiry Alerts
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">
                          {medicines.filter(med => 
                            isExpired(med.expiry_date) || isNearExpiry(med.expiry_date)
                          ).length}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative w-full">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search medicines by name..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="relative w-full">
                      <Store className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by vendor name..."
                        className="pl-8"
                        value={vendorSearchQuery}
                        onChange={(e) => setVendorSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Medicine Name</TableHead>
                          <TableHead>Vendor</TableHead>
                          <TableHead className="text-center">Stock</TableHead>
                          <TableHead className="text-right">Unit Price (₹)</TableHead>
                          <TableHead className="text-center">Discount (%)</TableHead>
                          <TableHead className="text-right">Price After Discount (₹)</TableHead>
                          <TableHead className="text-right">Total Value (₹)</TableHead>
                          <TableHead>Expiry Date</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMedicines.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="h-24 text-center">
                              No medicines found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredMedicines.map((medicine) => {
                            const { status, className } = getMedicineStatus(medicine);
                            const discountedPrice = medicine.price * (1 - (medicine.discount || 0) / 100);
                            
                            return (
                              <TableRow key={medicine.id}>
                                <TableCell className="font-medium">{medicine.name}</TableCell>
                                <TableCell>{medicine.vendors?.name || "No vendor"}</TableCell>
                                <TableCell className="text-center">
                                  <span className={medicine.stock <= 50 && medicine.stock > 0 ? "text-amber-600 font-medium" : 
                                               medicine.stock === 0 ? "text-red-600 font-medium" : ""}>
                                    {medicine.stock}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">₹{medicine.price.toFixed(2)}</TableCell>
                                <TableCell className="text-center">{medicine.discount || 0}%</TableCell>
                                <TableCell className="text-right">₹{discountedPrice.toFixed(2)}</TableCell>
                                <TableCell className="text-right">₹{(discountedPrice * medicine.stock).toFixed(2)}</TableCell>
                                <TableCell>
                                  <span className={
                                    isExpired(medicine.expiry_date) 
                                      ? "text-red-600" 
                                      : isNearExpiry(medicine.expiry_date) 
                                        ? "text-amber-600" 
                                        : ""
                                  }>
                                    {formatDate(medicine.expiry_date)}
                                  </span>
                                </TableCell>
                                <TableCell className={`text-right ${className}`}>
                                  {status}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Invoice History</CardTitle>
                  <CardDescription>
                    View and manage previous invoices
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport("invoices", "pdf")}
                    className="flex items-center"
                  >
                    <Printer className="mr-1 h-4 w-4" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport("invoices", "excel")}
                    className="flex items-center"
                  >
                    <Download className="mr-1 h-4 w-4" />
                    Excel
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingInvoices ? (
                <div className="text-center py-8">Loading invoice data...</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="invoice-start-date">Start Date</Label>
                      <Input
                        type="date"
                        id="invoice-start-date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="invoice-end-date">End Date</Label>
                      <Input
                        type="date"
                        id="invoice-end-date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="invoice-search">Search</Label>
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="invoice-search"
                          placeholder="Invoice # or customer name..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead>Biller</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInvoices.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center">
                              No invoices found matching the criteria.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredInvoices.map((invoice) => (
                            <TableRow key={invoice.id} className="group">
                              <TableCell className="font-medium">
                                {invoice.invoice_number}
                              </TableCell>
                              <TableCell>{formatDate(invoice.date)}</TableCell>
                              <TableCell>{invoice.customer_name}</TableCell>
                              <TableCell>
                                <span className={
                                  invoice.payment_method === 'cash' 
                                    ? 'text-green-600' 
                                    : invoice.payment_method === 'card'
                                      ? 'text-blue-600'
                                      : 'text-purple-600'
                                }>
                                  {invoice.payment_method}
                                </span>
                              </TableCell>
                              <TableCell>
                                {invoice.items && (
                                  <div className="w-44 max-h-24 overflow-auto">
                                    <InvoiceItemsDisplay items={invoice.items} isCompact={true} />
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                ₹{invoice.total.toFixed(2)}
                              </TableCell>
                              <TableCell>{invoice.billerName}</TableCell>
                              <TableCell>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="opacity-70 hover:opacity-100"
                                  onClick={() => handlePrintInvoice(invoice)}
                                >
                                  <Printer className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
