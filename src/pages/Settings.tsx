import React from 'react';
import { useInventory } from '../context/InventoryContext';
import { Shield, ToggleLeft, ToggleRight } from 'lucide-react';

export const Settings: React.FC = () => {
  const { visibleModules, toggleModule } = useInventory();

  const moduleNames: Record<string, string> = {
    pdv: 'PDV / Caixa',
    dashboard: 'Dashboard',
    produtos: 'Cadastro de Produtos',
    filiais: 'Gestão de Filiais',
    transferencias: 'Transferências',
    roteirizacao: 'Logística / Rotas',
    'curva-abc': 'Curva ABC',
    sazonalidades: 'Calendário Sazonal',
    precificacao: 'Regras de Preço',
    relatorios: 'Extração de Relatórios',
    expedicao: 'Expedição e Melhor Envio',
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="p-3 bg-slate-100 rounded-lg text-slate-600">
            <Shield size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Configurações do Sistema</h2>
            <p className="text-sm text-slate-500">Controle a exibição dos módulos (futuramente vinculado a perfis de acesso).</p>
          </div>
        </div>

        <div className="space-y-4">
          {Object.keys(moduleNames).map((moduleId) => (
            <div key={moduleId} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-medium text-slate-700">{moduleNames[moduleId]}</span>
              <button 
                onClick={() => toggleModule(moduleId)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  visibleModules[moduleId] ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                }`}
              >
                {visibleModules[moduleId] ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                {visibleModules[moduleId] ? 'Ativo' : 'Inativo'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
