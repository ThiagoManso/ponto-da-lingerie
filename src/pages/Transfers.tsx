import React, { useState, useMemo } from 'react';
import { useInventory, Transfer, Size, TransferSuggestion } from '../context/InventoryContext';
import { ArrowRightLeft, CheckCircle2, Clock, Package, MapPin, Sparkles, Check } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Transfers: React.FC = () => {
  const { transfers, products, locations, createTransfer, completeTransfer, generateTransferSuggestions } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTransfer, setNewTransfer] = useState({
    productId: '',
    fromLocationId: '',
    toLocationId: '',
    size: 'M' as Size,
    quantity: 1
  });

  const suggestions = useMemo(() => generateTransferSuggestions(), [generateTransferSuggestions]);

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    createTransfer(newTransfer);
    setIsModalOpen(false);
    setNewTransfer({ productId: '', fromLocationId: '', toLocationId: '', size: 'M', quantity: 1 });
  };

  const handleAcceptSuggestion = (suggestion: TransferSuggestion) => {
    createTransfer({
      productId: suggestion.productId,
      fromLocationId: suggestion.fromLocationId,
      toLocationId: suggestion.toLocationId,
      size: suggestion.size,
      quantity: suggestion.quantity
    });
  };

  const handleAcceptAllSuggestions = () => {
    suggestions.forEach(suggestion => {
      createTransfer({
        productId: suggestion.productId,
        fromLocationId: suggestion.fromLocationId,
        toLocationId: suggestion.toLocationId,
        size: suggestion.size,
        quantity: suggestion.quantity
      });
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-800">Movimentações de Estoque</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          <ArrowRightLeft size={18} />
          <span>Nova Transferência</span>
        </button>
      </div>

      {/* Sugestões Inteligentes */}
      {suggestions.length > 0 && (
        <div className="bg-white rounded-2xl border border-pink-200 shadow-sm overflow-hidden">
          <div className="bg-pink-50 px-6 py-4 border-b border-pink-100 flex justify-between items-center">
            <div className="flex items-center gap-2 text-pink-700">
              <Sparkles size={20} className="text-pink-600" />
              <h3 className="text-lg font-bold">Sugestões Inteligentes de Reabastecimento</h3>
            </div>
            <button 
              onClick={handleAcceptAllSuggestions}
              className="text-sm font-medium bg-white text-pink-700 hover:bg-pink-100 border border-pink-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Check size={16} />
              Aceitar Todas
            </button>
          </div>
          <div className="p-6 grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {suggestions.map((suggestion, index) => {
              const product = products.find(p => p.id === suggestion.productId);
              const fromLoc = locations.find(l => l.id === suggestion.fromLocationId);
              const toLoc = locations.find(l => l.id === suggestion.toLocationId);

              return (
                <div key={index} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium text-slate-900 line-clamp-1">{product?.name}</div>
                      <span className="bg-slate-200 text-slate-700 text-xs font-bold px-2 py-1 rounded-md">Tam: {suggestion.size}</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">
                      A <strong>{toLoc?.name}</strong> precisa de <strong>{suggestion.quantity}</strong> unidades. Transferir de <strong>{fromLoc?.name}</strong>.
                    </p>
                    <p className="text-xs text-slate-500 italic mb-4">
                      Motivo: {suggestion.reason}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleAcceptSuggestion(suggestion)}
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                  >
                    Aceitar Sugestão
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Data
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Produto
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Origem
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Destino
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Qtd / Tam
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="relative px-6 py-4">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {transfers.length > 0 ? (
                transfers.map((transfer) => {
                  const product = products.find(p => p.id === transfer.productId);
                  const fromLoc = locations.find(l => l.id === transfer.fromLocationId);
                  const toLoc = locations.find(l => l.id === transfer.toLocationId);

                  return (
                    <tr key={transfer.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {format(new Date(transfer.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                            <Package size={16} />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-slate-900">{product?.name}</div>
                            <div className="text-xs text-slate-500">{product?.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <MapPin size={14} className="text-pink-500" />
                          {fromLoc?.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <MapPin size={14} className="text-indigo-500" />
                          {toLoc?.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-bold text-slate-900">{transfer.quantity}</div>
                        <div className="text-xs font-medium text-slate-500">Tam: {transfer.size}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {transfer.status === 'COMPLETED' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            <CheckCircle2 size={14} />
                            Concluído
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            <Clock size={14} />
                            Pendente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {transfer.status === 'PENDING' && (
                          <button 
                            onClick={() => completeTransfer(transfer.id)}
                            className="text-pink-600 hover:text-pink-900 font-semibold transition-colors"
                          >
                            Confirmar Recebimento
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Nenhuma transferência registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova Transferência */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Nova Transferência</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateTransfer} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Produto</label>
                <select 
                  required
                  value={newTransfer.productId}
                  onChange={e => setNewTransfer({...newTransfer, productId: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                >
                  <option value="">Selecione um produto</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Origem</label>
                  <select 
                    required
                    value={newTransfer.fromLocationId}
                    onChange={e => setNewTransfer({...newTransfer, fromLocationId: e.target.value})}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                  >
                    <option value="">Selecione</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Destino</label>
                  <select 
                    required
                    value={newTransfer.toLocationId}
                    onChange={e => setNewTransfer({...newTransfer, toLocationId: e.target.value})}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                  >
                    <option value="">Selecione</option>
                    {locations.filter(l => l.id !== newTransfer.fromLocationId).map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tamanho</label>
                  <select 
                    required
                    value={newTransfer.size}
                    onChange={e => setNewTransfer({...newTransfer, size: e.target.value as Size})}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                  >
                    {['P', 'M', 'G', 'GG', 'XG'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade</label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    value={newTransfer.quantity}
                    onChange={e => setNewTransfer({...newTransfer, quantity: parseInt(e.target.value)})}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
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
                  Criar Transferência
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
