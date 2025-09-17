// utils/debug.ts
import { Alert } from 'react-native';
import { testConnection } from '../api';

export const DEBUG_MODE = __DEV__; // Ativa apenas em desenvolvimento

// Função para logs detalhados
export const debugLog = (title: string, data?: any) => {
  if (DEBUG_MODE) {
    console.log(`🔧 [DEBUG] ${title}`, data || '');
  }
};

// Função para logs de erro
export const errorLog = (title: string, error: any) => {
  console.error(`❌ [ERROR] ${title}`, error);
  
  if (DEBUG_MODE) {
    // Em desenvolvimento, mostra mais detalhes
    console.error('Stack trace:', error.stack);
    console.error('Full error object:', JSON.stringify(error, null, 2));
  }
};

// Função para testar todas as conexões do app
export const runDiagnostics = async () => {
  debugLog('Iniciando diagnósticos do app...');
  
  const results = {
    backend_connection: false,
    permissions: {
      camera: false,
      media_library: false,
    },
    network: false,
  };

  try {
    // Teste 1: Conexão com backend
    debugLog('Testando conexão com backend...');
    results.backend_connection = await testConnection();
    
    // Teste 2: Permissões (se necessário)
    debugLog('Verificando permissões...');
    // Aqui você pode adicionar verificações de permissões se necessário
    
    // Teste 3: Conectividade de rede
    debugLog('Testando conectividade de rede...');
    try {
      const response = await fetch('https://www.google.com', { 
        method: 'HEAD',
        mode: 'no-cors' 
      });
      results.network = true;
    } catch (error) {
      results.network = false;
    }

    debugLog('Resultados dos diagnósticos:', results);
    
    return results;
  } catch (error) {
    errorLog('Erro durante diagnósticos', error);
    return results;
  }
};

// Função para mostrar informações de debug ao usuário
export const showDebugInfo = async () => {
  if (!DEBUG_MODE) return;

  const diagnostics = await runDiagnostics();
  
  const message = `
🔧 Informações de Debug:

📡 Backend: ${diagnostics.backend_connection ? '✅ Conectado' : '❌ Desconectado'}
🌐 Internet: ${diagnostics.network ? '✅ Conectado' : '❌ Desconectado'}

🔗 URL Backend: http://localhost:3000/api

💡 Dicas:
- Certifique-se que o backend Node.js está rodando
- Verifique se a URL do backend está correta
- Em dispositivo físico, use o IP da sua máquina
  `;

  Alert.alert('Debug Info', message);
};

// Configurações do app
export const AppConfig = {
  // URLs do backend
  BACKEND_URL: __DEV__ 
    ? 'http://localhost:3000/api' // Desenvolvimento
    : 'https://seu-backend-producao.com/api', // Produção
    
  // URLs para dispositivos físicos (ajuste o IP conforme necessário)
  BACKEND_URL_DEVICE: 'http://192.168.100.106:3000/api',
  
  // Timeouts
  API_TIMEOUT: 10000, // 10 segundos
  UPLOAD_TIMEOUT: 30000, // 30 segundos para uploads
  
  // Configurações de imagem
  IMAGE_QUALITY: 0.8,
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  
  // Debug
  ENABLE_API_LOGS: __DEV__,
  ENABLE_DEBUG_PANEL: __DEV__,
};

// Função para obter a URL correta do backend
export const getBackendUrl = () => {
  // Em desenvolvimento, você pode alternar entre localhost e IP da máquina
  if (__DEV__) {
    // Para emulador, use localhost
    // Para dispositivo físico, descomente a linha abaixo e ajuste o IP
    // return AppConfig.BACKEND_URL_DEVICE;
    return AppConfig.BACKEND_URL;
  }
  
  return AppConfig.BACKEND_URL;
};

// Função para validar FormData antes de enviar
export const validateFormData = (formData: FormData): boolean => {
  debugLog('Validando FormData...');
  
  try {
    // Verificar se FormData tem os campos obrigatórios
    const nome = formData.get('nome');
    const preco_custo = formData.get('preco_custo');
    const preco_venda = formData.get('preco_venda');
    
    if (!nome || !preco_custo || !preco_venda) {
      errorLog('FormData inválido: campos obrigatórios ausentes', {
        nome: !!nome,
        preco_custo: !!preco_custo,
        preco_venda: !!preco_venda,
      });
      return false;
    }
    
    debugLog('FormData válido', {
      nome,
      preco_custo,
      preco_venda,
      has_image: !!formData.get('imagem'),
    });
    
    return true;
  } catch (error) {
    errorLog('Erro ao validar FormData', error);
    return false;
  }
};

// Função para formatar valores monetários
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Função para validar entrada numérica
export const validateNumericInput = (value: string, allowNegative = false): boolean => {
  if (!value || value.trim() === '') return false;
  
  const numericValue = parseFloat(value);
  
  if (isNaN(numericValue)) return false;
  if (!allowNegative && numericValue < 0) return false;
  
  return true;
};

// Função para limpar entrada numérica
export const cleanNumericInput = (value: string): string => {
  // Remove caracteres não numéricos, exceto ponto e vírgula
  return value.replace(/[^0-9.,]/g, '').replace(',', '.');
};

// Função para mostrar alertas de erro padronizados
export const showError = (title: string, message: string, error?: any) => {
  errorLog(`${title}: ${message}`, error);
  
  Alert.alert(
    title,
    DEBUG_MODE && error ? `${message}\n\nDebug: ${error.message}` : message,
    [{ text: 'OK' }]
  );
};

// Função para mostrar alertas de sucesso padronizados
export const showSuccess = (title: string, message: string, onPress?: () => void) => {
  debugLog(`${title}: ${message}`);
  
  Alert.alert(
    title,
    message,
    [{ text: 'OK', onPress }]
  );
};