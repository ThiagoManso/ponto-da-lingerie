// src/services/melhorEnvio.ts

// Em produção, mude para https://www.melhorenvio.com.br
const BASE_URL = 'https://sandbox.melhorenvio.com.br'; 

// Cole aqui o seu token gerado no painel do Melhor Envio (Ambiente Sandbox)
const API_TOKEN = 'COLE_SEU_TOKEN_DE_TESTE_AQUI'; 

const headers = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_TOKEN}`,
  'User-Agent': 'PontoDaLingerie (seu-email@exemplo.com)' 
};

export interface QuoteRequest {
  fromCep: string;
  toCep: string;
  weight: number; // em kg
  width: number; // em cm
  height: number; // em cm
  length: number; // em cm
}

export const calculateShipping = async (data: QuoteRequest) => {
  try {
    // Se o token for o placeholder, retorna dados mockados para demonstração
    if (API_TOKEN === 'COLE_SEU_TOKEN_DE_TESTE_AQUI') {
      console.log('Usando dados mockados (Token não configurado)');
      return mockShippingRates();
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
    
    if (!response.ok) throw new Error('Erro ao calcular frete');
    return await response.json();
  } catch (error) {
    console.error('Erro na cotação do Melhor Envio:', error);
    // Fallback para mock em caso de erro de CORS ou rede no ambiente de teste
    console.log('Fallback para dados mockados devido a erro de rede/CORS');
    return mockShippingRates();
  }
};

const mockShippingRates = () => {
  return [
    {
      id: 1,
      name: 'PAC',
      price: '25.50',
      custom_price: '22.10',
      discount: '3.40',
      currency: 'R$',
      delivery_time: 5,
      company: {
        name: 'Correios',
        picture: 'https://melhorenvio.com.br/images/shipping-companies/correios.png'
      }
    },
    {
      id: 2,
      name: 'Sedex',
      price: '45.00',
      custom_price: '38.50',
      discount: '6.50',
      currency: 'R$',
      delivery_time: 2,
      company: {
        name: 'Correios',
        picture: 'https://melhorenvio.com.br/images/shipping-companies/correios.png'
      }
    },
    {
      id: 3,
      name: 'Jadlog Package',
      price: '30.00',
      custom_price: '25.00',
      discount: '5.00',
      currency: 'R$',
      delivery_time: 4,
      company: {
        name: 'Jadlog',
        picture: 'https://melhorenvio.com.br/images/shipping-companies/jadlog.png'
      }
    }
  ];
};

// Estrutura base para a compra e impressão da etiqueta
export const generateLabel = async (rateId: number) => {
  // Nota: O fluxo completo de compra exige enviar os dados do remetente, destinatário e NF-e/Declaração.
  // Aqui está a estrutura para adicionar ao carrinho.
  console.log(`Simulando adição da transportadora ${rateId} ao carrinho...`);
  return { success: true, orderId: 'ME-123456' };
};

export const printLabelMock = async (orderId: string) => {
  // Na API real, você chamaria /api/v2/me/shipment/print
  console.log(`Simulando impressão da etiqueta ${orderId}...`);
  alert(`Abrindo PDF da etiqueta ${orderId} em nova aba... (Simulação)`);
};
