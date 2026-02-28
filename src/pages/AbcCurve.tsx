import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { PieChart, TrendingUp, Package, MapPin, Calendar, DollarSign, Activity } from 'lucide-react';
import { isAfter, subDays, parseISO } from 'date-fns';

type MetricType = 'STOCK_VALUE' | 'SALES_QTY' | 'SALES_VALUE';
type TimeFilter = '7' | '15' | '30' | '60' | '90' | 'ALL' | 'CUSTOM';

export const AbcCurve: React.FC = () => {
  const { products, stock, locations, sales } = useInventory();
  const [selectedLocation, setSelectedLocation] = useState<string>('ALL');
  const [metricType, setMetricType] = useState<MetricType>('STOCK_VALUE');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('30');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  const abcData = useMemo(() => {
    let productTotals: any[] = [];

    if (metricType === 'STOCK_VALUE') {
      // 1. Filter stock by selected location
      const filteredStock = selectedLocation === 'ALL' 
        ? stock 
        : stock.filter(s => s.locationId === selectedLocation);

      // 2. Calculate total value per product
      productTotals = products.map(p => {
        const qty = filteredStock
          .filter(s => s.productId === p.id)
          .reduce((sum, s) => sum + s.quantity, 0);
        const value = qty * p.price;
        return { ...p, qty, value };
      }).filter(p => p.qty > 0); // Only include products that are in stock
    } else {
      // SALES_QTY or SALES_VALUE
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
        if (selectedLocation !== 'ALL' && s.locationId !== selectedLocation) return false;
        
        const saleDate = parseISO(s.date);
        if (startDate && saleDate < startDate) return false;
        if (endDate && saleDate > endDate) return false;
        
        return true;
      });

      productTotals = products.map(p => {
        const productSales = filteredSales.filter(s => s.productId === p.id);
        const qty = productSales.reduce((sum, s) => sum + s.quantity, 0);
        const salesValue = productSales.reduce((sum, s) => sum + s.totalValue, 0);
        
        const value = metricType === 'SALES_QTY' ? qty : salesValue;
        return { ...p, qty, value, salesValue };
      }).filter(p => p.value > 0);
    }

    // 3. Sort descending by value
    productTotals.sort((a, b) => b.value - a.value);

    // 4. Calculate cumulative percentage and assign ABC classes
    const totalInventoryValue = productTotals.reduce((sum, p) => sum + p.value, 0);
    let cumulativeValue = 0;

    return productTotals.map(p => {
      cumulativeValue += p.value;
      const cumulativePercentage = totalInventoryValue > 0 ? (cumulativeValue / totalInventoryValue) * 100 : 0;
      
      let category = 'C';
      if (cumulativePercentage <= 80) category = 'A';
      else if (cumulativePercentage <= 95) category = 'B';

      return { ...p, cumulativePercentage, abcClass: category };
    });
  }, [products, stock, sales, selectedLocation, metricType, timeFilter, customStartDate, customEndDate]);

  const summary = useMemo(() => {
    const totalValue = abcData.reduce((sum, item) => sum + item.value, 0);
    
    const getStats = (cls: string) => {
      const items = abcData.filter(i => i.abcClass === cls);
      const value = items.reduce((sum, i) => sum + i.value, 0);
      const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
      return { count: items.length, value, percentage };
    };

    return {
      A: getStats('A'),
      B: getStats('B'),
      C: getStats('C'),
      totalValue
    };
  }, [abcData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Curva ABC Dinâmica</h2>
          <p className="text-sm text-slate-500 mt-1">Classificação baseada em estoque ou histórico de vendas</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl px-3 py-1.5 shadow-sm">
            <Activity size={16} className="text-slate-400" />
            <select
              value={metricType}
              onChange={(e) => setMetricType(e.target.value as MetricType)}
              className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none"
            >
              <option value="STOCK_VALUE">Valor em Estoque (Atual)</option>
              <option value="SALES_QTY">Quantidade Vendida</option>
              <option value="SALES_VALUE">Faturamento de Vendas</option>
            </select>
          </div>

          {metricType !== 'STOCK_VALUE' && (
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
          )}

          {timeFilter === 'CUSTOM' && metricType !== 'STOCK_VALUE' && (
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

          <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl px-3 py-1.5 shadow-sm">
            <MapPin size={16} className="text-slate-400" />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none"
            >
              <option value="ALL">Todas as Unidades</option>
              {locations.map(l => (
                <option key={l.id} value={l.id}>{l.name} ({l.type === 'CENTRAL' ? 'Matriz' : 'Filial'})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-t-4 border-t-emerald-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Classe A</p>
              <p className="text-xs text-slate-400 mt-1">Até 80% do {metricType === 'SALES_QTY' ? 'volume' : 'valor'}</p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">Alta Importância</span>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-slate-900">
              {metricType === 'SALES_QTY' ? summary.A.value.toLocaleString('pt-BR') : `R$ ${summary.A.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            </p>
            <p className="text-sm font-medium text-slate-500 mt-1">{summary.A.count} produtos ({summary.A.percentage.toFixed(1)}%)</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-t-4 border-t-amber-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Classe B</p>
              <p className="text-xs text-slate-400 mt-1">Até 95% do {metricType === 'SALES_QTY' ? 'volume' : 'valor'}</p>
            </div>
            <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">Média Importância</span>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-slate-900">
              {metricType === 'SALES_QTY' ? summary.B.value.toLocaleString('pt-BR') : `R$ ${summary.B.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            </p>
            <p className="text-sm font-medium text-slate-500 mt-1">{summary.B.count} produtos ({summary.B.percentage.toFixed(1)}%)</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-t-4 border-t-slate-400">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Classe C</p>
              <p className="text-xs text-slate-400 mt-1">Restante (5%)</p>
            </div>
            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">Baixa Importância</span>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-slate-900">
              {metricType === 'SALES_QTY' ? summary.C.value.toLocaleString('pt-BR') : `R$ ${summary.C.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            </p>
            <p className="text-sm font-medium text-slate-500 mt-1">{summary.C.count} produtos ({summary.C.percentage.toFixed(1)}%)</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Curva
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Produto
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {metricType === 'STOCK_VALUE' ? 'Qtd Estoque' : 'Qtd Vendida'}
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Preço Unit.
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {metricType === 'SALES_QTY' ? 'Qtd Base (ABC)' : metricType === 'SALES_VALUE' ? 'Faturamento Total' : 'Valor Total'}
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  % Acumulada
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {abcData.length > 0 ? (
                abcData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm
                        ${item.abcClass === 'A' ? 'bg-emerald-100 text-emerald-700' : 
                          item.abcClass === 'B' ? 'bg-amber-100 text-amber-700' : 
                          'bg-slate-100 text-slate-700'}`}
                      >
                        {item.abcClass}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                          <Package size={16} />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-slate-900">{item.name}</div>
                          <div className="text-xs text-slate-500">{item.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm font-medium text-slate-900">{item.qty}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500">
                      R$ {item.price.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-slate-700">
                      {metricType === 'SALES_QTY' ? item.value.toLocaleString('pt-BR') : `R$ ${item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-slate-500">
                      {item.cumulativePercentage.toFixed(2)}%
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Nenhum dado encontrado para os filtros selecionados.
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
