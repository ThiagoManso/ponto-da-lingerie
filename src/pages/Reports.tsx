import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { FileText, FileSpreadsheet, Download, File, Printer } from 'lucide-react';

type ReportType = 'STOCK' | 'SALES' | 'TRANSFERS';

export const Reports: React.FC = () => {
  const { products, stock, locations, sales, transfers, getAvailableStock } = useInventory();
  const [reportType, setReportType] = useState<ReportType>('STOCK');

  // 1. Geradores de Dados para os Relatórios
  const reportData = useMemo(() => {
    switch (reportType) {
      case 'STOCK':
        return products.map(product => {
          const totalStock = getAvailableStock(product.id);
          const totalCost = totalStock * product.costPrice;
          const totalValue = totalStock * product.price;
          
          return {
            'SKU': product.sku,
            'Produto': product.name,
            'Categoria': product.category,
            'Estoque Total': totalStock,
            'Custo Unitário': `R$ ${product.costPrice.toFixed(2)}`,
            'Preço Venda': `R$ ${product.price.toFixed(2)}`,
            'Custo Total Imobilizado': `R$ ${totalCost.toFixed(2)}`,
            'Potencial de Receita': `R$ ${totalValue.toFixed(2)}`,
          };
        });

      case 'SALES':
        return sales.map(sale => {
          const product = products.find(p => p.id === sale.productId);
          const location = locations.find(l => l.id === sale.locationId);
          return {
            'Data': new Date(sale.date).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            'Recibo': sale.receiptId || '-',
            'Filial': location?.name || '-',
            'Produto': product?.name || 'Produto Excluído',
            'Qtd': sale.quantity,
            'Valor Unitário': `R$ ${sale.unitPrice.toFixed(2)}`,
            'Desconto': `R$ ${(sale.discount || 0).toFixed(2)}`,
            'Valor Total': `R$ ${sale.totalValue.toFixed(2)}`,
          };
        });

      case 'TRANSFERS':
        return transfers.map(transfer => {
          const product = products.find(p => p.id === transfer.productId);
          const fromLoc = locations.find(l => l.id === transfer.fromLocationId);
          const toLoc = locations.find(l => l.id === transfer.toLocationId);
          return {
            'Data': new Date(transfer.date).toLocaleDateString('pt-BR'),
            'Produto': product?.name || 'Produto Excluído',
            'Tamanho': transfer.size,
            'Origem': fromLoc?.name || '-',
            'Destino': toLoc?.name || '-',
            'Quantidade': transfer.quantity,
            'Status': transfer.status === 'COMPLETED' ? 'Concluído' : 'Pendente',
            'Frete': transfer.shippingMethod === 'OWN_TRANSPORT' ? 'Frota Própria' : 'Transportadora'
          };
        });
        
      default:
        return [];
    }
  }, [reportType, products, sales, transfers, locations, getAvailableStock]);

  const headers = reportData.length > 0 ? Object.keys(reportData[0]) : [];

  // 2. Funções de Exportação
  const exportCSV = () => {
    if (reportData.length === 0) return;
    
    const csvContent = [
      headers.join(';'), // Cabeçalho
      ...reportData.map(row => 
        headers.map(header => {
          const cell = row[header as keyof typeof row] || '';
          // Limpa vírgulas/pontos e coloca aspas para evitar quebra de colunas no Excel
          return `"${String(cell).replace(/"/g, '""')}"`;
        }).join(';')
      )
    ].join('\n');

    // BOM para o Excel ler acentos corretamente
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Relatorio_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportPrint = () => {
    window.print();
  };

  const exportExcelMock = () => {
    // Para um Excel real nativo (.xlsx), seria recomendado adicionar a biblioteca 'xlsx' (SheetJS).
    // Como alternativa imediata, exportamos o CSV que o Excel abre perfeitamente.
    exportCSV();
    alert("Arquivo exportado em formato CSV compatível com Excel.");
  };

  return (
    <div className="space-y-6">
      {/* Header e Controles */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Extrator de Relatórios</h2>
          <p className="text-sm text-slate-500">Selecione o tipo de relatório para pré-visualizar e exportar.</p>
        </div>

        <select 
          value={reportType}
          onChange={(e) => setReportType(e.target.value as ReportType)}
          className="border border-slate-300 rounded-xl px-4 py-2 bg-slate-50 text-slate-800 font-medium focus:ring-pink-500 focus:border-pink-500 min-w-[250px]"
        >
          <option value="STOCK">Posição de Estoque Geral</option>
          <option value="SALES">Histórico de Vendas</option>
          <option value="TRANSFERS">Logística de Transferências</option>
        </select>
      </div>

      {/* Ações de Exportação */}
      <div className="flex flex-wrap gap-3">
        <button onClick={exportCSV} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm">
          <FileText size={18} /> Exportar CSV
        </button>
        <button onClick={exportExcelMock} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm">
          <FileSpreadsheet size={18} /> Exportar Excel
        </button>
        <button onClick={exportPrint} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm">
          <File size={18} /> Salvar PDF / Imprimir
        </button>
      </div>

      {/* Tabela de Pré-visualização (Área Imprimível) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:shadow-none print:border-none">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center print:hidden">
          <span className="font-bold text-slate-700">Pré-visualização dos Dados ({reportData.length} registros)</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 print:bg-white">
              <tr>
                {headers.map(header => (
                  <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider print:text-black print:border-b">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {reportData.length > 0 ? (
                reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    {headers.map(header => (
                      <td key={header} className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 print:text-black">
                        {row[header as keyof typeof row]}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={headers.length || 1} className="px-6 py-12 text-center text-slate-500">
                    Nenhum dado encontrado para este relatório.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:hidden { display: none !important; }
          .overflow-x-auto table, .overflow-x-auto table * { visibility: visible; }
          .overflow-x-auto { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
};
