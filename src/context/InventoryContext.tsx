import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Category = 'Calcinha' | 'Sutiã' | 'Conjunto' | 'Body' | 'Pijama';
export type Size = 'P' | 'M' | 'G' | 'GG' | 'XG';
export type LocationType = 'CENTRAL' | 'FILIAL';

export interface Product {
  id: string;
  name: string;
  category: Category;
  sku: string;
  price: number;
  costPrice: number;
  customMargin?: number;
  color: string;
  leadTime: number;
  safetyMargin: number;
  avgDailySales: number;
  orderCost: number;
  holdingCost: number;
  imageUrl?: string;
  type?: 'SIMPLE' | 'KIT';
  components?: { productId: string; quantity: number }[];
  warehouseAddress?: string;
}

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  address: string;
}

export interface StockItem {
  id: string;
  productId: string;
  locationId: string;
  size: Size;
  quantity: number;
}

export interface Transfer {
  id: string;
  productId: string;
  fromLocationId: string;
  toLocationId: string;
  size: Size;
  quantity: number;
  date: string;
  status: 'PENDING' | 'COMPLETED';
  shippingMethod: 'OWN_TRANSPORT' | 'CARRIER';
}

export interface Sale {
  id: string;
  receiptId?: string;
  productId: string;
  locationId: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  date: string;
  paymentMethod?: string;
  discount?: number;
}

export interface TransferSuggestion {
  productId: string;
  size: Size;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  reason: string;
}

export interface SeasonalEvent {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  type: 'GENERAL' | 'CATEGORY' | 'INDIVIDUAL';
  marginPercentage: number;
  targetCategories?: Category[];
  targetProductIds?: string[];
}

export interface CartItem {
  product: Product;
  size: Size;
  quantity: number;
}

