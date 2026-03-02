import React, { useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Truck, MapPin, Package, CheckCircle2, ArrowRight } from 'lucide-react';

export const Routing: React.FC = () => {
  const { transfers, locations, products, completeRoute } = useInventory();

  const routes = useMemo(() => {
    const pendingOwnTransport = transfers.filter(
      t => t.status === 'PENDING' && t.shippingMethod === 'OWN_TRANSPORT'
    );

    const grouped = pendingOwnTransport.reduce((acc, transfer) => {
      if (!acc[transfer.toLocationId]) {
        acc[transfer.toLocationId] = [];
      }
      acc[transfer.toLocationId].push(transfer);
      return acc;
    }, {} as Record<string, typeof transfers>);

    return Object.entries(grouped).map(([destinationId, groupTransfers]) => {
      const destination = locations.find(l => l.id === destinationId);
      const totalItems = groupTransfers.reduce((sum, t) => sum + t.quantity, 0);
      
      // Group products for summary
      const productSummary = groupTransfers.reduce((acc, t) => {
        const product = products.find(p => p.id === t.productId);
        if (product) {
          if (!acc[product.name]) acc[product.name] = 0;
          acc[product.name] += t.quantity;
        }
        return acc;
      }, {} as Record<string, number>);

      return {
        destinationId,
        destination,
        transfers: groupTransfers,
        totalItems,
        productSummary
      };
    });
  }, [transfers, locations, products]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Truck className="text-pink-600" />
            Roteirização e Entregas
          </h2>
          <p className="text-sm text-slate-500 mt-1">Gerencie as rotas de entrega do transporte próprio.</p>
        </div>
      </div>

      {routes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center text-slate-500">
          <Truck size={48} className="mb-4 opacity-20" />
          <p className="text-lg font-medium">Nenhuma rota pendente</p>
          <p className="text-sm">Não há transferências aguardando transporte próprio no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline / Map Visualization (Left Column) */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <MapPin className="text-pink-600" size={20} />
              Plano de Rotas
            </h3>
            
            <div className="relative border-l-2 border-slate-200 ml-3 space-y-8">
              <div className="relative">
                <div className="absolute -left-[11px] bg-pink-600 rounded-full p-1 border-4 border-white">
                  <StoreIcon size={12} className="text-white" />
                </div>
                <div className="pl-6">
                  <p className="text-sm font-bold text-slate-900">Matriz / CD</p>
                  <p className="text-xs text-slate-500">Ponto de Partida</p>
                </div>
              </div>

              {routes.map((route, index) => (
                <div key={route.destinationId} className="relative">
                  <div className="absolute -left-[9px] bg-indigo-500 rounded-full w-4 h-4 border-4 border-white"></div>
                  <div className="pl-6">
                    <p className="text-sm font-bold text-slate-900">Parada {index + 1}: {route.destination?.name}</p>
                    <p className="text-xs text-slate-500">{route.totalItems} peças para descarregar</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Route Cards (Right Column) */}
          <div className="lg:col-span-2 space-y-4">
            {routes.map(route => (
              <div key={route.destinationId} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        Entrega para: {route.destination?.name}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                        <MapPin size={14} />
                        <span>{route.destination?.address}</span>
                      </div>
                    </div>
                    <div className="bg-pink-100 text-pink-700 px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-2">
                      <Package size={16} />
                      {route.totalItems} peças
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Resumo da Carga</h4>
                  <ul className="space-y-2 mb-6">
                    {Object.entries(route.productSummary).map(([name, qty]) => (
                      <li key={name} className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">{name}</span>
                        <span className="font-medium text-slate-900">{qty} un</span>
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={() => completeRoute(route.destinationId)}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <CheckCircle2 size={20} />
                    Confirmar Entrega no Destino
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper icon since Store isn't imported in this file directly
const StoreIcon = ({ size, className }: { size: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/>
  </svg>
);
