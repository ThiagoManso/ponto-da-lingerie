import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Category = 'Calcinha' | 'Sutiã' | 'Conjunto' | 'Body' | 'Pijama';
export type Size = 'P' | 'M' | 'G' | 'GG' | 'XG';
export type LocationType = 'CENTRAL' | 'FILIAL';

export interface Product {
  id: string;
  name: string;
  category: Category;
  sku: string;
  price: number;
  color: string;
  leadTime: number;
  safetyMargin: number;
  avgDailySales: number;
  orderCost: number;
  holdingCost: number;
}

export interface Location {
  id: string;
  name: string;
  type: LocationType;
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
}

export interface Sale {
  id: string;
  productId: string;
  locationId: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  date: string;
}

export interface TransferSuggestion {
  productId: string;
  size: Size;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  reason: string;
}

interface InventoryContextType {
  products: Product[];
  locations: Location[];
  stock: StockItem[];
  transfers: Transfer[];
  sales: Sale[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  addLocation: (location: Omit<Location, 'id'>) => void;
  updateStock: (productId: string, locationId: string, size: Size, quantityChange: number) => void;
  createTransfer: (transfer: Omit<Transfer, 'id' | 'date' | 'status'>) => void;
  completeTransfer: (transferId: string) => void;
  generateTransferSuggestions: () => TransferSuggestion[];
  registerSale: (sale: Omit<Sale, 'id' | 'date' | 'totalValue'>, size: Size) => void;
}

const initialProducts: Product[] = [
  { id: 'p1', name: 'Calcinha Renda Floral', category: 'Calcinha', sku: 'CAL-REN-001', price: 29.90, color: 'Vermelho', leadTime: 15, safetyMargin: 5, avgDailySales: 12, orderCost: 50, holdingCost: 5 },
  { id: 'p2', name: 'Sutiã Push Up Básico', category: 'Sutiã', sku: 'SUT-PU-002', price: 59.90, color: 'Preto', leadTime: 20, safetyMargin: 7, avgDailySales: 5, orderCost: 60, holdingCost: 10 },
  { id: 'p3', name: 'Conjunto Lingerie Luxo', category: 'Conjunto', sku: 'CON-LUX-003', price: 129.90, color: 'Branco', leadTime: 30, safetyMargin: 10, avgDailySales: 2, orderCost: 100, holdingCost: 25 },
  { id: 'p4', name: 'Body Renda com Tule', category: 'Body', sku: 'BOD-REN-004', price: 89.90, color: 'Vinho', leadTime: 25, safetyMargin: 7, avgDailySales: 3, orderCost: 80, holdingCost: 15 },
  { id: 'p5', name: 'Calcinha Algodão Conforto', category: 'Calcinha', sku: 'CAL-ALG-005', price: 19.90, color: 'Bege', leadTime: 10, safetyMargin: 3, avgDailySales: 25, orderCost: 40, holdingCost: 3 },
];

const initialLocations: Location[] = [
  { id: 'l1', name: 'Estoque Central', type: 'CENTRAL' },
  { id: 'l2', name: 'Filial Centro', type: 'FILIAL' },
  { id: 'l3', name: 'Filial Shopping', type: 'FILIAL' },
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
  { id: 't1', productId: 'p1', fromLocationId: 'l1', toLocationId: 'l2', size: 'M', quantity: 10, date: new Date().toISOString(), status: 'COMPLETED' },
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

  const registerSale = (sale: Omit<Sale, 'id' | 'date' | 'totalValue'>, size: Size) => {
    // Deduct stock
    updateStock(sale.productId, sale.locationId, size, -sale.quantity);
    
    const newSale: Sale = {
      ...sale,
      id: `sale${Date.now()}`,
      date: new Date().toISOString(),
      totalValue: sale.quantity * sale.unitPrice
    };
    setSales([...sales, newSale]);
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
      products, locations, stock, transfers, sales,
      addProduct, addLocation, updateStock, createTransfer, completeTransfer, generateTransferSuggestions, registerSale
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
