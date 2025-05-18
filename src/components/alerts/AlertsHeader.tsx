
import { CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Medicine } from "@/types/medicine";

interface AlertsHeaderProps {
  title: string;
  description: string;
  items: Medicine[];
  reportTitle: string;
  filename: string;
}

export const AlertsHeader = ({
  title,
  description,
  items,
  reportTitle,
  filename
}: AlertsHeaderProps) => {
  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Function to add shop logo and info
      const addShopInfo = () => {
        try {
          const logo = new Image();
          logo.src = '/logo.png';
          
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = logo.width;
          canvas.height = logo.height;
          
          if (ctx) {
            ctx.drawImage(logo, 0, 0);
            const imgData = canvas.toDataURL('image/png');
            doc.addImage(imgData, 'PNG', 10, 10, 25, 25);
          }
        } catch (error) {
          console.error("Error loading logo:", error);
        }
        
        // Shop name (larger and bold)
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text("Ramesh Medicals", 40, 15);
        
        // Shop details
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Anaimalai - Poolankinar Rd, Erisinampatti", 40, 22);
        doc.text("Tamil Nadu 642207", 40, 27);
        doc.text("Phone: 9443654109", 40, 32);
        doc.text("Email: r.mailtoramesh@gmail.com", 40, 37);
      };
      
      // Add shop info at the top
      addShopInfo();
      
      // Report title
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(reportTitle, 14, 50);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 56);
      
      // Calculate price after discount for reporting
      const itemsWithDiscountedPrice = items.map(item => {
        const discount = item.discount || 0;
        const priceAfterDiscount = item.price - (item.price * (discount / 100));
        return {
          ...item,
          price_after_discount: priceAfterDiscount
        };
      });
      
      // Create table with proper alignment
      autoTable(doc, {
        head: [['Name', 'Vendor', 'Stock', 'Price (₹)', 'Discount (%)', 'Price After Discount (₹)', 'Expiry Date', 'Status']],
        body: itemsWithDiscountedPrice.map(item => {
          let status = "";
          if (reportTitle.includes("Stock")) {
            status = item.stock === 0 ? "Out of Stock" : "Low Stock";
          } else {
            const expiryDate = new Date(item.expiry_date);
            const now = new Date();
            
            if (expiryDate <= now) {
              status = "Expired";
            } else {
              const daysToExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              status = `Expires in ${daysToExpiry} days`;
            }
          }
          
          return [
            item.name,
            item.vendors?.name || 'No vendor',
            item.stock.toString(),
            item.price.toFixed(2),
            (item.discount || 0).toString(),
            item.price_after_discount.toFixed(2),
            new Date(item.expiry_date).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            }),
            status
          ];
        }),
        startY: 62,
        styles: {
          font: 'helvetica',
          fontStyle: 'normal',
          fontSize: 9,
        },
        columnStyles: {
          0: { cellWidth: 'auto' }, // Name
          1: { cellWidth: 'auto' }, // Vendor
          2: { cellWidth: 15, halign: 'right' }, // Stock
          3: { cellWidth: 22, halign: 'right' }, // Price
          4: { cellWidth: 22, halign: 'center' }, // Discount
          5: { cellWidth: 30, halign: 'right' }, // Price After Discount
          6: { cellWidth: 25, halign: 'center' }, // Expiry Date
          7: { cellWidth: 25 }, // Status
        },
        didParseCell: (data) => {
          // Add Rupee symbol (₹) to price columns in the table body
          if (data.section === 'body') {
            if (data.column.index === 3) { // Price column
              data.cell.text = [`₹${data.cell.text}`];
            }
            if (data.column.index === 5) { // Price After Discount column
              data.cell.text = [`₹${data.cell.text}`];
            }
          }
        },
        headStyles: { 
          fillColor: [41, 128, 185], 
          textColor: 255,
          fontSize: 9,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 250]
        },
      });
      
      // Add page numbers
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }
      
      doc.save(`${filename}.pdf`);
      toast.success('PDF exported successfully');
      
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error('Failed to export PDF');
    }
  };

  const exportToExcel = () => {
    try {
      const data = items.map(item => {
        let status = "";
        if (reportTitle.includes("Stock")) {
          status = item.stock === 0 ? "Out of Stock" : "Low Stock";
        } else {
          const expiryDate = new Date(item.expiry_date);
          const now = new Date();
          
          if (expiryDate <= now) {
            status = "Expired";
          } else {
            const daysToExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            status = `Expires in ${daysToExpiry} days`;
          }
        }
        
        const discount = item.discount || 0;
        const priceAfterDiscount = item.price - (item.price * (discount / 100));
        
        return {
          'Name': item.name,
          'Vendor': item.vendors?.name || 'No vendor',
          'Stock': item.stock,
          'Price': `₹${item.price.toFixed(2)}`,
          'Discount (%)': discount,
          'Price After Discount': `₹${priceAfterDiscount.toFixed(2)}`,
          'Expiry Date': new Date(item.expiry_date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }),
          'Status': status
        };
      });
      
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, reportTitle);
      
      // Adjust column widths for better readability
      const maxWidths = [
        { wch: 40 }, // Name
        { wch: 25 }, // Vendor
        { wch: 10 }, // Stock
        { wch: 15 }, // Price
        { wch: 15 }, // Discount
        { wch: 25 }, // Price After Discount
        { wch: 15 }, // Expiry Date
        { wch: 20 }  // Status
      ];
      
      worksheet['!cols'] = maxWidths;
      
      XLSX.writeFile(workbook, `${filename}.xlsx`);
      toast.success('Excel exported successfully');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export Excel');
    }
  };

  return (
    <div className="flex flex-row items-center justify-between w-full">
      <div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>
      <div className="flex gap-2 ml-auto">
        <Button 
          onClick={exportToPDF} 
          disabled={items.length === 0}
          className="bg-red-500 hover:bg-red-600"
        >
          <FileText className="mr-2 h-4 w-4" /> PDF
        </Button>
        <Button 
          onClick={exportToExcel} 
          disabled={items.length === 0}
          className="bg-green-600 hover:bg-green-700"
        >
          <Download className="mr-2 h-4 w-4" /> Excel
        </Button>
      </div>
    </div>
  );
};
