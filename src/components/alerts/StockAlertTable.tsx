
import { Medicine } from "@/types/medicine";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface StockAlertTableProps {
  outOfStockItems: Medicine[];
  lowStockItems: Medicine[];
  isLoading: boolean;
}

export const StockAlertTable = ({ outOfStockItems, lowStockItems, isLoading }: StockAlertTableProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <p>Loading alerts...</p>
      </div>
    );
  }
  
  if (outOfStockItems.length === 0 && lowStockItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <div className="rounded-full bg-green-100 p-3 text-green-600">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="mt-4 text-lg font-semibold">All items in stock</p>
        <p className="text-sm text-gray-500">
          There are no items with low stock at the moment.
        </p>
      </div>
    );
  }
  
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead className="text-center">Current Stock</TableHead>
            <TableHead className="text-right">Price (₹)</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {outOfStockItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{item.vendors?.name || 'No vendor'}</TableCell>
              <TableCell className="text-center">
                <span className="text-red-600 font-medium">0</span>
              </TableCell>
              <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
              <TableCell className="text-right">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Out of Stock
                </span>
              </TableCell>
            </TableRow>
          ))}
          
          {lowStockItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{item.vendors?.name || 'No vendor'}</TableCell>
              <TableCell className="text-center">
                <span className="text-amber-600 font-medium">{item.stock}</span>
              </TableCell>
              <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
              <TableCell className="text-right">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  Low Stock
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
