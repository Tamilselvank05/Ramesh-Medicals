
import { useState } from "react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader
} from "@/components/ui/card";
import {
  AlertTriangle,
  Clock
} from "lucide-react";
import { AlertsHeader } from "@/components/alerts/AlertsHeader";
import { StockAlertTable } from "@/components/alerts/StockAlertTable";
import { ExpiryAlertTable } from "@/components/alerts/ExpiryAlertTable";
import { useAlerts } from "@/hooks/useAlerts";

const Alerts = () => {
  const [activeTab, setActiveTab] = useState("low-stock");
  
  const {
    lowStockItems,
    expiryAlertItems,
    outOfStockItems,
    expiredItems,
    isLoading,
    getExpiryStatus,
    getTabItemCount
  } = useAlerts();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Alerts & Notifications</h1>
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="low-stock" className="flex items-center">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Stock Alerts ({getTabItemCount('low-stock')})
          </TabsTrigger>
          <TabsTrigger value="expiry" className="flex items-center">
            <Clock className="mr-2 h-4 w-4" />
            Expiry Alerts ({getTabItemCount('expiry')})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="low-stock">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <AlertsHeader
                title="Stock Alert"
                description="Medicines with stock level below 50 units or out of stock."
                items={[...lowStockItems, ...outOfStockItems]}
                reportTitle="Stock Alerts"
                filename="stock-alerts"
              />
            </CardHeader>
            <CardContent>
              <StockAlertTable 
                outOfStockItems={outOfStockItems} 
                lowStockItems={lowStockItems}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="expiry">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <AlertsHeader
                title="Expiry Alert"
                description="Medicines that have expired or will expire in the next 30 days."
                items={[...expiryAlertItems, ...expiredItems]}
                reportTitle="Expiry Alerts"
                filename="expiry-alerts"
              />
            </CardHeader>
            <CardContent>
              <ExpiryAlertTable 
                expiredItems={expiredItems}
                expiryAlertItems={expiryAlertItems}
                isLoading={isLoading}
                getExpiryStatus={getExpiryStatus}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Alerts;
