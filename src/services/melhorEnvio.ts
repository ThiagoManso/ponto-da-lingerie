// src/services/melhorEnvio.ts

const BASE_URL = '/api-melhor-envio';
const API_TOKEN = import.meta.env.VITE_MELHOR_ENVIO_TOKEN; 

const headers = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_TOKEN}`,
  'User-Agent': 'PontoDaLingerie (seu-email@exemplo.com)' 
};

export interface QuoteRequest {
  fromCep: string;
  toCep: string;
  weight: number;
  width: number;
  height: number;
  length: number;
}

export const calculateShipping = async (data: QuoteRequest) => {
  try {
    if (!API_TOKEN) {
      throw new Error('Token do Melhor Envio não configurado nas variáveis de ambiente.');
    }

    const response = await fetch(`${BASE_URL}/api/v2/me/shipment/calculate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        from: { postal_code: data.fromCep },
        to: { postal_code: data.toCep },
        package: {
          weight: data.weight,
          width: data.width,
          height: data.height,
          length: data.length
        }
      })
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        console.error('Detalhes do Erro da API Melhor Envio:', errorData);
        throw new Error(`Falha na API do Melhor Envio: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro na cotação (Sem fallback para mock):', error);
    throw error; 
  }
};

export const generateLabel = async (rateId: number) => {
  console.log(`Simulando adição da transportadora ${rateId} ao carrinho...`);
  return { success: true, orderId: 'ME-123456' };
};

export const printLabelMock = async (orderId: string) => {
  console.log(`Simulando impressão da etiqueta ${orderId}...`);
  alert(`Abrindo PDF da etiqueta ${orderId} em nova aba... (Simulação)`);
};
