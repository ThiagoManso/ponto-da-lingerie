import React, { useMemo, useState } from 'react';
import { useInventory, LocationType } from '../context/InventoryContext';
import { Store, MapPin, Package, ArrowRight, Calendar, TrendingUp, DollarSign, Plus, X } from 'lucide-react';
import { isAfter, subDays, parseISO } from 'date-fns';

type TimeFilter = '7' | '15' | '30' | '60' | '90' | 'ALL' | 'CUSTOM';

export const Branches: React.FC = () => {
  const { locations, stock, products, sales, addLocation } = useInventory();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('30');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: '',
    type: 'FILIAL' as LocationType,
    address: ''
  });

  const locationStats = useMemo(() => {
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (timeFilter !== 'ALL' && timeFilter !== 'CUSTOM') {
      startDate = subDays(now, parseInt(timeFilter));
    } else if (timeFilter === 'CUSTOM') {
      if (customStartDate) startDate = new Date(customStartDate);
      if (customEndDate) endDate = new Date(customEndDate);
    }

    const filteredSales = sales.filter(s => {
      const saleDate = parseISO(s.date);
      if (startDate && saleDate < startDate) return false;
      if (endDate && saleDate > endDate) return false;
      return true;
    });

    return locations.map(loc => {
      const locStock = stock.filter(s => s.locationId === loc.id);
      const totalItems = locStock.reduce((acc, item) => acc + item.quantity, 0);
      const uniqueProducts = new Set(locStock.map(s => s.productId)).size;
      const totalValue = locStock.reduce((acc, item) => {
        const product = products.find(p => p.id === item.productId);
        return acc + (product ? product.price * item.quantity : 0);
      }, 0);

      const locSales = filteredSales.filter(s => s.locationId === loc.id);
      const itemsSold = locSales.reduce((sum, s) => sum + s.quantity, 0);
      const revenue = locSales.reduce((sum, s) => sum + s.totalValue, 0);

      return {
        ...loc,
        totalItems,
        uniqueProducts,
        totalValue,
        itemsSold,
        revenue
      };
    });
  }, [locations, stock, products, sales, timeFilter, customStartDate, customEndDate]);

  const handleCreateLocation = (e: React.FormEvent) => {
    e.preventDefault();
    addLocation(newLocation);
    setIsModalOpen(false);
    setNewLocation({ name: '', type: 'FILIAL', address: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Locais de Estoque e Desempenho</h2>
          <p className="text-sm text-slate-500 mt-1">Visão geral de estoque e vendas por unidade</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl px-3 py-1.5 shadow-sm">
            <Calendar size={16} className="text-slate-400" />
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
              className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none"
            >
              <option value="7">Últimos 7 dias</option>
              <option value="15">Últimos 15 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="60">Últimos 60 dias</option>
              <option value="90">Últimos 90 dias</option>
              <option value="ALL">Todo o período</option>
              <option value="CUSTOM">Personalizado</option>
            </select>
          </div>

          {timeFilter === 'CUSTOM' && (
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
              />
              <span className="text-slate-400">-</span>
              <input 
                type="date" 
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
          )}

          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-pink-600 border border-transparent text-white hover:bg-pink-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm flex items-center gap-2 ml-auto"
          >
            <Plus size={18} />
            <span>Nova Filial</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locationStats.map(loc => (
          <div key={loc.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-shadow hover:shadow-md">
            <div className={`p-6 border-b border-slate-100 ${loc.type === 'CENTRAL' ? 'bg-pink-50/50' : 'bg-indigo-50/50'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${loc.type === 'CENTRAL' ? 'bg-pink-100 text-pink-600' : 'bg-indigo-100 text-indigo-600'}`}>
                    {loc.type === 'CENTRAL' ? <Package size={20} /> : <Store size={20} />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{loc.name}</h3>
                    <div className="flex items-center gap-1 text-xs font-medium text-slate-500 mt-0.5">
                      <MapPin size={12} />
                      <span className="truncate max-w-[150px]" title={loc.address}>{loc.address}</span>
                    </div>
                  </div>
                </div>
                <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full ${loc.type === 'CENTRAL' ? 'bg-pink-100 text-pink-700' : 'bg-indigo-100 text-indigo-700'}`}>
                  {loc.type}
                </span>
              </div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col justify-center space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Total de Peças</p>
                  <p className="text-2xl font-bold text-slate-900">{loc.totalItems}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Modelos</p>
                  <p className="text-2xl font-bold text-slate-900">{loc.uniqueProducts}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Valor em Estoque</p>
                <p className="text-lg font-semibold text-slate-700">
                  R$ {loc.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp size={14} className="text-emerald-500" />
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Peças Vendidas</p>
                  </div>
                  <p className="text-xl font-bold text-emerald-700">{loc.itemsSold}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <DollarSign size={14} className="text-emerald-500" />
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Faturamento</p>
                  </div>
                  <p className="text-xl font-bold text-emerald-700">
                    R$ {loc.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button className="w-full flex items-center justify-center gap-2 text-sm font-medium text-slate-600 hover:text-pink-600 transition-colors">
                <span>Ver inventário completo</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Nova Filial */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Nova Filial</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateLocation} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Filial</label>
                <input 
                  type="text" 
                  required
                  value={newLocation.name}
                  onChange={e => setNewLocation({...newLocation, name: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="Ex: Filial Sul"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                <select 
                  required
                  value={newLocation.type}
                  onChange={e => setNewLocation({...newLocation, type: e.target.value as LocationType})}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                >
                  <option value="FILIAL">Filial (Loja Física)</option>
                  <option value="CENTRAL">Central (Matriz/CD)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Endereço Completo</label>
                <textarea 
                  required
                  value={newLocation.address}
                  onChange={e => setNewLocation({...newLocation, address: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                  rows={3}
                  placeholder="Rua, Número, Bairro, Cidade - Estado"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-xl font-medium hover:bg-pink-700 transition-colors shadow-sm"
                >
                  Salvar Filial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
