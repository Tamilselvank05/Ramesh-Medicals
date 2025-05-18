
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PieChartIcon,
  Pill,
  AlertTriangle,
  Package,
  TrendingUp,
  Receipt
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, subMonths, subYears, parseISO, startOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month" | "year">("month");
  const [medicineCount, setMedicineCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [expiryAlertCount, setExpiryAlertCount] = useState(0);
  const [expiredCount, setExpiredCount] = useState(0);
  const [salesData, setSalesData] = useState<{
    totalSales: number;
    invoiceCount: number;
    chartData: { date: string; amount: number }[];
  }>({ totalSales: 0, invoiceCount: 0, chartData: [] });
  const [isLoading, setIsLoading] = useState(true);

  // Load medicine counts
  useEffect(() => {
    const fetchMedicineCounts = async () => {
      try {
        // Get total medicine count
        const { count: totalCount, error: totalError } = await supabase
          .from('medicines')
          .select('*', { count: 'exact' });

        if (totalError) throw totalError;
        setMedicineCount(totalCount || 0);

        // Get low stock count (between 1 and 50 items)
        const { count: lowCount, error: lowError } = await supabase
          .from('medicines')
          .select('*', { count: 'exact' })
          .gt('stock', 0)
          .lte('stock', 50);

        if (lowError) throw lowError;
        setLowStockCount(lowCount || 0);
        
        // Get out of stock count (0 items)
        const { count: outCount, error: outError } = await supabase
          .from('medicines')
          .select('*', { count: 'exact' })
          .eq('stock', 0);

        if (outError) throw outError;
        setOutOfStockCount(outCount || 0);

        // Get expiry alert count (within 30 days)
        const today = new Date();
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(today.getDate() + 30);
        
        const { count: expiryCount, error: expiryError } = await supabase
          .from('medicines')
          .select('*', { count: 'exact' })
          .gt('expiry_date', today.toISOString().split('T')[0])
          .lte('expiry_date', thirtyDaysLater.toISOString().split('T')[0]);

        if (expiryError) throw expiryError;
        setExpiryAlertCount(expiryCount || 0);
        
        // Get expired count
        const { count: expiredMedicineCount, error: expiredError } = await supabase
          .from('medicines')
          .select('*', { count: 'exact' })
          .lte('expiry_date', today.toISOString().split('T')[0]);

        if (expiredError) throw expiredError;
        setExpiredCount(expiredMedicineCount || 0);
        
      } catch (error) {
        console.error("Error fetching medicine data:", error);
      }
    };

    fetchMedicineCounts();
  }, []);

  // Load sales data based on time range
  useEffect(() => {
    const fetchSalesData = async () => {
      setIsLoading(true);
      
      try {
        const today = new Date();
        let startDate: Date;
        
        switch (timeRange) {
          case "today":
            startDate = startOfDay(today);
            break;
          case "week":
            startDate = subDays(today, 7);
            break;
          case "month":
            startDate = subMonths(today, 1);
            break;
          case "year":
            startDate = subYears(today, 1);
            break;
          default:
            startDate = subMonths(today, 1);
        }
        
        // Get all invoices in the date range
        const { data: invoices, error: invoiceError } = await supabase
          .from('invoices')
          .select('*')
          .gte('date', startDate.toISOString())
          .lte('date', today.toISOString())
          .order('date', { ascending: true });
          
        if (invoiceError) throw invoiceError;
        
        // Calculate total sales
        const totalSales = invoices?.reduce((sum, invoice) => sum + (invoice.total || 0), 0) || 0;
        const invoiceCount = invoices?.length || 0;
        
        // Group by date for chart
        const chartData = groupInvoicesByDate(invoices || [], timeRange);
        
        setSalesData({
          totalSales,
          invoiceCount,
          chartData
        });
      } catch (error) {
        console.error("Error fetching sales data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSalesData();
  }, [timeRange]);

  // Group invoices by date for the chart
  const groupInvoicesByDate = (invoices: any[], timeRange: string) => {
    const dateFormat = timeRange === 'year' ? 'MMM yyyy' : timeRange === 'month' ? 'dd MMM' : 'HH:mm';
    const groupedData: Record<string, number> = {};
    
    invoices.forEach(invoice => {
      const date = parseISO(invoice.date);
      const formattedDate = format(date, dateFormat);
      
      if (!groupedData[formattedDate]) {
        groupedData[formattedDate] = 0;
      }
      
      groupedData[formattedDate] += invoice.total || 0;
    });
    
    // Convert to array format for the chart
    return Object.entries(groupedData).map(([date, amount]) => ({
      date,
      amount
    }));
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return dateString;
  };
  
  const navigateToAlerts = () => {
    navigate('/admin/alerts');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Medicines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Pill className="h-8 w-8 text-blue-500 mr-2" />
              <span className="text-3xl font-bold">
                {medicineCount}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={`shadow-sm hover:shadow-md transition-shadow ${(lowStockCount > 0 || outOfStockCount > 0) ? 'border-amber-300' : ''}`}
          onClick={navigateToAlerts}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between">
              <span>Stock Alerts</span>
              {(lowStockCount > 0 || outOfStockCount > 0) && (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-amber-500 mr-2" />
                <span className="text-3xl font-bold">
                  {lowStockCount + outOfStockCount}
                </span>
              </div>
              {outOfStockCount > 0 && (
                <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
                  {outOfStockCount} out of stock
                </span>
              )}
            </div>
            {lowStockCount > 0 && (
              <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded-full mt-2 inline-block">
                {lowStockCount} low stock
              </span>
            )}
          </CardContent>
        </Card>
        
        <Card 
          className={`shadow-sm hover:shadow-md transition-shadow ${(expiryAlertCount > 0 || expiredCount > 0) ? 'border-red-300' : ''}`}
          onClick={navigateToAlerts}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between">
              <span>Expiry Alerts</span>
              {(expiryAlertCount > 0 || expiredCount > 0) && (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-red-500 mr-2" />
                <span className="text-3xl font-bold">
                  {expiryAlertCount + expiredCount}
                </span>
              </div>
              {expiredCount > 0 && (
                <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
                  {expiredCount} expired
                </span>
              )}
            </div>
            {expiryAlertCount > 0 && (
              <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded-full mt-2 inline-block">
                {expiryAlertCount} expiring soon
              </span>
            )}
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Sales ({timeRange})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-500 mr-2" />
              <span className="text-3xl font-bold">
                {formatCurrency(salesData.totalSales)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-bold">Sales Overview</CardTitle>
            <Tabs 
              value={timeRange}
              onValueChange={(value) => setTimeRange(value as any)}
              className="w-[300px]"
            >
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="year">Year</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p>Loading sales data...</p>
            </div>
          ) : salesData.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  minTickGap={20}
                />
                <YAxis 
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip 
                  formatter={(value) => [`₹${value}`, "Sales"]}
                  labelFormatter={(label) => formatDate(label)}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#1E88E5"
                  strokeWidth={2}
                  dot={{ fill: "#1E88E5", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p>No sales data available for the selected period.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Invoice Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <Receipt className="h-8 w-8 text-purple-500 mr-2" />
            <div>
              <div className="text-3xl font-bold">{salesData.invoiceCount}</div>
              <div className="text-sm text-gray-500">Total Invoices ({timeRange})</div>
            </div>
            <div className="ml-auto text-xl font-semibold">
              {formatCurrency(salesData.totalSales)}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {(lowStockCount > 0 || outOfStockCount > 0 || expiryAlertCount > 0 || expiredCount > 0) && (
        <div className="w-full flex justify-center">
          <Button 
            onClick={navigateToAlerts}
            className="bg-amber-500 hover:bg-amber-600"
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            View All Alerts
          </Button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
