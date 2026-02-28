import React, { useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Package, Store, TrendingUp, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const Dashboard: React.FC = () => {
  const { products, locations, stock, transfers } = useInventory();

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalStock = stock.reduce((acc, item) => acc + item.quantity, 0);
    const centralStock = stock
      .filter(s => locations.find(l => l.id === s.locationId)?.type === 'CENTRAL')
      .reduce((acc, item) => acc + item.quantity, 0);
    const branchStock = totalStock - centralStock;
    const pendingTransfers = transfers.filter(t => t.status === 'PENDING').length;

    return { totalProducts, totalStock, centralStock, branchStock, pendingTransfers };
  }, [products, locations, stock, transfers]);

  const stockByLocation = useMemo(() => {
    return locations.map(loc => {
      const locStock = stock.filter(s => s.locationId === loc.id).reduce((acc, item) => acc + item.quantity, 0);
      return {
        name: loc.name,
        stock: locStock,
        type: loc.type
      };
    });
  }, [locations, stock]);

  const lowStockProducts = useMemo(() => {
    const productStock = products.map(p => {
      const total = stock.filter(s => s.productId === p.id).reduce((acc, item) => acc + item.quantity, 0);
      return { ...p, totalStock: total };
    });
    return productStock.filter(p => p.totalStock < 50).sort((a, b) => a.totalStock - b.totalStock).slice(0, 5);
  }, [products, stock]);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total em Estoque</p>
            <p className="text-2xl font-bold text-slate-900">{stats.totalStock}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Store size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Estoque Central</p>
            <p className="text-2xl font-bold text-slate-900">{stats.centralStock}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Estoque Filiais</p>
            <p className="text-2xl font-bold text-slate-900">{stats.branchStock}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Transferências Pendentes</p>
            <p className="text-2xl font-bold text-slate-900">{stats.pendingTransfers}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">Estoque por Local</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockByLocation} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="stock" radius={[4, 4, 0, 0]}>
                  {stockByLocation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.type === 'CENTRAL' ? '#db2777' : '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-800">Estoque Baixo</h2>
            <span className="px-2 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-full">Atenção</span>
          </div>
          <div className="space-y-4">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.map(product => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{product.name}</p>
                    <p className="text-xs text-slate-500">{product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">{product.totalStock}</p>
                    <p className="text-xs text-slate-500">unidades</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">Nenhum produto com estoque crítico.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
