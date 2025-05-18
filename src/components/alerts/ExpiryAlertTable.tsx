
import { Medicine } from "@/types/medicine";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface ExpiryAlertTableProps {
  expiredItems: Medicine[];
  expiryAlertItems: Medicine[];
  isLoading: boolean;
  getExpiryStatus: (expiryDateStr: string) => { status: string; className: string };
}

export const ExpiryAlertTable = ({ 
  expiredItems, 
  expiryAlertItems, 
  isLoading, 
  getExpiryStatus 
}: ExpiryAlertTableProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <p>Loading alerts...</p>
      </div>
    );
  }
  
  if (expiredItems.length === 0 && expiryAlertItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <div className="rounded-full bg-green-100 p-3 text-green-600">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="mt-4 text-lg font-semibold">No expiry concerns</p>
        <p className="text-sm text-gray-500">
          All medicines are within their expiry dates for the next 30 days.
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
            <TableHead className="text-center">Stock</TableHead>
            <TableHead className="text-center">Expiry Date</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expiredItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{item.vendors?.name || 'No vendor'}</TableCell>
              <TableCell className="text-center">{item.stock}</TableCell>
              <TableCell className="text-center">
                {new Date(item.expiry_date).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
              </TableCell>
              <TableCell className="text-right">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Expired
                </span>
              </TableCell>
            </TableRow>
          ))}
          
          {expiryAlertItems.map((item) => {
            const { status, className } = getExpiryStatus(item.expiry_date);
            
            return (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.vendors?.name || 'No vendor'}</TableCell>
                <TableCell className="text-center">{item.stock}</TableCell>
                <TableCell className="text-center">
                  {new Date(item.expiry_date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}>
                    {status}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
