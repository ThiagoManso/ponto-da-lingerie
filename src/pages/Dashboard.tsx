import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { DollarSign, Receipt, ShoppingBag, Trophy, Calendar } from 'lucide-react';
import { isAfter, subDays, parseISO, startOfDay } from 'date-fns';

type TimeFilter = 'TODAY' | '7' | '30' | 'ALL';

export const Dashboard: React.FC = () => {
  const { sales, products, locations } = useInventory();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('30');

  // 1. PREPARAÇÃO DE DADOS
  const dashboardData = useMemo(() => {
    const now = new Date();
    let startDate: Date | null = null;

    if (timeFilter === 'TODAY') {
      startDate = startOfDay(now);
    } else if (timeFilter !== 'ALL') {
      startDate = subDays(now, parseInt(timeFilter));
    }

    // Filtrar vendas pelo período
    const filteredSales = sales.filter(s => {
      if (!startDate) return true;
      const saleDate = parseISO(s.date);
      return isAfter(saleDate, startDate);
    });

    // Métricas Globais
    const totalRevenue = filteredSales.reduce((sum, s) => sum + s.totalValue, 0);
    const totalItemsSold = filteredSales.reduce((sum, s) => sum + s.quantity, 0);
    
    // Contar transações únicas (usando receiptId se existir, ou o próprio id da venda como fallback)
    const uniqueTransactions = new Set(filteredSales.map(s => s.receiptId || s.id)).size;
    
    const averageTicket = uniqueTransactions > 0 ? totalRevenue / uniqueTransactions : 0;

    // Agrupamentos
    // Vendas por Unidade
    const salesByLocation = locations.map(loc => {
      const locSales = filteredSales.filter(s => s.locationId === loc.id);
      const revenue = locSales.reduce((sum, s) => sum + s.totalValue, 0);
      return { ...loc, revenue };
    }).sort((a, b) => b.revenue - a.revenue);

    const topLocation = salesByLocation.length > 0 && salesByLocation[0].revenue > 0 
      ? salesByLocation[0] 
      : null;

    // Vendas por Categoria
    const categories = ['Calcinha', 'Sutiã', 'Conjunto', 'Body', 'Pijama'];
    const salesByCategory = categories.map(cat => {
      const catSales = filteredSales.filter(s => {
        const product = products.find(p => p.id === s.productId);
        return product?.category === cat;
      });
      const revenue = catSales.reduce((sum, s) => sum + s.totalValue, 0);
      return { category: cat, revenue };
    }).filter(c => c.revenue > 0).sort((a, b) => b.revenue - a.revenue);

    // Ranking de Produtos (Top 5)
    const productRanking = products.map(p => {
      const pSales = filteredSales.filter(s => s.productId === p.id);
      const qty = pSales.reduce((sum, s) => sum + s.quantity, 0);
      const revenue = pSales.reduce((sum, s) => sum + s.totalValue, 0);
      return { ...p, qty, revenue };
    }).filter(p => p.revenue > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    return {
      totalRevenue,
      totalItemsSold,
      uniqueTransactions,
      averageTicket,
      salesByLocation,
      topLocation,
      salesByCategory,
      productRanking
    };
  }, [sales, products, locations, timeFilter]);

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Painel de Inteligência (BI)</h2>
          <p className="text-sm text-slate-500 mt-1">Visão geral de vendas e desempenho da rede</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl px-3 py-1.5 shadow-sm">
          <Calendar size={16} className="text-slate-400" />
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
            className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none"
          >
            <option value="TODAY">Hoje</option>
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="ALL">Todo o período</option>
          </select>
        </div>
      </div>

      {/* SEÇÃO 1: Cards de KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <DollarSign size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500 truncate">Faturamento Total</p>
            <p className="text-2xl font-bold text-slate-900 truncate">
              R$ {dashboardData.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Receipt size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500 truncate">Ticket Médio</p>
            <p className="text-2xl font-bold text-slate-900 truncate">
              R$ {dashboardData.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-400 truncate mt-0.5">Gasto médio por venda</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <ShoppingBag size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500 truncate">Peças Vendidas</p>
            <p className="text-2xl font-bold text-slate-900 truncate">{dashboardData.totalItemsSold}</p>
            <p className="text-xs text-slate-400 truncate mt-0.5">Em {dashboardData.uniqueTransactions} vendas</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Trophy size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500 truncate">Unidade Campeã</p>
            {dashboardData.topLocation ? (
              <>
                <p className="text-lg font-bold text-slate-900 truncate">{dashboardData.topLocation.name}</p>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  R$ {dashboardData.topLocation.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </>
            ) : (
              <p className="text-lg font-bold text-slate-900">N/A</p>
            )}
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: Gráficos (Barras de Proporção) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendas por Unidade */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Vendas por Unidade</h3>
          <div className="space-y-5">
            {dashboardData.salesByLocation.map(loc => {
              const percentage = dashboardData.totalRevenue > 0 
                ? (loc.revenue / dashboardData.totalRevenue) * 100 
                : 0;
              
              return (
                <div key={loc.id}>
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-sm font-bold text-slate-700">{loc.name}</span>
                    <span className="text-sm font-medium text-slate-500">
                      R$ {loc.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-pink-500 h-2.5 rounded-full transition-all duration-500" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
            {dashboardData.salesByLocation.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">Nenhum dado no período.</p>
            )}
          </div>
        </div>

        {/* Mix de Categorias */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Mix de Categorias</h3>
          <div className="space-y-5">
            {dashboardData.salesByCategory.map(cat => {
              const percentage = dashboardData.totalRevenue > 0 
                ? (cat.revenue / dashboardData.totalRevenue) * 100 
                : 0;
              
              return (
                <div key={cat.category}>
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-sm font-bold text-slate-700">{cat.category}</span>
                    <span className="text-sm font-medium text-slate-500">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
            {dashboardData.salesByCategory.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">Nenhum dado no período.</p>
            )}
          </div>
        </div>
      </div>

      {/* SEÇÃO 3: Top 5 Produtos */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Top 5 Produtos (Mais Rentáveis)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Produto</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Categoria</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Qtd Vendida</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Faturamento</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {dashboardData.productRanking.map((product, index) => (
                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-amber-100 text-amber-700' :
                        index === 1 ? 'bg-slate-200 text-slate-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {index + 1}
                      </span>
                      <div className="text-sm font-bold text-slate-900">{product.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {product.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-slate-700">
                    {product.qty}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-emerald-600">
                    R$ {product.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              {dashboardData.productRanking.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">
                    Nenhuma venda registrada no período selecionado.
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
