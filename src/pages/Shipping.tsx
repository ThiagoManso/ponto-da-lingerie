import React, { useState } from 'react';
import { Truck, Package, Printer, Search, CheckCircle, AlertCircle } from 'lucide-react';
import { calculateShipping, generateLabel, printLabelMock } from '../services/melhorEnvio';

export const Shipping: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [rates, setRates] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    fromCep: '01001000', // CEP Central
    toCep: '',
    weight: 1,
    width: 20,
    height: 15,
    length: 20
  });

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Chamada real para o serviço
      const result = await calculateShipping(formData);
      // O Melhor Envio retorna um array com as transportadoras. Filtramos as que não deram erro.
      const validRates = result.filter((r: any) => !r.error);
      setRates(validRates);
    } catch (error) {
      alert('Erro ao calcular frete. Verifique o console e seu Token.');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyLabel = async (rate: any) => {
    if(window.confirm(`Confirmar geração de etiqueta via ${rate.company.name} por R$ ${rate.price}?`)) {
      await generateLabel(rate.id);
      alert('Etiqueta gerada com sucesso! Ela foi movida para a fila de impressão.');
      await printLabelMock('ME-987654');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-pink-100 rounded-lg text-pink-600">
          <Truck size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Expedição e Melhor Envio</h2>
          <p className="text-sm text-slate-500">Cote fretes e gere etiquetas de postagem diretamente pela plataforma.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Cotação */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Search size={20} className="text-slate-400" />
            Nova Cotação
          </h3>
          <form onSubmit={handleCalculate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">CEP Destino</label>
              <input 
                type="text" 
                required
                maxLength={8}
                placeholder="Ex: 01001000"
                value={formData.toCep}
                onChange={e => setFormData({...formData, toCep: e.target.value})}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Peso (kg)</label>
                <input 
                  type="number" step="0.1" required
                  value={formData.weight}
                  onChange={e => setFormData({...formData, weight: parseFloat(e.target.value)})}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Largura (cm)</label>
                <input 
                  type="number" required
                  value={formData.width}
                  onChange={e => setFormData({...formData, width: parseInt(e.target.value)})}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Altura (cm)</label>
                <input 
                  type="number" required
                  value={formData.height}
                  onChange={e => setFormData({...formData, height: parseInt(e.target.value)})}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Compr. (cm)</label>
                <input 
                  type="number" required
                  value={formData.length}
                  onChange={e => setFormData({...formData, length: parseInt(e.target.value)})}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Calculando...' : 'Calcular Frete'}
            </button>
          </form>
        </div>

        {/* Resultados da Cotação */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Package size={20} className="text-slate-400" />
            Opções de Envio
          </h3>
          
          {rates.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
              <Truck size={48} className="mb-2 opacity-20" />
              <p>Preencha os dados e calcule para ver as opções.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rates.map((rate) => (
                <div key={rate.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-pink-300 transition-colors">
                  <div className="flex items-center gap-4">
                    <img src={rate.company.picture} alt={rate.company.name} className="h-10 w-10 object-contain rounded-lg bg-white p-1 border border-slate-200" />
                    <div>
                      <h4 className="font-bold text-slate-900">{rate.name}</h4>
                      <p className="text-sm text-slate-500">
                        Chega em {rate.delivery_time} dias úteis
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-slate-400 line-through">R$ {rate.custom_price}</p>
                      <p className="font-bold text-emerald-600 text-lg">R$ {rate.price}</p>
                    </div>
                    <button 
                      onClick={() => handleBuyLabel(rate)}
                      className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                    >
                      <Printer size={16} />
                      Gerar Etiqueta
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
