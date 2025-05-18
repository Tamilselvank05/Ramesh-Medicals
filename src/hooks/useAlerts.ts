
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Medicine, MedicineWithVendor } from "@/types/medicine";

export const useAlerts = () => {
  const [lowStockItems, setLowStockItems] = useState<MedicineWithVendor[]>([]);
  const [expiryAlertItems, setExpiryAlertItems] = useState<MedicineWithVendor[]>([]);
  const [outOfStockItems, setOutOfStockItems] = useState<MedicineWithVendor[]>([]);
  const [expiredItems, setExpiredItems] = useState<MedicineWithVendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setIsLoading(true);
        
        // Fetch medicines with stock less than or equal to 50 (including 0)
        const { data: lowStockData, error: lowStockError } = await supabase
          .from('medicines')
          .select('*, vendors(*)')
          .lte('stock', 50);
          
        if (lowStockError) throw lowStockError;
        
        // Separate out-of-stock and low-stock items
        const outOfStockData = lowStockData.filter(item => item.stock === 0);
        const lowStockItems = lowStockData.filter(item => item.stock > 0 && item.stock <= 50);
        
        // Get the current date
        const today = new Date();
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(today.getDate() + 30);
        
        // Fetch medicines that expire in the next 30 days
        const { data: expiryData, error: expiryError } = await supabase
          .from('medicines')
          .select('*, vendors(*)')
          .gt('expiry_date', today.toISOString().split('T')[0])
          .lte('expiry_date', thirtyDaysLater.toISOString().split('T')[0]);
          
        if (expiryError) throw expiryError;
        
        // Fetch expired medicines
        const { data: expiredData, error: expiredError } = await supabase
          .from('medicines')
          .select('*, vendors(*)')
          .lte('expiry_date', today.toISOString().split('T')[0]);
          
        if (expiredError) throw expiredError;
        
        setLowStockItems(lowStockItems as MedicineWithVendor[]);
        setExpiryAlertItems(expiryData as MedicineWithVendor[] || []);
        setOutOfStockItems(outOfStockData as MedicineWithVendor[] || []);
        setExpiredItems(expiredData as MedicineWithVendor[] || []);
        
      } catch (error) {
        console.error("Error fetching alerts:", error);
        toast.error("Failed to load alerts");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAlerts();
  }, []);

  const getExpiryStatus = (expiryDateStr: string) => {
    const expiryDate = new Date(expiryDateStr);
    const now = new Date();
    
    if (expiryDate <= now) {
      return { status: "Expired", className: "bg-red-100 text-red-800" };
    } else {
      const daysToExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { 
        status: `Expires in ${daysToExpiry} days`, 
        className: daysToExpiry <= 7 ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800" 
      };
    }
  };

  const getTabItemCount = (tab: string) => {
    switch(tab) {
      case 'low-stock':
        return lowStockItems.length + outOfStockItems.length;
      case 'expiry':
        return expiryAlertItems.length + expiredItems.length;
      default:
        return 0;
    }
  };

  return {
    lowStockItems,
    expiryAlertItems,
    outOfStockItems,
    expiredItems,
    isLoading,
    getExpiryStatus,
    getTabItemCount
  };
};
