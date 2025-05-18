
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  tax: number;
  discount?: number;
  subtotal: number;
}

interface InvoiceItemsDisplayProps {
  items: InvoiceItem[];
  isLoading?: boolean;
  isCompact?: boolean;
  showDiscountAmount?: boolean;
}

export const InvoiceItemsDisplay = ({ 
  items, 
  isLoading = false, 
  isCompact = false,
  showDiscountAmount = true
}: InvoiceItemsDisplayProps) => {
  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading items...</p>;
  }

  if (!items || items.length === 0) {
    return <p className="text-sm text-gray-500">No items in this invoice</p>;
  }

  // Function to calculate price after discount
  const getPriceAfterDiscount = (unitPrice: number, discount: number = 0) => {
    return unitPrice * (1 - (discount / 100));
  };

  // Function to calculate discount amount
  const getDiscountAmount = (unitPrice: number, discount: number = 0) => {
    return unitPrice * (discount / 100);
  };

  return (
    <div className={`${isCompact ? '' : 'border rounded-md'} overflow-x-auto w-full`}>
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="text-xs font-medium">Item</TableHead>
            <TableHead className="text-xs font-medium text-center">Qty</TableHead>
            <TableHead className="text-xs font-medium text-right">Unit Price</TableHead>
            <TableHead className="text-xs font-medium text-center">Discount %</TableHead>
            <TableHead className="text-xs font-medium text-right">Tax</TableHead>
            <TableHead className="text-xs font-medium text-right">Subtotal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className="text-sm">
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell className="text-center">{item.quantity}</TableCell>
              <TableCell className="text-right">
                {item.discount && item.discount > 0 ? (
                  <>
                    <span className="line-through text-gray-400 text-xs">₹{item.unit_price.toFixed(2)}</span>
                    <br />
                    <span>₹{getPriceAfterDiscount(item.unit_price, item.discount).toFixed(2)}</span>
                    {showDiscountAmount && (
                      <>
                        <br />
                        <span className="text-green-600 text-xs">
                          (-₹{getDiscountAmount(item.unit_price, item.discount).toFixed(2)})
                        </span>
                      </>
                    )}
                  </>
                ) : (
                  <>₹{item.unit_price.toFixed(2)}</>
                )}
              </TableCell>
              <TableCell className="text-center">
                {item.discount && item.discount > 0 ? (
                  <span className="text-green-600">{item.discount}%</span>
                ) : (
                  '0%'
                )}
              </TableCell>
              <TableCell className="text-right">{item.tax}%</TableCell>
              <TableCell className="text-right">₹{item.subtotal.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
