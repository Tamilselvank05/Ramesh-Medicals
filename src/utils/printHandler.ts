
import { format } from "date-fns";

export const handlePrintInvoice = (invoice: any) => {
  if (!invoice) {
    console.error("No invoice data provided for printing");
    return;
  }

  try {
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      console.error("Failed to open print window");
      return;
    }
    
    // Format date properly
    const formattedDate = format(new Date(invoice.date), "dd/MM/yyyy h:mm a");
    
    // Create a styled document with the same template as the dialog
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice #${invoice.invoice_number || 'N/A'}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .invoice-container { max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; }
          .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e2e8f0; }
          .logo { width: 80px; height: 80px; display: block; margin: 0 auto 10px; }
          .company-name { font-size: 1.5em; font-weight: bold; margin: 10px 0; }
          .tagline { font-size: 0.9em; color: #4a5568; margin: 5px 0; }
          .details { display: flex; justify-content: space-between; margin: 20px 0; }
          .details > div { width: 48%; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
          th { background-color: #f7fafc; }
          .item-name { font-weight: 500; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .totals { margin-top: 20px; text-align: right; }
          .total-row { font-weight: bold; font-size: 1.1em; }
          .footer { margin-top: 30px; text-align: center; color: #718096; }
          .currency { font-family: Arial, sans-serif; }
          .line-through { text-decoration: line-through; color: #a0aec0; font-size: 0.9em; }
          .discount { color: #38a169; }
          .original-price { text-decoration: line-through; color: #a0aec0; font-size: 0.9em; }
          .discounted-price { color: #38a169; }
          .discount-amount { color: #38a169; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <img src="/logo.png" alt="Ramesh Medicals Logo" class="logo" onerror="this.style.display='none'">
            <div class="company-name">Ramesh Medicals</div>
            <div class="tagline">Medical Store & Pharmacy</div>
            <p>Anaimalai - Poolankinar Rd, Erisinampatti, Tamil Nadu 642207</p>
            <p>Phone: 9443654109 | Email: r.mailtoramesh@gmail.com</p>
          </div>
          
          <div class="details">
            <div>
              <h3>Invoice Information:</h3>
              <p><strong>Invoice #:</strong> ${invoice.invoice_number || 'N/A'}</p>
              <p><strong>Date:</strong> ${formattedDate || 'N/A'}</p>
              <p><strong>Biller:</strong> ${invoice.biller_name || invoice.billerName || 'N/A'}</p>
            </div>
            <div>
              <h3>Customer Information:</h3>
              <p><strong>Name:</strong> ${invoice.customer_name || 'N/A'}</p>
              <p><strong>Phone:</strong> ${invoice.customer_phone || 'N/A'}</p>
              <p><strong>Payment Method:</strong> ${invoice.payment_method ? invoice.payment_method.charAt(0).toUpperCase() + invoice.payment_method.slice(1) : 'N/A'}</p>
            </div>
          </div>
          
          <h3>Items Purchased:</h3>
          <table>
            <thead>
              <tr>
                <th>Medicine</th>
                <th class="text-center">Quantity</th>
                <th class="text-right">Price</th>
                <th class="text-center">Discount</th>
                <th class="text-right">Tax (%)</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${(invoice.items || []).map((item) => {
                const hasDiscount = item.discount && item.discount > 0;
                const originalPrice = item.unit_price || item.unitPrice;
                const discountPercentage = item.discount || 0;
                const discountedPrice = originalPrice * (1 - discountPercentage / 100);
                const discountAmount = originalPrice * (discountPercentage / 100);
                
                return `
                  <tr>
                    <td class="item-name">${item.name}</td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-right">
                      ${hasDiscount ? 
                        `<span class="original-price">₹${originalPrice?.toFixed(2)}</span><br>` +
                        `<span class="discounted-price">₹${discountedPrice?.toFixed(2)}</span>` +
                        `<br><span class="discount-amount">(-₹${discountAmount?.toFixed(2)})</span>`
                        : 
                        `<span>₹${originalPrice?.toFixed(2)}</span>`
                      }
                    </td>
                    <td class="text-center">
                      ${hasDiscount ? 
                        `<span class="discount">${discountPercentage}%</span>` : 
                        '0%'
                      }
                    </td>
                    <td class="text-right">${item.tax}%</td>
                    <td class="text-right">₹${item.subtotal?.toFixed(2) || (0).toFixed(2)}</td>
                  </tr>
                `;
              }).join('') || ''}
            </tbody>
          </table>
          
          <div class="totals">
            <p><strong>Subtotal:</strong> <span>₹${invoice.subtotal?.toFixed(2) || '0.00'}</span></p>
            <p><strong>Tax:</strong> <span>₹${invoice.tax_total?.toFixed(2) || '0.00'}</span></p>
            <p class="total-row"><strong>Total:</strong> <span>₹${invoice.total?.toFixed(2) || '0.00'}</span></p>
            
            ${invoice.payment_method === 'cash' ? `
              <p><strong>Amount Received:</strong> <span>₹${invoice.amount_received?.toFixed(2) || '0.00'}</span></p>
              <p><strong>Change:</strong> <span>₹${invoice.change_returned?.toFixed(2) || '0.00'}</span></p>
            ` : ''}
          </div>
          
          <div class="footer">
            <p>Thank you for your purchase!</p>
            <p>Visit again soon</p>
          </div>
        </div>
        <script>
          // Auto print
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  } catch (error) {
    console.error("Error during invoice printing:", error);
  }
};
