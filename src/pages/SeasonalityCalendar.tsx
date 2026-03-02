import React, { useState } from 'react';
import { useInventory, Category, SeasonalEvent } from '../context/InventoryContext';
import { CalendarDays, Plus, Trash2, Tag, Percent, Calendar as CalendarIcon } from 'lucide-react';

export const SeasonalityCalendar: React.FC = () => {
  const { seasonalEvents, addSeasonalEvent, removeSeasonalEvent, products } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [newEvent, setNewEvent] = useState<Omit<SeasonalEvent, 'id'>>({
    name: '',
    startDate: '',
    endDate: '',
    type: 'GENERAL',
    marginPercentage: 0,
    targetCategories: [],
    targetProductIds: []
  });

  const categories: Category[] = ['Calcinha', 'Sutiã', 'Conjunto', 'Body', 'Pijama'];

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    addSeasonalEvent(newEvent);
    setIsModalOpen(false);
    setNewEvent({
      name: '',
      startDate: '',
      endDate: '',
      type: 'GENERAL',
      marginPercentage: 0,
      targetCategories: [],
      targetProductIds: []
    });
  };

  const handleCategoryToggle = (cat: Category) => {
    setNewEvent(prev => {
      const current = prev.targetCategories || [];
      if (current.includes(cat)) {
        return { ...prev, targetCategories: current.filter(c => c !== cat) };
      } else {
        return { ...prev, targetCategories: [...current, cat] };
      }
    });
  };

  const handleProductToggle = (productId: string) => {
    setNewEvent(prev => {
      const current = prev.targetProductIds || [];
      if (current.includes(productId)) {
        return { ...prev, targetProductIds: current.filter(id => id !== productId) };
      } else {
        return { ...prev, targetProductIds: [...current, productId] };
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Calendário Sazonal</h2>
          <p className="text-sm text-slate-500 mt-1">Gerencie eventos e precificação dinâmica</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>Novo Evento Sazonal</span>
        </button>
      </div>

      {/* Events List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Evento</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Período</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Abrangência</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Ajuste (%)</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {seasonalEvents.length > 0 ? (
                seasonalEvents.map((event) => {
                  const now = new Date();
                  const start = new Date(event.startDate);
                  const end = new Date(event.endDate);
                  const isActive = now >= start && now <= end;

                  return (
                    <tr key={event.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                            <CalendarDays size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{event.name}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                              {isActive ? 'ATIVO AGORA' : 'PROGRAMADO'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-700 flex items-center gap-2">
                          <CalendarIcon size={14} className="text-slate-400" />
                          {new Date(event.startDate).toLocaleDateString()} até {new Date(event.endDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Tag size={14} className="text-slate-400" />
                          <span className="text-sm font-medium text-slate-700">
                            {event.type === 'GENERAL' && 'Todos os Produtos'}
                            {event.type === 'CATEGORY' && `Categorias (${event.targetCategories?.length || 0})`}
                            {event.type === 'INDIVIDUAL' && `Produtos Específicos (${event.targetProductIds?.length || 0})`}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-bold flex items-center gap-1 ${event.marginPercentage > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {event.marginPercentage > 0 ? '+' : ''}{event.marginPercentage}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button 
                          onClick={() => removeSeasonalEvent(event.id)}
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                          title="Remover Evento"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Nenhum evento sazonal programado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Novo Evento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
              <h3 className="text-lg font-bold text-slate-900">Novo Evento Sazonal</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>
            
            <div className="overflow-y-auto custom-scrollbar flex-1">
              <form id="event-form" onSubmit={handleCreateEvent} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Evento</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Dia dos Namorados, Black Friday..."
                    value={newEvent.name}
                    onChange={e => setNewEvent({...newEvent, name: e.target.value})}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Data de Início</label>
                    <input 
                      type="datetime-local" 
                      required
                      value={newEvent.startDate}
                      onChange={e => setNewEvent({...newEvent, startDate: e.target.value})}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Data de Fim</label>
                    <input 
                      type="datetime-local" 
                      required
                      value={newEvent.endDate}
                      onChange={e => setNewEvent({...newEvent, endDate: e.target.value})}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ajuste de Preço (%)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Percent className="h-4 w-4 text-slate-400" />
                    </div>
                    <input 
                      type="number" 
                      step="0.1"
                      required
                      placeholder="-10 para desconto, 15 para acréscimo"
                      value={newEvent.marginPercentage || ''}
                      onChange={e => setNewEvent({...newEvent, marginPercentage: parseFloat(e.target.value)})}
                      className="w-full border border-slate-300 rounded-xl pl-10 pr-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Use valores negativos para desconto (ex: -10) ou positivos para acréscimo (ex: 15).</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Abrangência do Evento</label>
                  <div className="flex gap-4 bg-slate-50 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setNewEvent({...newEvent, type: 'GENERAL'})}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${newEvent.type === 'GENERAL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Geral
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewEvent({...newEvent, type: 'CATEGORY'})}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${newEvent.type === 'CATEGORY' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Por Categoria
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewEvent({...newEvent, type: 'INDIVIDUAL'})}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${newEvent.type === 'INDIVIDUAL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Por Produto
                    </button>
                  </div>
                </div>

                {newEvent.type === 'CATEGORY' && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="text-sm font-bold text-slate-800 mb-3">Selecione as Categorias</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map(cat => (
                        <label key={cat} className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={newEvent.targetCategories?.includes(cat) || false}
                            onChange={() => handleCategoryToggle(cat)}
                            className="rounded text-pink-600 focus:ring-pink-500"
                          />
                          <span className="text-sm text-slate-700">{cat}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {newEvent.type === 'INDIVIDUAL' && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="text-sm font-bold text-slate-800 mb-3">Selecione os Produtos/Kits</h4>
                    <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                      {products.map(product => (
                        <label key={product.id} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-100 cursor-pointer hover:border-pink-200 transition-colors">
                          <input 
                            type="checkbox" 
                            checked={newEvent.targetProductIds?.includes(product.id) || false}
                            onChange={() => handleProductToggle(product.id)}
                            className="rounded text-pink-600 focus:ring-pink-500"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{product.name}</p>
                            <p className="text-xs text-slate-500 truncate">{product.sku} • {product.category}</p>
                          </div>
                          {product.type === 'KIT' && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-700 rounded-full">KIT</span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 flex-shrink-0 bg-slate-50">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                form="event-form"
                className="px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-xl hover:bg-pink-700"
              >
                Salvar Evento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
