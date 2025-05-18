
import { User, UserRole } from "../contexts/AuthContext";

// Types
export interface Medicine {
  id: string;
  name: string;
  stock: number;
  price: number;
  tax: number; // percentage
  expiryDate: string; // ISO date string
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
}

export interface InvoiceItem {
  medicineId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  tax: number; // percentage
  subtotal: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string; // ISO date string
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: InvoiceItem[];
  subtotal: number;
  taxTotal: number;
  total: number;
  paymentMethod: "cash" | "upi" | "card";
  amountReceived?: number;
  changeReturned?: number;
  billerId: string;
  billerName: string;
}

// Mock data
const generateMockMedicines = (): Medicine[] => {
  const now = new Date();
  const twoMonthsFromNow = new Date();
  twoMonthsFromNow.setMonth(now.getMonth() + 2);
  
  const expired = new Date();
  expired.setMonth(now.getMonth() - 1);
  
  const nearExpiry = new Date();
  nearExpiry.setDate(now.getDate() + 15);
  
  const nextYear = new Date();
  nextYear.setFullYear(now.getFullYear() + 1);
  
  return [
    {
      id: "med1",
      name: "Paracetamol 500mg",
      stock: 120,
      price: 15.50,
      tax: 12,
      expiryDate: nextYear.toISOString()
    },
    {
      id: "med2",
      name: "Amoxicillin 250mg",
      stock: 85,
      price: 25.75,
      tax: 12,
      expiryDate: nextYear.toISOString()
    },
    {
      id: "med3",
      name: "Cetirizine 10mg",
      stock: 45,
      price: 12.00,
      tax: 12,
      expiryDate: nextYear.toISOString()
    },
    {
      id: "med4",
      name: "Omeprazole 20mg",
      stock: 8, // Low stock
      price: 35.50,
      tax: 12,
      expiryDate: nextYear.toISOString()
    },
    {
      id: "med5",
      name: "Aspirin 75mg",
      stock: 150,
      price: 8.25,
      tax: 12,
      expiryDate: nearExpiry.toISOString() // Near expiry
    },
    {
      id: "med6",
      name: "Diclofenac Gel",
      stock: 30,
      price: 45.00,
      tax: 18,
      expiryDate: expired.toISOString() // Expired
    },
    {
      id: "med7",
      name: "Vitamin D3",
      stock: 0, // Out of stock
      price: 120.50,
      tax: 5,
      expiryDate: nextYear.toISOString()
    },
    {
      id: "med8",
      name: "Multivitamin Tablets",
      stock: 25,
      price: 180.00,
      tax: 5,
      expiryDate: nextYear.toISOString()
    }
  ];
};

const generateMockUsers = (): User[] => {
  return [
    {
      id: "1",
      username: "admin",
      role: "admin" as UserRole,
      email: "admin@rameshmedicals.com",
      phone: "9876543210"
    },
    {
      id: "2",
      username: "biller",
      role: "biller" as UserRole,
      email: "biller@rameshmedicals.com",
      phone: "9876543211"
    },
    {
      id: "3",
      username: "susan",
      role: "biller" as UserRole,
      email: "susan@rameshmedicals.com",
      phone: "9876543212"
    }
  ];
};

// Generate invoices for the past 30 days
const generateMockInvoices = (): Invoice[] => {
  const invoices: Invoice[] = [];
  const now = new Date();
  
  // Generate 30 invoices, one per day for the past 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(now.getDate() - i);
    
    // Generate between 1 and 5 invoices per day
    const invoicesPerDay = Math.floor(Math.random() * 5) + 1;
    
    for (let j = 0; j < invoicesPerDay; j++) {
      const billerId = Math.random() > 0.5 ? "2" : "3";
      const billerName = billerId === "2" ? "biller" : "susan";
      
      const customerNames = ["Raj Kumar", "Preeti Singh", "Anand Verma", "Sanjay Patel", "Meera Shah"];
      const customerName = customerNames[Math.floor(Math.random() * customerNames.length)];
      
      // Generate a random phone number
      const phone = `98${Math.floor(Math.random() * 10000000).toString().padStart(8, '0')}`;
      
      // Generate between 1 and 3 items per invoice
      const itemCount = Math.floor(Math.random() * 3) + 1;
      const items: InvoiceItem[] = [];
      let subtotal = 0;
      let taxTotal = 0;
      
      // Available medicines (not expired, in stock)
      const medicines = generateMockMedicines().filter(m => 
        new Date(m.expiryDate) > now && m.stock > 0
      );
      
      for (let k = 0; k < itemCount; k++) {
        if (medicines.length === 0) break;
        
        const medicineIndex = Math.floor(Math.random() * medicines.length);
        const medicine = medicines[medicineIndex];
        
        // Remove used medicine to avoid duplicates
        medicines.splice(medicineIndex, 1);
        
        const quantity = Math.min(
          Math.floor(Math.random() * 5) + 1,
          medicine.stock
        );
        
        const itemSubtotal = medicine.price * quantity;
        const itemTax = itemSubtotal * (medicine.tax / 100);
        
        items.push({
          medicineId: medicine.id,
          name: medicine.name,
          quantity,
          unitPrice: medicine.price,
          tax: medicine.tax,
          subtotal: itemSubtotal
        });
        
        subtotal += itemSubtotal;
        taxTotal += itemTax;
      }
      
      const total = subtotal + taxTotal;
      
      // Payment method
      const paymentMethods = ["cash", "upi", "card"] as const;
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      
      // For cash payment, generate amount received and change
      let amountReceived = undefined;
      let changeReturned = undefined;
      
      if (paymentMethod === "cash") {
        // Round up to nearest 100 or 50 for realistic cash amount
        const roundUpBase = Math.random() > 0.5 ? 100 : 50;
        amountReceived = Math.ceil(total / roundUpBase) * roundUpBase;
        changeReturned = amountReceived - total;
      }
      
      // Generate invoice number: RM + YYYYMMDD + random number
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const invoiceNumber = `RM${year}${month}${day}${random}`;
      
      invoices.push({
        id: `inv${i}${j}`,
        invoiceNumber,
        date: date.toISOString(),
        customerId: `cust${i}${j}`,
        customerName,
        customerPhone: phone,
        items,
        subtotal,
        taxTotal,
        total,
        paymentMethod,
        amountReceived,
        changeReturned,
        billerId,
        billerName
      });
    }
  }
  
  return invoices;
};

