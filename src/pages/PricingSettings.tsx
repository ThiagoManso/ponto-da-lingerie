import React, { useState, useEffect } from 'react';
import { useInventory, Category } from '../context/InventoryContext';
import { Settings, Save, Percent, CheckCircle } from 'lucide-react';

export const PricingSettings: React.FC = () => {
  const { globalMargin, categoryMargins, updateGlobalMargin, updateCategoryMargin } = useInventory();
  
  const [localGlobalMargin, setLocalGlobalMargin] = useState<number>(globalMargin);
  const [localCategoryMargins, setLocalCategoryMargins] = useState<Record<string, number>>(categoryMargins);
  const [showSuccess, setShowSuccess] = useState(false);

  const categories: Category[] = ['Calcinha', 'Sutiã', 'Conjunto', 'Body', 'Pijama'];

  // Sync with context if it changes externally
  useEffect(() => {
    setLocalGlobalMargin(globalMargin);
    setLocalCategoryMargins(categoryMargins);
  }, [globalMargin, categoryMargins]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateGlobalMargin(localGlobalMargin);
    
    Object.entries(localCategoryMargins).forEach(([cat, margin]) => {
      updateCategoryMargin(cat, margin);
    });

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleCategoryMarginChange = (category: string, value: string) => {
    const numValue = parseFloat(value);
    setLocalCategoryMargins(prev => ({
      ...prev,
      [category]: isNaN(numValue) ? 0 : numValue
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Settings className="text-pink-600" />
            Regras de Precificação
          </h2>
          <p className="text-sm text-slate-500 mt-1">Configure as margens de lucro padrão para cálculo automático de preços.</p>
        </div>
      </div>

      {showSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <CheckCircle size={20} />
          <p className="text-sm font-medium">Regras de precificação salvas com sucesso!</p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Global Margin */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Margem Geral</h3>
          <p className="text-sm text-slate-500 mb-4">Esta margem será aplicada a todos os produtos que não possuírem uma margem específica de categoria ou individual.</p>
          
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-slate-700 mb-1">Margem Padrão (%)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Percent className="h-4 w-4 text-slate-400" />
              </div>
              <input 
                type="number" 
                step="0.1"
                min="0"
                required
                value={localGlobalMargin}
                onChange={e => setLocalGlobalMargin(parseFloat(e.target.value) || 0)}
                className="w-full border border-slate-300 rounded-xl pl-10 pr-3 py-2 text-lg font-bold text-slate-900 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
          </div>
        </div>

        {/* Category Margins */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Margens por Categoria</h3>
          <p className="text-sm text-slate-500 mb-6">Defina margens específicas para cada categoria. Elas terão prioridade sobre a margem geral.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map(category => (
              <div key={category} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <label className="block text-sm font-bold text-slate-700 mb-2">{category}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Percent className="h-4 w-4 text-slate-400" />
                  </div>
                  <input 
                    type="number" 
                    step="0.1"
                    min="0"
                    required
                    value={localCategoryMargins[category] ?? ''}
                    onChange={e => handleCategoryMarginChange(category, e.target.value)}
                    className="w-full border border-slate-300 rounded-xl pl-10 pr-3 py-2 font-medium text-slate-900 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <button 
            type="submit"
            className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-sm"
          >
            <Save size={20} />
            Salvar Regras
          </button>
        </div>
      </form>
    </div>
  );
};
