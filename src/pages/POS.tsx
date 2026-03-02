import React, { useState, useMemo, useRef } from 'react';
import { useInventory, Product, Size, CartItem } from '../context/InventoryContext';
import { Search, ShoppingCart, Plus, Minus, Trash2, CheckCircle, Store, CreditCard, Banknote, Smartphone, Lock, Unlock } from 'lucide-react';

export const POS: React.FC = () => {
  const { products, stock, locations, processCheckout, isRegisterOpen, openRegister, closeRegister, getEffectivePrice } = useInventory();
  
  const [selectedLocationId, setSelectedLocationId] = useState<string>(locations[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('PIX');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [floatInput, setFloatInput] = useState<string>('');
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter products based on search and selected location stock
  const availableProducts = useMemo(() => {
    return products.filter(p => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = p.name.toLowerCase().includes(searchLower) || 
                            p.sku.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;

      // Check if it has stock in the selected location
      const productStock = stock.filter(s => s.productId === p.id && s.locationId === selectedLocationId);
      const totalStock = productStock.reduce((sum, s) => sum + s.quantity, 0);
      
      return totalStock > 0;
    }).map(p => {
      const productStock = stock.filter(s => s.productId === p.id && s.locationId === selectedLocationId);
      const totalStock = productStock.reduce((sum, s) => sum + s.quantity, 0);
      return { ...p, currentStock: totalStock, availableSizes: productStock.filter(s => s.quantity > 0).map(s => s.size) };
    });
  }, [products, stock, searchTerm, selectedLocationId]);

  const handleAddToCart = (product: Product, availableSizes: Size[]) => {
    if (availableSizes.length === 0) return;
    
    // Default to the first available size
    const sizeToAdd = availableSizes[0];
    
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id && item.size === sizeToAdd);
      const availableStock = stock.find(s => s.productId === product.id && s.locationId === selectedLocationId && s.size === sizeToAdd)?.quantity || 0;
      
      if (existing) {
        if (existing.quantity + 1 > availableStock) return prev;
        
        return prev.map(item => 
          item === existing ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      
      if (availableStock < 1) return prev;
      
      return [...prev, { product, size: sizeToAdd, quantity: 1 }];
    });
    
    // Clear search and focus
    setSearchTerm('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const updateCartQuantity = (index: number, delta: number) => {
    setCart(prev => {
      const newCart = [...prev];
      const item = newCart[index];
      const newQuantity = item.quantity + delta;
      
      if (newQuantity <= 0) {
        newCart.splice(index, 1);
      } else {
        // Check stock limit
        const availableStock = stock.find(s => s.productId === item.product.id && s.locationId === selectedLocationId && s.size === item.size)?.quantity || 0;
        if (newQuantity <= availableStock) {
          newCart[index] = { ...item, quantity: newQuantity };
        }
      }
      return newCart;
    });
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const subtotal = cart.reduce((sum, item) => {
    const { price } = getEffectivePrice(item.product);
    return sum + (price * item.quantity);
  }, 0);
  const total = Math.max(0, subtotal - discount);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    const success = processCheckout(cart, selectedLocationId, paymentMethod, discount);
    if (success) {
      setCart([]);
      setDiscount(0);
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 3000);
    }
  };

  const handleOpenRegister = (e: React.FormEvent) => {
    e.preventDefault();
    openRegister(parseFloat(floatInput) || 0);
  };

  if (!isRegisterOpen) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center relative">
        <div className="absolute inset-0 bg-slate-100/50 backdrop-blur-sm z-10"></div>
        <div className="bg-white p-8 rounded-3xl shadow-xl z-20 max-w-md w-full text-center border border-slate-200">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={40} className="text-slate-400" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">O Caixa está Fechado</h2>
          <p className="text-slate-500 mb-8">Abra o caixa informando o fundo de troco inicial para começar a vender.</p>
          
          <form onSubmit={handleOpenRegister} className="space-y-6 text-left">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Fundo de Troco (R$)</label>
              <input 
                type="number" 
                min="0"
                step="0.01"
                required
                value={floatInput}
                onChange={(e) => setFloatInput(e.target.value)}
                placeholder="0,00"
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-lg focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                autoFocus
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/30"
            >
              <Unlock size={24} />
              <span>ABRIR CAIXA</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6 relative">
      {/* Close Register Button (Absolute Top Right of the container) */}
      <div className="absolute -top-12 right-0 z-10">
        <button 
          onClick={closeRegister}
          className="flex items-center gap-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm"
        >
          <Lock size={16} />
          <span>Fechar Caixa</span>
        </button>
      </div>

      {/* LEFT COLUMN: Search & Products (65%) */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        {/* Top Bar: Location & Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 sm:w-1/3">
            <Store size={18} className="text-slate-400" />
            <select
              value={selectedLocationId}
              onChange={(e) => {
                setSelectedLocationId(e.target.value);
                setCart([]); // Clear cart when changing location
              }}
              className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none w-full"
            >
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>
          
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar produto por nome ou código de barras (SKU)..."
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 sm:text-sm transition-shadow"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {availableProducts.map(product => {
              const { price, activeEventName } = getEffectivePrice(product);
              return (
              <button
                key={product.id}
                onClick={() => handleAddToCart(product, product.availableSizes)}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-pink-300 transition-all text-left flex flex-col h-full group relative overflow-hidden"
              >
                {activeEventName && (
                  <div className="absolute top-0 right-0 bg-pink-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg shadow-sm z-10 flex items-center gap-1">
                    <span role="img" aria-label="fire">🔥</span> {activeEventName}
                  </div>
                )}
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                    {product.sku}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                    {product.currentStock} un
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-800 line-clamp-2 mb-1 group-hover:text-pink-600 transition-colors">
                  {product.name}
                </h3>
                <p className="text-xs text-slate-500 mb-3">{product.category}</p>
                <div className="mt-auto">
                  {activeEventName ? (
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-400 line-through">R$ {product.price.toFixed(2).replace('.', ',')}</span>
                      <p className="text-lg font-black text-pink-600">
                        R$ {price.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  ) : (
                    <p className="text-lg font-black text-slate-900">
                      R$ {price.toFixed(2).replace('.', ',')}
                    </p>
                  )}
                </div>
              </button>
            )})}
            {availableProducts.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200 border-dashed">
                <Search size={48} className="mb-4 opacity-20" />
                <p className="text-lg font-medium">Nenhum produto encontrado</p>
                <p className="text-sm">Tente buscar por outro termo ou verifique o estoque da filial.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Cart (35%) */}
      <div className="w-full lg:w-[400px] xl:w-[450px] bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden flex-shrink-0">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center">
            <ShoppingCart size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Resumo da Venda</h2>
            <p className="text-xs font-medium text-slate-500">{cart.length} itens no carrinho</p>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <ShoppingCart size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-medium">O carrinho está vazio</p>
            </div>
          ) : (
            cart.map((item, index) => {
              const { price, activeEventName } = getEffectivePrice(item.product);
              return (
              <div key={`${item.product.id}-${item.size}-${index}`} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white shadow-sm relative">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-800 truncate">{item.product.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      Tam: {item.size}
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      R$ {price.toFixed(2).replace('.', ',')}
                    </span>
                    {activeEventName && (
                      <span className="text-[10px] font-bold text-pink-600 bg-pink-50 px-1.5 py-0.5 rounded-full">
                        {activeEventName}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1 border border-slate-200">
                  <button 
                    onClick={() => updateCartQuantity(index, -1)}
                    className="w-7 h-7 flex items-center justify-center rounded-md bg-white text-slate-600 shadow-sm hover:text-pink-600"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-slate-800">{item.quantity}</span>
                  <button 
                    onClick={() => updateCartQuantity(index, 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-md bg-white text-slate-600 shadow-sm hover:text-pink-600"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                
                <div className="text-right ml-2">
                  <p className="text-sm font-bold text-slate-900">
                    R$ {(price * item.quantity).toFixed(2).replace('.', ',')}
                  </p>
                </div>
                
                <button 
                  onClick={() => removeFromCart(index)}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors ml-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )})
          )}
        </div>

        {/* Checkout Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Subtotal</span>
              <span className="text-slate-700 font-bold">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Desconto (R$)</span>
              <input 
                type="number" 
                min="0"
                step="0.01"
                value={discount || ''}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-24 text-right border border-slate-300 rounded-lg px-2 py-1 text-sm focus:ring-pink-500 focus:border-pink-500"
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-between items-end">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total</span>
            <span className="text-3xl font-black text-slate-900">
              R$ {total.toFixed(2).replace('.', ',')}
            </span>
          </div>

          <div className="pt-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Método de Pagamento</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'PIX', icon: Smartphone, label: 'PIX' },
                { id: 'CREDITO', icon: CreditCard, label: 'Crédito' },
                { id: 'DEBITO', icon: CreditCard, label: 'Débito' },
                { id: 'DINHEIRO', icon: Banknote, label: 'Dinheiro' }
              ].map(method => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`flex flex-col items-center justify-center gap-1 py-2 rounded-xl border transition-all ${
                      isSelected 
                        ? 'bg-pink-50 border-pink-500 text-pink-700 shadow-sm' 
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="text-[10px] font-bold uppercase">{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-sm ${
              cart.length > 0 
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <CheckCircle size={24} />
            <span>FINALIZAR VENDA</span>
          </button>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full flex flex-col items-center text-center transform animate-in zoom-in duration-200">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle size={40} className="text-emerald-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Venda Concluída!</h3>
            <p className="text-slate-500 font-medium mb-8">O estoque foi atualizado e o recibo foi gerado com sucesso.</p>
            <button 
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-colors"
            >
              Nova Venda
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