// Initialize data
let medicines = generateMockMedicines();
let users = generateMockUsers();
let invoices = generateMockInvoices();

// Export data access functions
export const getMedicines = () => [...medicines];

export const getMedicineById = (id: string) => 
  medicines.find(m => m.id === id);

export const addMedicine = (medicine: Omit<Medicine, "id">) => {
  const newMedicine = {
    ...medicine,
    id: `med${Date.now()}` // Generate a unique ID
  };
  medicines.push(newMedicine);
  return newMedicine;
};

export const updateMedicine = (medicine: Medicine) => {
  const index = medicines.findIndex(m => m.id === medicine.id);
  if (index !== -1) {
    medicines[index] = medicine;
    return true;
  }
  return false;
};

export const deleteMedicine = (id: string) => {
  const index = medicines.findIndex(m => m.id === id);
  if (index !== -1) {
    medicines.splice(index, 1);
    return true;
  }
  return false;
};

// User functions
export const getUsers = () => [...users];

export const getUserById = (id: string) => 
  users.find(u => u.id === id);

export const addUser = (user: Omit<User, "id">) => {
  const newUser = {
    ...user,
    id: `user${Date.now()}` // Generate a unique ID
  };
  users.push(newUser);
  return newUser;
};

export const updateUser = (user: User) => {
  const index = users.findIndex(u => u.id === user.id);
  if (index !== -1) {
    users[index] = user;
    return true;
  }
  return false;
};

export const deleteUser = (id: string) => {
  const index = users.findIndex(u => u.id === id);
  if (index !== -1) {
    users.splice(index, 1);
    return true;
  }
  return false;
};

// Invoice functions
export const getInvoices = () => [...invoices];

export const getInvoiceById = (id: string) => 
  invoices.find(i => i.id === id);

export const addInvoice = (invoiceData: Omit<Invoice, "id" | "invoiceNumber">) => {
  // Generate invoice number: RM + YYYYMMDD + random number
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const invoiceNumber = `RM${year}${month}${day}${random}`;
  
  const newInvoice = {
    ...invoiceData,
    id: `inv${Date.now()}`, // Generate a unique ID
    invoiceNumber,
  };
  
  // Update medicine stock
  newInvoice.items.forEach(item => {
    const medicine = medicines.find(m => m.id === item.medicineId);
    if (medicine) {
      medicine.stock -= item.quantity;
    }
  });
  
  invoices.push(newInvoice);
  return newInvoice;
};

// Return low stock medicines (less than 10 units)
export const getLowStockMedicines = () => 
  medicines.filter(m => m.stock < 10 && m.stock > 0);

// Return expired or near expiry (30 days) medicines
export const getExpiryAlertMedicines = () => {
  const now = new Date();
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(now.getDate() + 30);
  
  return medicines.filter(m => {
    const expiryDate = new Date(m.expiryDate);
    return expiryDate <= thirtyDaysLater;
  });
};

// Get sales data for dashboard
export const getSalesData = (startDate?: Date, endDate?: Date) => {
  let filteredInvoices = [...invoices];
  
  if (startDate && endDate) {
    filteredInvoices = filteredInvoices.filter(invoice => {
      const invoiceDate = new Date(invoice.date);
      return invoiceDate >= startDate && invoiceDate <= endDate;
    });
  }
  
  // Calculate total sales
  const totalSales = filteredInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
  
  // Sales by date for chart
  const salesByDate = filteredInvoices.reduce<Record<string, number>>((acc, invoice) => {
    const date = new Date(invoice.date).toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + invoice.total;
    return acc;
  }, {});
  
  // Convert to chart data format
  const chartData = Object.entries(salesByDate).map(([date, amount]) => ({
    date,
    amount
  }));
  
  return {
    totalSales,
    invoiceCount: filteredInvoices.length,
    chartData: chartData.sort((a, b) => a.date.localeCompare(b.date))
  };
};

// Reset the data (for testing)
export const resetData = () => {
  medicines = generateMockMedicines();
  users = generateMockUsers();
  invoices = generateMockInvoices();
};
