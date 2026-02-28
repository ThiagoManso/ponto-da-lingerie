import React, { useState, useMemo } from 'react';
import { useInventory, Product, Category, Size } from '../context/InventoryContext';
import { Plus, Search, Filter, MoreVertical, Package, AlertTriangle, AlertCircle } from 'lucide-react';

export const Products: React.FC = () => {
  const { products, stock, locations } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'ALL'>('ALL');

  const categories: (Category | 'ALL')[] = ['ALL', 'Calcinha', 'Sutiã', 'Conjunto', 'Body', 'Pijama'];

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            product.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'ALL' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const getProductStock = (productId: string) => {
    const productStock = stock.filter(s => s.productId === productId);
    const total = productStock.reduce((acc, item) => acc + item.quantity, 0);
    const central = productStock
      .filter(s => locations.find(l => l.id === s.locationId)?.type === 'CENTRAL')
      .reduce((acc, item) => acc + item.quantity, 0);
    const branch = total - central;
    
    return { total, central, branch };
  };

  const calculateLogistics = (product: Product) => {
    const safetyStock = product.avgDailySales * product.safetyMargin;
    const reorderPoint = (product.avgDailySales * product.leadTime) + safetyStock;
    const eoq = Math.sqrt((2 * (product.avgDailySales * 365) * product.orderCost) / product.holdingCost);
    return { safetyStock, reorderPoint, eoq: Math.round(eoq) };
  };

  const getStockStatus = (totalStock: number, reorderPoint: number, safetyStock: number) => {
    if (totalStock <= safetyStock) return 'CRITICAL';
    if (totalStock <= reorderPoint) return 'WARNING';
    return 'OK';
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nome ou SKU..."
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 sm:text-sm transition-shadow"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as Category | 'ALL')}
              className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm rounded-xl appearance-none bg-white border"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c === 'ALL' ? 'Todas Categorias' : c}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
              <Filter className="h-4 w-4" />
            </div>
          </div>
          <button className="flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm">
            <Plus size={18} />
            <span className="hidden sm:inline">Novo Produto</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Produto
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Preço
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Estoque Total
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider" title="Ponto de Pedido (Mínimo para reposição)">
                  Ponto de Pedido
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider" title="Lote Econômico de Compra (Quantidade ideal)">
                  Sugestão (LEC)
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Central/Filiais
                </th>
                <th scope="col" className="relative px-6 py-4">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  const stockInfo = getProductStock(product.id);
                  const logistics = calculateLogistics(product);
                  const status = getStockStatus(stockInfo.total, logistics.reorderPoint, logistics.safetyStock);
                  
                  return (
                    <tr key={product.id} className={`hover:bg-slate-50 transition-colors ${status === 'CRITICAL' ? 'bg-red-50/50' : status === 'WARNING' ? 'bg-amber-50/50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                            <Package size={20} />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-900 flex items-center gap-2">
                              {product.name}
                              {status === 'CRITICAL' && <AlertCircle size={14} className="text-red-600" title="Estoque Crítico (Abaixo da Segurança)" />}
                              {status === 'WARNING' && <AlertTriangle size={14} className="text-amber-600" title="Atenção (Abaixo do Ponto de Pedido)" />}
                            </div>
                            <div className="text-sm text-slate-500">{product.sku} • {product.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-medium">
                        R$ {product.price.toFixed(2).replace('.', ',')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className={`text-sm font-bold ${status === 'CRITICAL' ? 'text-red-600' : status === 'WARNING' ? 'text-amber-600' : 'text-slate-900'}`}>
                          {stockInfo.total}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-medium text-slate-700" title={`Margem de Segurança: ${logistics.safetyStock} un.`}>
                          {logistics.reorderPoint}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-bold text-emerald-600">
                          {logistics.eoq}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2 text-sm">
                          <span className="text-pink-600 font-medium" title="Estoque Central">{stockInfo.central}</span>
                          <span className="text-slate-300">/</span>
                          <span className="text-indigo-600 font-medium" title="Estoque Filiais">{stockInfo.branch}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-slate-400 hover:text-slate-600">
                          <MoreVertical size={20} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
