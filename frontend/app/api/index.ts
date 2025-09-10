import axios from 'axios';

// URL do backend - ajuste conforme necessário
const API_BASE_URL = 'http://192.168.100.106:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// APIs do Dashboard
export const getDashboard = () => api.get('/dashboard');

// APIs de Produtos
export const getProdutos = (search?: string) => 
  api.get('/produtos', { params: { search } });

export const addProduto = (formData: FormData) => 
  api.post('/produtos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const updateProduto = (id: number, formData: FormData) => 
  api.put(`/produtos/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const deleteProduto = (id: number) => 
  api.delete(`/produtos/${id}`);

// APIs de Vendas
export const getVendas = (periodo?: string) => 
  api.get('/vendas', { params: { periodo } });

export const addVenda = (vendaData: any) => 
  api.post('/vendas', vendaData);

export const getVendaDetalhes = (id: number) => 
  api.get(`/vendas/${id}`);

// APIs de Relatórios
export const getRelatorios = () => 
  api.get('/relatorios/dashboard');

// APIs de Configurações
export const getBackup = () => 
  api.post('/backup');

export const getStatus = () => 
  api.get('/status');