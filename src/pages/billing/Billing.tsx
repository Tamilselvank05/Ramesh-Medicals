import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { toast } from "sonner";
import { ShoppingCart, Trash2, Plus, Printer, AlertCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { InvoiceItemsDisplay } from "@/components/InvoiceItemsDisplay";
import * as printHandler from "@/utils/printHandler";
import { format } from "date-fns";

interface Medicine {
  id: string;
  name: string;
  stock: number;
  price: number;
  tax: number;
  expiry_date: string;
  prescription_required?: boolean;
  vendor_id?: string;
  discount: number;
}

interface InvoiceItem {
  medicineId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  tax: number;
  discount: number;
  subtotal: number;
}

const Billing = () => {
  const { currentUser } = useAuth();
  const [availableMedicines, setAvailableMedicines] = useState<Medicine[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [cartItems, setCartItems] = useState<InvoiceItem[]>([]);
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [phoneError, setPhoneError] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi" | "card">("cash");
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [showInvoice, setShowInvoice] = useState<boolean>(false);
  const [currentInvoice, setCurrentInvoice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false);
  const [pendingMedicine, setPendingMedicine] = useState<Medicine | null>(null);
  
  // Initial data load
  useEffect(() => {
    fetchMedicines();
  }, []);
  
  const fetchMedicines = async () => {
    setIsLoading(true);
    try {
      // Get only non-expired and in-stock medicines
      const now = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .gt('expiry_date', now)
        .gt('stock', 0)
        .order('name');

      if (error) {
        throw error;
      }
      
      setAvailableMedicines(data || []);
    } catch (error) {
      console.error("Error fetching medicines:", error);
      toast.error("Failed to load medicines");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate cart totals
  const calculateTotals = () => {
    const subtotal = cartItems.reduce((total, item) => total + item.subtotal, 0);
    const taxTotal = cartItems.reduce((total, item) => total + (item.subtotal * (item.tax / 100)), 0);
    const total = subtotal + taxTotal;
    
    return {
      subtotal,
      taxTotal,
      total
    };
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };
  
  const formatDate = (date: Date | string) => {
    return format(new Date(date), "dd/MM/yyyy h:mm a");
  };
  
  // Handle medicine selection
  const handleMedicineChange = (medicineId: string) => {
    setSelectedMedicine(medicineId);
    setQuantity(1);
  };
  
  // Validate phone number
  const validatePhoneNumber = (phoneNumber: string): boolean => {
    const phoneRegex = /^\d{10,12}$/;
    const isValid = phoneRegex.test(phoneNumber);
    
    if (!isValid) {
      setPhoneError("Phone number must be 10-12 digits with no other characters");
    } else {
      setPhoneError("");
    }
    
    return isValid;
  };
  
  // Handle adding to cart
  const handleAddToCart = () => {
    if (!selectedMedicine || quantity <= 0) {
      toast.error("Please select a medicine and valid quantity");
      return;
    }
    
    const medicine = availableMedicines.find(m => m.id === selectedMedicine);
    if (!medicine) {
      toast.error("Medicine not found");
      return;
    }
    
    // Check if this medicine requires a prescription
    if (medicine.prescription_required) {
      setPendingMedicine(medicine);
      setShowPrescriptionDialog(true);
      return;
    }
    
    addMedicineToCart(medicine);
  };
  
  // Handle prescription confirmation
  const handlePrescriptionConfirmed = () => {
    if (pendingMedicine) {
      addMedicineToCart(pendingMedicine);
      setPendingMedicine(null);
    }
    setShowPrescriptionDialog(false);
  };
  
  // Add medicine to cart
  const addMedicineToCart = (medicine: Medicine) => {
    // Check if we have enough stock
    if (medicine.stock < quantity) {
      toast.error(`Not enough stock. Available: ${medicine.stock}`);
      return;
    }
    
    // Check if medicine is already in cart
    const existingItemIndex = cartItems.findIndex(item => item.medicineId === medicine.id);
    
    // Calculate price after discount
    const discountPercentage = medicine.discount || 0;
    const discountedPrice = medicine.price * (1 - discountPercentage / 100);
    
    if (existingItemIndex > -1) {
      // Update existing item
      const updatedItems = [...cartItems];
      const newQuantity = updatedItems[existingItemIndex].quantity + quantity;
      
      // Check total quantity against available stock
      if (medicine.stock < newQuantity) {
        toast.error(`Not enough stock. Available: ${medicine.stock}`);
        return;
      }
      
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: newQuantity,
        subtotal: discountedPrice * newQuantity
      };
      
      setCartItems(updatedItems);
    } else {
      // Add new item
      const newItem: InvoiceItem = {
        medicineId: medicine.id,
        name: medicine.name,
        quantity: quantity,
        unitPrice: medicine.price,
        discount: discountPercentage || 0,
        tax: medicine.tax,
        subtotal: discountedPrice * quantity
      };
      
      setCartItems([...cartItems, newItem]);
    }
    
    // Reset selection
    setSelectedMedicine("");
    setQuantity(1);
    toast.success(`${medicine.name} added to cart`);
  };
  
  // Handle removing from cart
  const handleRemoveItem = (index: number) => {
    const updatedItems = [...cartItems];
    updatedItems.splice(index, 1);
    setCartItems(updatedItems);
  };
  
  // Handle payment method selection
  const handlePaymentMethodChange = (method: "cash" | "upi" | "card") => {
    setPaymentMethod(method);
    
    // Reset amount received if not cash
    if (method !== "cash") {
      setAmountReceived(calculateTotals().total);
    }
  };
  
  // Generate invoice
  const handleGenerateInvoice = async () => {
    // Validation
    if (cartItems.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    
    if (!customerName) {
      toast.error("Customer name is required");
      return;
    }
    
    if (customerPhone && !validatePhoneNumber(customerPhone)) {
      toast.error("Please enter a valid phone number (10-12 digits)");
      return;
    }
    
    if (paymentMethod === "cash" && amountReceived < calculateTotals().total) {
      toast.error("Amount received cannot be less than total amount");
      return;
    }
    
    // Calculate change if paying by cash
    let changeReturned;
    if (paymentMethod === "cash") {
      changeReturned = amountReceived - calculateTotals().total;
    }
    
    try {
      // Generate invoice number (simple timestamp-based for this example)
      const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;
      
      // Create invoice data
      const invoiceData = {
        invoice_number: invoiceNumber,
        biller_id: currentUser?.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        subtotal: calculateTotals().subtotal,
        tax_total: calculateTotals().taxTotal,
        total: calculateTotals().total,
        payment_method: paymentMethod,
        amount_received: paymentMethod === "cash" ? amountReceived : calculateTotals().total,
        change_returned: paymentMethod === "cash" ? changeReturned : null,
        date: new Date().toISOString()
      };
      
      // Insert into invoices table
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select()
        .single();
        
      if (invoiceError) throw invoiceError;
      
      // Now insert each item
      const invoiceItemsData = cartItems.map(item => ({
        invoice_id: invoice.id,
        medicine_id: item.medicineId,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        tax: item.tax,
        discount: item.discount || 0,
        subtotal: item.subtotal
      }));
      
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItemsData);
        
      if (itemsError) throw itemsError;
      
      // Update medicine stock
      for (const item of cartItems) {
        const medicine = availableMedicines.find(m => m.id === item.medicineId);
        if (medicine) {
          const newStock = medicine.stock - item.quantity;
          
          const { error: updateError } = await supabase
            .from('medicines')
            .update({ stock: newStock })
            .eq('id', item.medicineId);
            
          if (updateError) {
            console.error(`Failed to update stock for ${item.name}:`, updateError);
          }
        }
      }
      
      // Prepare display data
      const displayInvoice = {
        ...invoice,
        items: cartItems,
        billerName: currentUser?.username || ""
      };
      
      setCurrentInvoice(displayInvoice);
      setShowInvoice(true);
      
      // Reset cart
      setCartItems([]);
      setCustomerName("");
      setCustomerPhone("");
      setPaymentMethod("cash");
      setAmountReceived(0);
      
      // Refresh medicines list to get updated stock
      fetchMedicines();
      
      toast.success("Invoice generated successfully");
    } catch (error) {
      console.error("Error generating invoice:", error);
      toast.error("Failed to generate invoice");
    }
  };
  
  // Handle print invoice
  const handlePrintInvoice = () => {
    if (!currentInvoice) return;
    printHandler.handlePrintInvoice(currentInvoice);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Billing</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Product Selection */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Medicine Selection</CardTitle>
              <CardDescription>
                Select medicines to add to the invoice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="medicine">Select Medicine</Label>
                  <Select
                    value={selectedMedicine}
                    onValueChange={handleMedicineChange}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="medicine" className="border-gray-300">
                      <SelectValue placeholder={isLoading ? "Loading medicines..." : "Select a medicine"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMedicines.map(medicine => (
                        <SelectItem key={medicine.id} value={medicine.id}>
                          {medicine.name} (₹{medicine.price.toFixed(2)})
                          {medicine.prescription_required && " ⚕️"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                      className="flex-1 border-gray-300"
                    />
                    <Button 
                      onClick={handleAddToCart}
                      className="bg-medical-600 hover:bg-medical-700"
                      disabled={!selectedMedicine}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>
              
              {selectedMedicine && (
                <div className="bg-gray-50 p-4 rounded-md border border-gray-300">
                  <h3 className="font-medium mb-2">Product Details</h3>
                  {(() => {
                    const medicine = availableMedicines.find(m => m.id === selectedMedicine);
                    if (!medicine) return null;
                    
                    const discountedPrice = medicine.price * (1 - medicine.discount / 100);
                    
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Price</p>
                          <div>
                            {medicine.discount > 0 ? (
                              <>
                                <p className="font-medium line-through text-gray-400">₹{medicine.price.toFixed(2)}</p>
                                <p className="font-medium text-green-600">₹{discountedPrice.toFixed(2)}</p>
                              </>
                            ) : (
                              <p className="font-medium">₹{medicine.price.toFixed(2)}</p>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Discount</p>
                          <p className="font-medium">{medicine.discount > 0 ? 
                            <span className="text-green-600">{medicine.discount}%</span> : 
                            '0%'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Tax</p>
                          <p className="font-medium">{medicine.tax}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Available Stock</p>
                          <p className="font-medium">{medicine.stock}</p>
                        </div>
                        {medicine.prescription_required && (
                          <div className="md:col-span-3">
                            <Alert className="bg-purple-50 border-purple-200">
                              <AlertCircle className="h-4 w-4 text-purple-800" />
                              <AlertTitle className="text-purple-800">Prescription Required</AlertTitle>
                              <AlertDescription className="text-purple-700">
                                This medicine requires a valid prescription before it can be dispensed.
                              </AlertDescription>
                            </Alert>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Cart Items */}
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="flex items-center">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  <span>Cart Items</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cartItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Cart is empty. Add medicines to generate an invoice.
                </div>
              ) : (
                <div className="rounded-md border border-gray-300">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Medicine</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-center">Discount</TableHead>
                        <TableHead className="text-center">Tax</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cartItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">
                            {item.discount > 0 ? (
                              <>
                                <span className="line-through text-gray-400 text-xs">₹{item.unitPrice.toFixed(2)}</span>
                                <br />
                                <span>₹{(item.unitPrice * (1 - item.discount / 100)).toFixed(2)}</span>
                              </>
                            ) : (
                              <>₹{item.unitPrice.toFixed(2)}</>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {item.discount > 0 ? (
                              <span className="text-green-600">{item.discount}%</span>
                            ) : (
                              '0%'
                            )}
                          </TableCell>
                          <TableCell className="text-center">{item.tax}%</TableCell>
                          <TableCell className="text-right">₹{item.subtotal.toFixed(2)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(index)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            
            {cartItems.length > 0 && (
              <CardFooter className="flex justify-end border-t pt-6">
                <div className="text-right">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-500">
                      Subtotal: <span className="font-medium text-black">{formatCurrency(calculateTotals().subtotal)}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Tax: <span className="font-medium text-black">{formatCurrency(calculateTotals().taxTotal)}</span>
                    </div>
                    <div className="text-lg font-bold">
                      Total: {formatCurrency(calculateTotals().total)}
                    </div>
                  </div>
                </div>
              </CardFooter>
            )}
          </Card>
        </div>
        
        {/* Right Column - Customer & Payment */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
              <CardDescription>
                Enter customer information for the invoice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer-name">Customer Name</Label>
                <Input
                  id="customer-name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  className="border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-phone">Phone Number</Label>
                <Input
                  id="customer-phone"
                  value={customerPhone}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCustomerPhone(value);
                    if (value) validatePhoneNumber(value);
                  }}
                  placeholder="Enter phone number (10-12 digits)"
                  className={`border-gray-300 ${phoneError ? "border-red-500" : ""}`}
                />
                {phoneError && <p className="text-red-500 text-sm">{phoneError}</p>}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>
                Select payment method and enter amount
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                defaultValue="cash"
                value={paymentMethod}
                onValueChange={(v) => handlePaymentMethodChange(v as any)}
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="cash">Cash</TabsTrigger>
                  <TabsTrigger value="upi">UPI</TabsTrigger>
                  <TabsTrigger value="card">Card</TabsTrigger>
                </TabsList>
                
                <TabsContent value="cash" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount-received">Amount Received</Label>
                    <Input
                      id="amount-received"
                      type="number"
                      step="0.01"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
                      className="border-gray-300"
                    />
                  </div>
                  
                  {amountReceived >= calculateTotals().total && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                      <p className="text-green-800 text-sm font-medium">
                        Change to return: {formatCurrency(amountReceived - calculateTotals().total)}
                      </p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="upi" className="mt-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <p className="text-blue-800 text-sm">
                      Total amount to collect: <strong>{formatCurrency(calculateTotals().total)}</strong>
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="card" className="mt-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
                    <p className="text-purple-800 text-sm">
                      Total amount to collect: <strong>{formatCurrency(calculateTotals().total)}</strong>
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleGenerateInvoice}
                className="w-full bg-medical-600 hover:bg-medical-700"
                disabled={cartItems.length === 0}
              >
                Generate Invoice
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      {/* Prescription Required Dialog */}
      <Dialog open={showPrescriptionDialog} onOpenChange={setShowPrescriptionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Prescription Required</DialogTitle>
            <DialogDescription className="text-gray-600">
              This medicine requires a valid prescription before it can be dispensed.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Alert className="bg-purple-50 border-purple-300">
              <AlertCircle className="h-5 w-5 text-purple-800" />
              <AlertTitle className="text-purple-900 font-medium">
                Prescription verification required
              </AlertTitle>
              <AlertDescription className="text-purple-800">
                {pendingMedicine?.name} requires a valid prescription. Please ensure you have checked the prescription before proceeding.
              </AlertDescription>
            </Alert>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPrescriptionDialog(false)}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePrescriptionConfirmed}
              className="bg-medical-600 hover:bg-medical-700 text-white"
            >
              Confirm Prescription Checked
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Enhanced Invoice Preview Dialog */}
      <Dialog open={showInvoice} onOpenChange={setShowInvoice}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Invoice Preview</DialogTitle>
            <DialogDescription>
              Review your invoice before printing
            </DialogDescription>
          </DialogHeader>
          
          {currentInvoice && (
            <div className="invoice-preview p-4 bg-white rounded-lg border">
              {/* Invoice Header with Logo and Store Details */}
              <div className="text-center border-b pb-4">
                <div className="flex justify-center mb-2">
                  <img src="/logo.png" alt="Ramesh Medicals Logo" className="h-16 w-16" />
                </div>
                <h2 className="text-2xl font-bold">Ramesh Medicals</h2>
                <p className="text-sm">Medical Store & Pharmacy</p>
                <p className="text-sm">Anaimalai - Poolankinar Rd, Erisinampatti,</p>
                <p className="text-sm">Tamil Nadu 642207</p>
                <p className="text-sm">Phone: 9443654109 | Email: r.mailtoramesh@gmail.com</p>
              </div>
              
              {/* Invoice Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
                <div>
                  <h3 className="font-semibold mb-1">Invoice Information:</h3>
                  <p className="text-sm"><strong>Invoice #:</strong> {currentInvoice.invoice_number}</p>
                  <p className="text-sm"><strong>Date:</strong> {formatDate(currentInvoice.date)}</p>
                  <p className="text-sm"><strong>Biller:</strong> {currentInvoice.billerName}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Customer Information:</h3>
                  <p className="text-sm"><strong>Name:</strong> {currentInvoice.customer_name}</p>
                  <p className="text-sm"><strong>Phone:</strong> {currentInvoice.customer_phone || 'N/A'}</p>
                  <p className="text-sm"><strong>Payment Method:</strong> <span className="capitalize">{currentInvoice.payment_method}</span></p>
                </div>
              </div>
              
              {/* Invoice Items */}
              <div className="my-4">
                <h3 className="font-semibold mb-2">Items Purchased:</h3>
                <div className="rounded-md border my-2">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="text-xs font-medium">Item</TableHead>
                        <TableHead className="text-xs font-medium text-center">Qty</TableHead>
                        <TableHead className="text-xs font-medium text-right">Unit Price</TableHead>
                        <TableHead className="text-xs font-medium text-center">Discount</TableHead>
                        <TableHead className="text-xs font-medium text-right">Tax</TableHead>
                        <TableHead className="text-xs font-medium text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentInvoice.items.map((item: InvoiceItem, index: number) => (
                        <TableRow key={index} className="text-sm">
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">
                            {item.discount > 0 ? (
                              <>
                                <span className="line-through text-gray-400 text-xs">₹{item.unitPrice.toFixed(2)}</span>
                                <br />
                                <span>₹{(item.unitPrice * (1 - item.discount / 100)).toFixed(2)}</span>
                              </>
                            ) : (
                              <>₹{item.unitPrice.toFixed(2)}</>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {item.discount > 0 ? (
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
              </div>
              
              {/* Payment Totals */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2 mt-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>₹{currentInvoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax:</span>
                  <span>₹{currentInvoice.tax_total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold">
                  <span>Total:</span>
                  <span>₹{currentInvoice.total.toFixed(2)}</span>
                </div>

                {currentInvoice.payment_method === "cash" && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Amount Received:</span>
                      <span>₹{currentInvoice.amount_received?.toFixed(2) || "0.00"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Change:</span>
                      <span>₹{currentInvoice.change_returned?.toFixed(2) || "0.00"}</span>
                    </div>
                  </>
                )}
              </div>
              
              {/* Thank You Note */}
              <div className="mt-8 text-center border-t pt-4">
                <p className="text-sm font-medium">Thank you for your purchase!</p>
                <p className="text-xs text-gray-500 mt-1">Visit again soon</p>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex justify-between items-center mt-4 pt-2 border-t">
            <Button
              variant="outline"
              onClick={() => setShowInvoice(false)}
              className="border-gray-300"
            >
              Close
            </Button>
            <Button
              onClick={handlePrintInvoice}
              className="bg-medical-600 hover:bg-medical-700"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Billing;
