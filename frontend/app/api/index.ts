// api/index.ts
import axios from 'axios';
import { getBackendUrl, AppConfig, debugLog, errorLog } from '../utils/debug';

const api = axios.create({
  baseURL: getBackendUrl(), // ✅ Agora usa a URL dinâmica
  timeout: AppConfig.API_TIMEOUT,
});

// Configure a URL base do seu backend
const BASE_URL = 'http://192.168.100.106:3000/api'; // Ajuste para seu IP se testando no device
// Para dispositivo físico use algo como: 'http://192.168.1.100:3000/api'



// Interceptor para logs de requisições
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      headers: config.headers,
      data: config.data instanceof FormData ? 'FormData' : config.data,
    });
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para logs de respostas
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status}`, response.data);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

// ================================
// DASHBOARD
// ================================
export const getDashboard = async () => {
  try {
    const response = await api.get('/dashboard');
    return response;
  } catch (error) {
    console.error('Erro ao buscar dashboard:', error);
    throw error;
  }
};

// ================================
// PRODUTOS
// ================================
export const getProdutos = async (search?: string) => {
  try {
    const params = search ? { search } : {};
    const response = await api.get('/produtos', { params });
    return response;
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    throw error;
  }
};

export const getProduto = async (id: number) => {
  try {
    const response = await api.get(`/produtos/${id}`);
    return response;
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    throw error;
  }
};

export const addProduto = async (formData: FormData) => {
  try {
    // Para FormData, precisamos definir o Content-Type adequado
    const response = await api.post('/produtos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      // Increase timeout for file uploads
      timeout: 30000, // 30 segundos
    });
    return response;
  } catch (error) {
    console.error('Erro ao adicionar produto:', error);
    throw error;
  }
};

export const updateProduto = async (id: number, formData: FormData) => {
  try {
    const response = await api.put(`/produtos/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 segundos
    });
    return response;
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    throw error;
  }
};

export const deleteProduto = async (id: number) => {
  try {
    const response = await api.delete(`/produtos/${id}`);
    return response;
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    throw error;
  }
};

// ================================
// VENDAS
// ================================
export const getVendas = async (periodo?: string) => {
  try {
    const params = periodo ? { periodo } : {};
    const response = await api.get('/vendas', { params });
    return response;
  } catch (error) {
    console.error('Erro ao buscar vendas:', error);
    throw error;
  }
};

export const getVenda = async (id: number) => {
  try {
    const response = await api.get(`/vendas/${id}`);
    return response;
  } catch (error) {
    console.error('Erro ao buscar venda:', error);
    throw error;
  }
};

export const addVenda = async (vendaData: any) => {
  try {
    const response = await api.post('/vendas', vendaData);
    return response;
  } catch (error) {
    console.error('Erro ao adicionar venda:', error);
    throw error;
  }
};

// ================================
// RELATÓRIOS
// ================================
export const getRelatorios = async () => {
  try {
    const response = await api.get('/relatorios/dashboard');
    return response;
  } catch (error) {
    console.error('Erro ao buscar relatórios:', error);
    throw error;
  }
};

// ================================
// CONFIGURAÇÕES
// ================================
export const getStatus = async () => {
  try {
    const response = await api.get('/status');
    return response;
  } catch (error) {
    console.error('Erro ao buscar status:', error);
    throw error;
  }
};

export const createBackup = async () => {
  try {
    const response = await api.post('/backup');
    return response;
  } catch (error) {
    console.error('Erro ao criar backup:', error);
    throw error;
  }
};

// ================================
// UTILITÁRIOS
// ================================

// Função para testar conectividade com o backend
export const testConnection = async () => {
  try {
    console.log('🧪 Testando conexão com o backend...');
    const response = await api.get('/status');
    console.log('✅ Backend conectado com sucesso!', response.data);
    return true;
  } catch (error: any) {
    console.error('❌ Erro de conexão com o backend:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
    });
    
    // Mensagens mais específicas para debugging
    if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
      console.error('💡 Dica: Verifique se o backend está rodando e se a URL está correta');
    }
    
    if (error.code === 'ECONNABORTED') {
      console.error('💡 Dica: Timeout na conexão - backend pode estar lento');
    }
    
    return false;
  }
};

// Função para formatar erros de API
export const formatApiError = (error: any) => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'Erro desconhecido na API';
};

export default api;