interface InventoryContextType {
  products: Product[];
  locations: Location[];
  stock: StockItem[];
  transfers: Transfer[];
  sales: Sale[];
  seasonalEvents: SeasonalEvent[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  addLocation: (location: Omit<Location, 'id'>) => void;
  updateStock: (productId: string, locationId: string, size: Size, quantityChange: number) => void;
  createTransfer: (transfer: Omit<Transfer, 'id' | 'date' | 'status'>) => void;
  completeTransfer: (transferId: string) => void;
  completeRoute: (destinationId: string) => void;
  generateTransferSuggestions: () => TransferSuggestion[];
  registerSale: (sale: Omit<Sale, 'id' | 'date' | 'totalValue'>, size: Size) => void;
  processCheckout: (cartItems: CartItem[], locationId: string, paymentMethod: string, discount: number) => boolean;
  
  // POS Session
  isRegisterOpen: boolean;
  registerStartedAt: Date | null;
  registerClosedAt: Date | null;
  initialFloat: number;
  openRegister: (floatValue: number) => void;
  closeRegister: () => void;
  
  // Helper for Kits
  getAvailableStock: (productId: string, locationId?: string) => number;

  // Seasonality
  addSeasonalEvent: (event: Omit<SeasonalEvent, 'id'>) => void;
  removeSeasonalEvent: (id: string) => void;
  getEffectivePrice: (product: Product) => { price: number; activeEventName?: string };

  // Pricing Rules
  globalMargin: number;
  categoryMargins: Record<string, number>;
  updateGlobalMargin: (margin: number) => void;
  updateCategoryMargin: (category: string, margin: number) => void;
  calculateSuggestedPrice: (costPrice: number, category: Category, customMargin?: number) => number;

  visibleModules: Record<string, boolean>;
  toggleModule: (moduleId: string) => void;
}

const initialProducts: Product[] = [
  { id: 'p1', name: 'Calcinha Renda Floral', category: 'Calcinha', sku: 'CAL-REN-001', price: 29.90, costPrice: 15.00, color: 'Vermelho', leadTime: 15, safetyMargin: 5, avgDailySales: 12, orderCost: 50, holdingCost: 5 },
  { id: 'p2', name: 'Sutiã Push Up Básico', category: 'Sutiã', sku: 'SUT-PU-002', price: 59.90, costPrice: 30.00, color: 'Preto', leadTime: 20, safetyMargin: 7, avgDailySales: 5, orderCost: 60, holdingCost: 10 },
  { id: 'p3', name: 'Conjunto Lingerie Luxo', category: 'Conjunto', sku: 'CON-LUX-003', price: 129.90, costPrice: 60.00, color: 'Branco', leadTime: 30, safetyMargin: 10, avgDailySales: 2, orderCost: 100, holdingCost: 25 },
  { id: 'p4', name: 'Body Renda com Tule', category: 'Body', sku: 'BOD-REN-004', price: 89.90, costPrice: 45.00, color: 'Vinho', leadTime: 25, safetyMargin: 7, avgDailySales: 3, orderCost: 80, holdingCost: 15 },
  { id: 'p5', name: 'Calcinha Algodão Conforto', category: 'Calcinha', sku: 'CAL-ALG-005', price: 19.90, costPrice: 10.00, color: 'Bege', leadTime: 10, safetyMargin: 3, avgDailySales: 25, orderCost: 40, holdingCost: 3 },
];

const initialLocations: Location[] = [
  { id: 'l1', name: 'Estoque Central', type: 'CENTRAL', address: 'Rua da Indústria, 1000 - Distrito Industrial' },
  { id: 'l2', name: 'Filial Centro', type: 'FILIAL', address: 'Av. Principal, 500 - Centro' },
  { id: 'l3', name: 'Filial Shopping', type: 'FILIAL', address: 'Rodovia BR-101, Km 10 - Shopping Center, Loja 42' },
];

const initialStock: StockItem[] = [
  // Central
  { id: 's1', productId: 'p1', locationId: 'l1', size: 'M', quantity: 150 },
  { id: 's2', productId: 'p1', locationId: 'l1', size: 'G', quantity: 120 },
  { id: 's3', productId: 'p2', locationId: 'l1', size: 'M', quantity: 80 },
  { id: 's4', productId: 'p3', locationId: 'l1', size: 'P', quantity: 40 },
  { id: 's5', productId: 'p4', locationId: 'l1', size: 'G', quantity: 60 },
  { id: 's6', productId: 'p5', locationId: 'l1', size: 'M', quantity: 200 },
  // Filial Centro
  { id: 's7', productId: 'p1', locationId: 'l2', size: 'M', quantity: 30 },
  { id: 's8', productId: 'p2', locationId: 'l2', size: 'M', quantity: 15 },
  { id: 's9', productId: 'p5', locationId: 'l2', size: 'M', quantity: 50 },
  // Filial Shopping
  { id: 's10', productId: 'p1', locationId: 'l3', size: 'G', quantity: 25 },
  { id: 's11', productId: 'p3', locationId: 'l3', size: 'P', quantity: 10 },
  { id: 's12', productId: 'p4', locationId: 'l3', size: 'G', quantity: 20 },
];

const initialTransfers: Transfer[] = [
  { id: 't1', productId: 'p1', fromLocationId: 'l1', toLocationId: 'l2', size: 'M', quantity: 10, date: new Date().toISOString(), status: 'COMPLETED', shippingMethod: 'OWN_TRANSPORT' },
  { id: 't2', productId: 'p2', fromLocationId: 'l1', toLocationId: 'l3', size: 'M', quantity: 5, date: new Date().toISOString(), status: 'PENDING', shippingMethod: 'OWN_TRANSPORT' },
  { id: 't3', productId: 'p5', fromLocationId: 'l1', toLocationId: 'l3', size: 'M', quantity: 20, date: new Date().toISOString(), status: 'PENDING', shippingMethod: 'OWN_TRANSPORT' },
];

const now = new Date();
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

const initialSales: Sale[] = [
  { id: 'sale1', productId: 'p1', locationId: 'l1', quantity: 5, unitPrice: 29.90, totalValue: 149.50, date: daysAgo(2) },
  { id: 'sale2', productId: 'p2', locationId: 'l2', quantity: 2, unitPrice: 59.90, totalValue: 119.80, date: daysAgo(5) },
  { id: 'sale3', productId: 'p5', locationId: 'l3', quantity: 10, unitPrice: 19.90, totalValue: 199.00, date: daysAgo(15) },
  { id: 'sale4', productId: 'p3', locationId: 'l1', quantity: 1, unitPrice: 129.90, totalValue: 129.90, date: daysAgo(25) },
  { id: 'sale5', productId: 'p1', locationId: 'l2', quantity: 3, unitPrice: 29.90, totalValue: 89.70, date: daysAgo(40) },
  { id: 'sale6', productId: 'p4', locationId: 'l3', quantity: 2, unitPrice: 89.90, totalValue: 179.80, date: daysAgo(65) },
  { id: 'sale7', productId: 'p5', locationId: 'l1', quantity: 15, unitPrice: 19.90, totalValue: 298.50, date: daysAgo(1) },
  { id: 'sale8', productId: 'p2', locationId: 'l3', quantity: 4, unitPrice: 59.90, totalValue: 239.60, date: daysAgo(8) },
];

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [locations, setLocations] = useState<Location[]>(initialLocations);
  const [stock, setStock] = useState<StockItem[]>(initialStock);
  const [transfers, setTransfers] = useState<Transfer[]>(initialTransfers);
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [seasonalEvents, setSeasonalEvents] = useState<SeasonalEvent[]>([]);

