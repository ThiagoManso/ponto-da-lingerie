import React, { useState } from 'react';
import { LayoutDashboard, Package, Store, ArrowRightLeft, Menu, X, Bell, PieChart, Monitor, CalendarDays, DollarSign, Truck, Settings as SettingsIcon, FileText } from 'lucide-react';
import { clsx } from 'clsx';
import { useInventory } from '../context/InventoryContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { visibleModules } = useInventory();

  const navItems = [
    { id: 'pdv', label: 'PDV / Caixa', icon: Monitor },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'produtos', label: 'Produtos', icon: Package },
    { id: 'filiais', label: 'Filiais', icon: Store },
    { id: 'transferencias', label: 'Transferências', icon: ArrowRightLeft },
    { id: 'roteirizacao', label: 'Logística / Rotas', icon: Truck },
    { id: 'curva-abc', label: 'Curva ABC', icon: PieChart },
    { id: 'sazonalidades', label: 'Calendário Sazonal', icon: CalendarDays },
    { id: 'precificacao', label: 'Regras de Preço', icon: DollarSign },
    { id: 'relatorios', label: 'Relatórios', icon: FileText },
    { id: 'expedicao', label: 'Expedição / Correios', icon: Truck },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        "fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <img src="/Logo.png" alt="Ponto da Lingerie" className="h-8 object-contain" />
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-500 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems
            .filter(item => visibleModules[item.id])
            .map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={clsx(
                  "flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-pink-50 text-pink-700" 
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon size={18} className={isActive ? "text-pink-600" : "text-slate-400"} />
                {item.label}
              </button>
            );
          })}
          
          <div className="pt-4 mt-4 border-t border-slate-200">
            <button
              onClick={() => {
                setActiveTab('configuracoes');
                setSidebarOpen(false);
              }}
              className={clsx(
                "flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors",
                activeTab === 'configuracoes' 
                  ? "bg-slate-800 text-white" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <SettingsIcon size={18} className={activeTab === 'configuracoes' ? 'text-white' : 'text-slate-400'} />
              Configurações
            </button>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200">
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-500 hover:text-slate-700"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-semibold text-slate-800 capitalize hidden sm:block">
              {activeTab.replace('-', ' ')}
            </h1>
          </div>
          
          <div className="flex-1 flex justify-center">
             <img src="/Logo.png" alt="Ponto da Lingerie" className="h-8 object-contain" />
          </div>

          <div className="flex items-center gap-4 flex-1 justify-end">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 overflow-hidden">
              <img src="https://picsum.photos/seed/avatar1/100/100" alt="User" referrerPolicy="no-referrer" />
            </div>
          </div>
        </header>

        {/* Main scrollable area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
