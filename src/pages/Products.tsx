import React, { useState, useMemo } from 'react';
import { useInventory, Product, Category, Size } from '../context/InventoryContext';
import { Plus, Search, Filter, MoreVertical, Package, AlertTriangle, AlertCircle, Trash2 } from 'lucide-react';

export const Products: React.FC = () => {
  const { products, stock, locations, sales, transfers, addProduct, getAvailableStock, getEffectivePrice, calculateSuggestedPrice, globalMargin, categoryMargins } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'ALL'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [useCustomMargin, setUseCustomMargin] = useState(false);
  const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({
    name: '',
    category: 'Calcinha',
    sku: '',
    price: 0,
    costPrice: 0,
    color: '',
    leadTime: 15,
    safetyMargin: 5,
    avgDailySales: 5,
    orderCost: 50,
    holdingCost: 10,
    imageUrl: '',
    type: 'SIMPLE',
    components: [],
    warehouseAddress: ''
  });

  // Auto-calculate suggested price when cost, category, or custom margin changes
  React.useEffect(() => {
    if (newProduct.costPrice > 0) {
      const suggestedPrice = calculateSuggestedPrice(
        newProduct.costPrice, 
        newProduct.category, 
        useCustomMargin ? newProduct.customMargin : undefined
      );
      setNewProduct(prev => ({ ...prev, price: suggestedPrice }));
    }
  }, [newProduct.costPrice, newProduct.category, newProduct.customMargin, useCustomMargin, calculateSuggestedPrice]);

  const MAX_IMAGE_SIZE_KB = 300;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE_KB * 1024) {
      alert(`A imagem deve ter no máximo ${MAX_IMAGE_SIZE_KB}KB.`);
      e.target.value = ''; // Clear input
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setNewProduct(prev => ({ ...prev, imageUrl: reader.result as string }));
    };
  };

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
    const total = getAvailableStock(productId);
    const central = locations
      .filter(l => l.type === 'CENTRAL')
      .reduce((sum, l) => sum + getAvailableStock(productId, l.id), 0);
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

  const getDaysWithoutMovement = (productId: string): number | 'NO_MOVEMENT' => {
    const productSales = sales.filter(s => s.productId === productId);
    const productTransfers = transfers.filter(t => t.productId === productId && t.status === 'COMPLETED');
    
    const allDates = [
      ...productSales.map(s => new Date(s.date).getTime()),
      ...productTransfers.map(t => new Date(t.date).getTime())
    ];

    if (allDates.length === 0) {
      return 'NO_MOVEMENT';
    }

    const lastMovementDate = new Date(Math.max(...allDates));
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastMovementDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    addProduct(newProduct);
    setIsModalOpen(false);
      setNewProduct({
        name: '',
        category: 'Calcinha',
        sku: '',
        price: 0,
        costPrice: 0,
        customMargin: undefined,
        color: '',
        leadTime: 15,
        safetyMargin: 5,
        avgDailySales: 5,
        orderCost: 50,
        holdingCost: 10,
        imageUrl: '',
        type: 'SIMPLE',
        components: [],
        warehouseAddress: ''
      });
      setUseCustomMargin(false);
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
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
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
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Dias Parado
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
                  const { price, activeEventName } = getEffectivePrice(product);
                  const daysInactive = getDaysWithoutMovement(product.id);
                  
                  return (
                    <tr key={product.id} className={`hover:bg-slate-50 transition-colors ${status === 'CRITICAL' ? 'bg-red-50/50' : status === 'WARNING' ? 'bg-amber-50/50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 overflow-hidden shadow-sm">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                            ) : (
                              <Package size={20} />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-900 flex items-center gap-2">
                              {product.name}
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${product.type === 'KIT' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                                {product.type === 'KIT' ? 'KIT' : 'SIMPLES'}
                              </span>
                              {status === 'CRITICAL' && <AlertCircle size={14} className="text-red-600" title="Estoque Crítico (Abaixo da Segurança)" />}
                              {status === 'WARNING' && <AlertTriangle size={14} className="text-amber-600" title="Atenção (Abaixo do Ponto de Pedido)" />}
                            </div>
                            <div className="text-sm text-slate-500">{product.sku} • {product.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-medium">
                        <div className="flex flex-col">
                          {activeEventName && (
                            <span className="text-xs text-slate-400 line-through">R$ {product.price.toFixed(2).replace('.', ',')}</span>
                          )}
                          <span className={activeEventName ? 'text-pink-600 font-bold' : ''}>
                            R$ {price.toFixed(2).replace('.', ',')}
                          </span>
                          {activeEventName && (
                            <span className="text-[10px] font-bold text-pink-600 bg-pink-50 px-1.5 py-0.5 rounded-full mt-0.5 inline-block w-fit">
                              {activeEventName}
                            </span>
                          )}
                        </div>
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
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {daysInactive === 'NO_MOVEMENT' ? (
                          <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs font-medium rounded-md">
                            Sem Registro
                          </span>
                        ) : (
                          <div className={`flex items-center justify-center gap-1 ${
                            daysInactive > 60 ? 'text-red-600 font-bold' :
                            daysInactive > 30 ? 'text-amber-600 font-bold' :
                            'text-emerald-600 font-medium'
                          }`}>
                            {daysInactive > 60 && <AlertTriangle size={14} />}
                            <span>{daysInactive} d</span>
                          </div>
                        )}
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
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Novo Produto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Novo Produto</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateProduct} className="p-6 space-y-4">
              {/* Type Toggle */}
              <div className="flex gap-4 mb-4 bg-slate-50 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setNewProduct({...newProduct, type: 'SIMPLE'})}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${newProduct.type === 'SIMPLE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Produto Simples
                </button>
                <button
                  type="button"
                  onClick={() => setNewProduct({...newProduct, type: 'KIT'})}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${newProduct.type === 'KIT' ? 'bg-purple-100 text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Kit / Combo
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Produto</label>
                <input 
                  type="text" 
                  required
                  value={newProduct.name}
                  onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                  <input 
                    type="text" 
                    required
                    value={newProduct.sku}
                    onChange={e => setNewProduct({...newProduct, sku: e.target.value})}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                  <select 
                    required
                    value={newProduct.category}
                    onChange={e => setNewProduct({...newProduct, category: e.target.value as Category})}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                  >
                    {categories.filter(c => c !== 'ALL').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="col-span-2 mt-4 mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Endereço no Armazém (Ex: Corredor A, Prateleira 03, Posição 12)
                </label>
                <input 
                  type="text" 
                  placeholder="Ex: C-A/P-03/N-02"
                  value={newProduct.warehouseAddress || ''}
                  onChange={e => setNewProduct({...newProduct, warehouseAddress: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Preço de Custo (R$)</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    required
                    value={newProduct.costPrice || ''}
                    onChange={e => setNewProduct({...newProduct, costPrice: parseFloat(e.target.value) || 0})}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Preço de Venda (R$)</label>
                  <input 
                    type="number" 
                    value={newProduct.price.toFixed(2)}
                    readOnly
                    disabled
                    className="w-full border border-slate-200 bg-slate-50 text-slate-500 rounded-xl px-3 py-2 cursor-not-allowed font-bold"
                  />
                </div>
              </div>

              {/* Margin Settings */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={useCustomMargin}
                      onChange={e => {
                        setUseCustomMargin(e.target.checked);
                        if (!e.target.checked) {
                          setNewProduct({...newProduct, customMargin: undefined});
                        }
                      }}
                      className="rounded text-pink-600 focus:ring-pink-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Definir margem individual para este produto</span>
                  </label>
                  
                  {/* Margin Source Badge */}
                  {!useCustomMargin ? (
                    categoryMargins[newProduct.category] !== undefined ? (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">
                        Usando Margem da Categoria: {categoryMargins[newProduct.category]}%
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">
                        Usando Margem Geral: {globalMargin}%
                      </span>
                    )
                  ) : (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-full">
                      Usando Margem Individual
                    </span>
                  )}
                </div>

                {useCustomMargin && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Margem Específica (%)</label>
                    <input 
                      type="number" 
                      min="0"
                      step="0.1"
                      required
                      value={newProduct.customMargin || ''}
                      onChange={e => setNewProduct({...newProduct, customMargin: parseFloat(e.target.value) || 0})}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {newProduct.type === 'SIMPLE' && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cor</label>
                    <input 
                      type="text" 
                      required
                      value={newProduct.color}
                      onChange={e => setNewProduct({...newProduct, color: e.target.value})}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>
                )}
              </div>

              {newProduct.type === 'KIT' && (
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 space-y-3">
                  <h4 className="font-bold text-purple-900 text-sm">Composição do Kit</h4>
                  {newProduct.components?.map((comp, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <select 
                        value={comp.productId} 
                        onChange={e => {
                          const newComps = [...(newProduct.components || [])];
                          newComps[idx].productId = e.target.value;
                          setNewProduct({...newProduct, components: newComps});
                        }}
                        className="flex-1 border border-purple-200 rounded-lg px-2 py-1.5 text-sm focus:ring-purple-500 focus:border-purple-500"
                        required
                      >
                        <option value="">Selecione um produto...</option>
                        {products.filter(p => p.type !== 'KIT').map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <input 
                        type="number" min="1" value={comp.quantity}
                        onChange={e => {
                          const newComps = [...(newProduct.components || [])];
                          newComps[idx].quantity = parseInt(e.target.value) || 1;
                          setNewProduct({...newProduct, components: newComps});
                        }}
                        className="w-20 border border-purple-200 rounded-lg px-2 py-1.5 text-sm focus:ring-purple-500 focus:border-purple-500"
                        required
                      />
                      <button type="button" onClick={() => {
                        const newComps = newProduct.components?.filter((_, i) => i !== idx);
                        setNewProduct({...newProduct, components: newComps});
                      }} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => {
                    setNewProduct({...newProduct, components: [...(newProduct.components || []), {productId: '', quantity: 1}]});
                  }} className="text-purple-700 text-sm font-bold flex items-center gap-1 mt-2 hover:text-purple-800">
                    <Plus size={16} /> Adicionar Item
                  </button>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Foto do Produto (Opcional)</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100 transition-colors"
                  />
                  {newProduct.imageUrl && (
                    <div className="flex-shrink-0">
                      <img src={newProduct.imageUrl} alt="Preview" className="h-12 w-12 object-cover rounded-lg shadow-sm border border-slate-200" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">Tamanho máximo: {MAX_IMAGE_SIZE_KB}KB.</p>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-xl hover:bg-pink-700"
                >
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