  const [visibleModules, setVisibleModules] = useState<Record<string, boolean>>({
    pdv: true,
    dashboard: true,
    produtos: true,
    filiais: true,
    transferencias: true,
    roteirizacao: true,
    'curva-abc': true,
    sazonalidades: true,
    precificacao: true,
    relatorios: true,
    expedicao: true,
  });

  const toggleModule = (moduleId: string) => {
    setVisibleModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  // Pricing Rules State
  const [globalMargin, setGlobalMargin] = useState<number>(80);
  const [categoryMargins, setCategoryMargins] = useState<Record<string, number>>({
    'Calcinha': 100,
    'Sutiã': 90,
    'Conjunto': 120,
    'Body': 110,
    'Pijama': 85
  });

  const updateGlobalMargin = (margin: number) => setGlobalMargin(margin);
  
  const updateCategoryMargin = (category: string, margin: number) => {
    setCategoryMargins(prev => ({ ...prev, [category]: margin }));
  };

  const calculateSuggestedPrice = (costPrice: number, category: Category, customMargin?: number): number => {
    const appliedMargin = customMargin !== undefined && customMargin !== null 
      ? customMargin 
      : (categoryMargins[category] !== undefined ? categoryMargins[category] : globalMargin);
    
    return costPrice * (1 + (appliedMargin / 100));
  };

  // POS Session State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registerStartedAt, setRegisterStartedAt] = useState<Date | null>(null);
  const [registerClosedAt, setRegisterClosedAt] = useState<Date | null>(null);
  const [initialFloat, setInitialFloat] = useState<number>(0);

  const openRegister = (floatValue: number) => {
    setIsRegisterOpen(true);
    setRegisterStartedAt(new Date());
    setRegisterClosedAt(null);
    setInitialFloat(floatValue);
  };

  const closeRegister = () => {
    if (!isRegisterOpen) return;
    setIsRegisterOpen(false);
    setRegisterClosedAt(new Date());
  };

  // Auto-close logic
  useEffect(() => {
    // Check on initial load if opened on a previous day
    if (isRegisterOpen && registerStartedAt) {
      const today = new Date();
      const startedDate = new Date(registerStartedAt);
      if (
        startedDate.getDate() !== today.getDate() ||
        startedDate.getMonth() !== today.getMonth() ||
        startedDate.getFullYear() !== today.getFullYear()
      ) {
        closeRegister();
      }
    }

    const interval = setInterval(() => {
      if (isRegisterOpen) {
        const now = new Date();
        // Check if >= 23:59
        if (now.getHours() === 23 && now.getMinutes() >= 59) {
          closeRegister();
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isRegisterOpen, registerStartedAt]);

  const getAvailableStock = (productId: string, locationId?: string): number => {
    const product = products.find(p => p.id === productId);
    if (!product) return 0;

    if (product.type === 'KIT' && product.components && product.components.length > 0) {
      let maxKits = Infinity;
      for (const comp of product.components) {
        const compStock = getAvailableStock(comp.productId, locationId);
        const possibleKits = Math.floor(compStock / comp.quantity);
        if (possibleKits < maxKits) maxKits = possibleKits;
      }
      return maxKits === Infinity ? 0 : maxKits;
    } else {
      let relevantStock = stock.filter(s => s.productId === productId);
      if (locationId) {
        relevantStock = relevantStock.filter(s => s.locationId === locationId);
      }
      return relevantStock.reduce((sum, s) => sum + s.quantity, 0);
    }
  };

  const addSeasonalEvent = (event: Omit<SeasonalEvent, 'id'>) => {
    const newEvent = { ...event, id: `se${Date.now()}` };
    setSeasonalEvents([...seasonalEvents, newEvent]);
  };

  const removeSeasonalEvent = (id: string) => {
    setSeasonalEvents(seasonalEvents.filter(e => e.id !== id));
  };

  const getEffectivePrice = (product: Product): { price: number; activeEventName?: string } => {
    const now = new Date();
    
    // Find active events
    const activeEvents = seasonalEvents.filter(event => {
      const start = new Date(event.startDate);
      const end = new Date(event.endDate);
      return now >= start && now <= end;
    });

    if (activeEvents.length === 0) return { price: product.price };

    // Find the most specific applicable event
    // Priority: INDIVIDUAL > CATEGORY > GENERAL
    let applicableEvent: SeasonalEvent | undefined;

    // 1. Check INDIVIDUAL
    applicableEvent = activeEvents.find(e => e.type === 'INDIVIDUAL' && e.targetProductIds?.includes(product.id));
    
    // 2. Check CATEGORY
    if (!applicableEvent) {
      applicableEvent = activeEvents.find(e => e.type === 'CATEGORY' && e.targetCategories?.includes(product.category));
    }

    // 3. Check GENERAL
    if (!applicableEvent) {
      applicableEvent = activeEvents.find(e => e.type === 'GENERAL');
    }

    if (applicableEvent) {
      const adjustedPrice = product.price * (1 + applicableEvent.marginPercentage / 100);
      return { price: adjustedPrice, activeEventName: applicableEvent.name };
    }

    return { price: product.price };
  };

  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProduct = { ...product, id: `p${Date.now()}` };
    setProducts([...products, newProduct]);
  };

  const addLocation = (location: Omit<Location, 'id'>) => {
    const newLocation = { ...location, id: `l${Date.now()}` };
    setLocations([...locations, newLocation]);
  };

  const updateStock = (productId: string, locationId: string, size: Size, quantityChange: number) => {
    setStock(prevStock => {
      const existingStockIndex = prevStock.findIndex(
        s => s.productId === productId && s.locationId === locationId && s.size === size
      );

      if (existingStockIndex >= 0) {
        const newStock = [...prevStock];
        newStock[existingStockIndex] = {
          ...newStock[existingStockIndex],
          quantity: Math.max(0, newStock[existingStockIndex].quantity + quantityChange)
        };
        return newStock;
      } else if (quantityChange > 0) {
        return [...prevStock, {
          id: `s${Date.now()}`,
          productId,
          locationId,
          size,
          quantity: quantityChange
        }];
      }
      return prevStock;
    });
  };

  const createTransfer = (transfer: Omit<Transfer, 'id' | 'date' | 'status'>) => {
    // Check if enough stock in source
    const sourceStock = stock.find(s => s.productId === transfer.productId && s.locationId === transfer.fromLocationId && s.size === transfer.size);
    if (!sourceStock || sourceStock.quantity < transfer.quantity) {
      alert('Estoque insuficiente na origem para realizar a transferência.');
      return;
    }

    // Deduct from source immediately
    updateStock(transfer.productId, transfer.fromLocationId, transfer.size, -transfer.quantity);

    const newTransfer: Transfer = {
      ...transfer,
      id: `t${Date.now()}`,
      date: new Date().toISOString(),
      status: 'PENDING'
    };
    setTransfers([...transfers, newTransfer]);
  };

  const completeTransfer = (transferId: string) => {
    setTransfers(prevTransfers => {
      const newTransfers = [...prevTransfers];
      const transferIndex = newTransfers.findIndex(t => t.id === transferId);
      
      if (transferIndex >= 0 && newTransfers[transferIndex].status === 'PENDING') {
        const transfer = newTransfers[transferIndex];
        // Add to destination
        updateStock(transfer.productId, transfer.toLocationId, transfer.size, transfer.quantity);
        
        newTransfers[transferIndex] = { ...transfer, status: 'COMPLETED' };
      }
      return newTransfers;
    });
  };

  const completeRoute = (destinationId: string) => {
    setTransfers(prevTransfers => {
      const newTransfers = [...prevTransfers];
      let hasChanges = false;

      newTransfers.forEach((transfer, index) => {
        if (
          transfer.toLocationId === destinationId &&
          transfer.status === 'PENDING' &&
          transfer.shippingMethod === 'OWN_TRANSPORT'
        ) {
          // Add to destination
          updateStock(transfer.productId, transfer.toLocationId, transfer.size, transfer.quantity);
          newTransfers[index] = { ...transfer, status: 'COMPLETED' };
          hasChanges = true;
        }
      });

      return hasChanges ? newTransfers : prevTransfers;
    });
  };

  const registerSale = (sale: Omit<Sale, 'id' | 'date' | 'totalValue'>, size: Size) => {
    const product = products.find(p => p.id === sale.productId);
    
    // Deduct stock
    if (product?.type === 'KIT' && product.components) {
      product.components.forEach(comp => {
        updateStock(comp.productId, sale.locationId, size, -(sale.quantity * comp.quantity));
      });
    } else {
      updateStock(sale.productId, sale.locationId, size, -sale.quantity);
    }
    
    const newSale: Sale = {
      ...sale,
      id: `sale${Date.now()}`,
      date: new Date().toISOString(),
      totalValue: sale.quantity * sale.unitPrice
    };
    setSales([...sales, newSale]);
  };

  const processCheckout = (cartItems: CartItem[], locationId: string, paymentMethod: string, discount: number) => {
    const receiptId = `rec${Date.now()}`;
    const date = new Date().toISOString();
    
    const newSales: Sale[] = cartItems.map((item, index) => {
      // Deduct stock
      if (item.product.type === 'KIT' && item.product.components) {
        item.product.components.forEach(comp => {
          updateStock(comp.productId, locationId, item.size, -(item.quantity * comp.quantity));
        });
      } else {
        updateStock(item.product.id, locationId, item.size, -item.quantity);
      }
      
      const itemTotal = item.quantity * item.product.price;
      // Apply discount only on the first item to avoid double counting, 
      // or just distribute it. Let's just put it on the first item for simplicity.
      const itemDiscount = index === 0 ? discount : 0;
      
      return {
        id: `sale${Date.now()}-${index}`,
        receiptId,
        productId: item.product.id,
        locationId,
        quantity: item.quantity,
        unitPrice: item.product.price,
        totalValue: itemTotal - itemDiscount,
        date,
        paymentMethod,
        discount: itemDiscount
      };
    });

    setSales(prev => [...prev, ...newSales]);
    return true;
  };

  const generateTransferSuggestions = (): TransferSuggestion[] => {
    const suggestions: TransferSuggestion[] = [];
    const sizes: Size[] = ['P', 'M', 'G', 'GG', 'XG'];

    // Create a working copy of stock to simulate transfers
    const simulatedStock = [...stock];

    const getStockQty = (pId: string, lId: string, s: Size) => {
      return simulatedStock.filter(item => item.productId === pId && item.locationId === lId && item.size === s)
                           .reduce((sum, item) => sum + item.quantity, 0);
    };

    const deductSimulatedStock = (pId: string, lId: string, s: Size, qty: number) => {
      const index = simulatedStock.findIndex(item => item.productId === pId && item.locationId === lId && item.size === s);
      if (index >= 0) {
        simulatedStock[index] = { ...simulatedStock[index], quantity: simulatedStock[index].quantity - qty };
      }
    };

    products.forEach(product => {
      const safetyStock = product.avgDailySales * product.safetyMargin;
      const reorderPoint = (product.avgDailySales * product.leadTime) + safetyStock;
      const targetStock = Math.ceil(reorderPoint + safetyStock); // Nível seguro desejado

      sizes.forEach(size => {
        // a) Identificar Necessidades
        const needs: { locationId: string; neededQty: number }[] = [];
        locations.forEach(loc => {
          const currentQty = getStockQty(product.id, loc.id, size);
          if (currentQty <= reorderPoint) {
            needs.push({ locationId: loc.id, neededQty: targetStock - currentQty });
          }
        });

        if (needs.length === 0) return;

        // b) Identificar Excedentes
        const surpluses: { locationId: string; availableQty: number }[] = [];
        locations.forEach(loc => {
          const currentQty = getStockQty(product.id, loc.id, size);
          // Considera excedente o que está acima do ponto de pedido + margem
          const safeLevel = reorderPoint + safetyStock;
          if (currentQty > safeLevel) {
            surpluses.push({ locationId: loc.id, availableQty: currentQty - safeLevel });
          }
        });

        // Ordenar excedentes do maior para o menor
        surpluses.sort((a, b) => b.availableQty - a.availableQty);

        // c) Algoritmo de Combinação (Match)
        needs.forEach(need => {
          let remainingNeed = need.neededQty;

          for (let i = 0; i < surpluses.length; i++) {
            const surplus = surpluses[i];
            if (remainingNeed <= 0) break;
            if (surplus.availableQty <= 0) continue;

            const transferQty = Math.min(remainingNeed, surplus.availableQty);
            
            suggestions.push({
              productId: product.id,
              size,
              fromLocationId: surplus.locationId,
              toLocationId: need.locationId,
              quantity: Math.floor(transferQty),
              reason: `Estoque abaixo do mínimo (${getStockQty(product.id, need.locationId, size)} un). Reabastecimento inteligente.`
            });

            // Atualizar saldos simulados
            surplus.availableQty -= transferQty;
            remainingNeed -= transferQty;
            deductSimulatedStock(product.id, surplus.locationId, size, transferQty);
          }
        });
      });
    });

    return suggestions;
  };

  return (
    <InventoryContext.Provider value={{
      products, locations, stock, transfers, sales, seasonalEvents,
      addProduct, addLocation, updateStock, createTransfer, completeTransfer, completeRoute, generateTransferSuggestions, registerSale, processCheckout,
      isRegisterOpen, registerStartedAt, registerClosedAt, initialFloat, openRegister, closeRegister, getAvailableStock,
      addSeasonalEvent, removeSeasonalEvent, getEffectivePrice,
      globalMargin, categoryMargins, updateGlobalMargin, updateCategoryMargin, calculateSuggestedPrice,
      visibleModules, toggleModule
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
