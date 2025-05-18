
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validatePhoneNumber } from "@/utils/validations";
import { toast } from "@/components/ui/use-toast";

interface CustomerDetailsFormProps {
  customerName: string;
  setCustomerName: (name: string) => void;
  customerPhone: string;
  setCustomerPhone: (phone: string) => void;
}

const CustomerDetailsForm = ({
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone
}: CustomerDetailsFormProps) => {
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Allow empty string (for optional phone) or digits only
    if (value === '' || /^\d*$/.test(value)) {
      setCustomerPhone(value);
    }
  };

  const handlePhoneBlur = () => {
    if (customerPhone && !validatePhoneNumber(customerPhone)) {
      toast({
        variant: "destructive",
        title: "Invalid phone number",
        description: "Phone number must be 10-12 digits with numbers only"
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div>
        <Label htmlFor="customerName">Customer Name</Label>
        <Input
          id="customerName"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Enter customer name"
          className="mt-1"
          required
        />
      </div>
      <div>
        <Label htmlFor="customerPhone">Customer Phone (Optional)</Label>
        <Input
          id="customerPhone"
          value={customerPhone}
          onChange={handlePhoneChange}
          onBlur={handlePhoneBlur}
          placeholder="Enter 10-12 digit phone number"
          className="mt-1"
          maxLength={12}
          inputMode="numeric"
        />
        {customerPhone && !validatePhoneNumber(customerPhone) && (
          <p className="text-xs text-red-500 mt-1">Phone must be 10-12 digits (numbers only)</p>
        )}
      </div>
    </div>
  );
};

export default CustomerDetailsForm;
