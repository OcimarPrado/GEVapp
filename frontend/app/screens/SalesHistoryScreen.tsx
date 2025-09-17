import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';

interface Venda {
  id: number;
  cliente_nome: string;
  total: number;
  lucro: number;
  forma_pagamento: string;
  status: string;
  data_venda: string;
}

export default function SalesHistoryScreen({ navigation }: any) {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtroSelecionado, setFiltroSelecionado] = useState('');

  const filtros = [
    { key: '', label: 'Todas' },
    { key: 'hoje', label: 'Hoje' },
    { key: 'semana', label: 'Semana' },
    { key: 'mes', label: 'Mês' },
  ];

  const carregarVendas = async (periodo?: string) => {
    try {
      setLoading(true);
      
      const url = periodo 
        ? `http://localhost:3000/api/vendas?periodo=${periodo}`
        : 'http://localhost:3000/api/vendas';

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setVendas(result.data);
      } else {
        throw new Error(result.error || 'Erro ao carregar vendas');
      }
    } catch (error: any) {
      console.error('Erro ao carregar vendas:', error);
      Alert.alert('Erro', 'Não foi possível carregar o histórico de vendas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    carregarVendas();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    carregarVendas(filtroSelecionado);
  };

  const aplicarFiltro = (filtro: string) => {
    setFiltroSelecionado(filtro);
    carregarVendas(filtro);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluida':
        return '#4CAF50';
      case 'pendente':
        return '#FF9800';
      case 'cancelada':
        return '#F44336';
      default:
        return '#999';
    }
  };

  const getFormaPagamentoIcon = (forma: string) => {
    switch (forma) {
      case 'dinheiro':
        return '💵';
      case 'cartao':
        return '💳';
      case 'pix':
        return '📱';
      default:
        return '💰';
    }
  };

  const calcularResumo = () => {
    const totalVendas = vendas.reduce((sum, venda) => sum + venda.total, 0);
    const totalLucro = vendas.reduce((sum, venda) => sum + venda.lucro, 0);
    return { totalVendas, totalLucro, quantidade: vendas.length };
  };

  const renderVenda = ({ item }: { item: Venda }) => (
    <TouchableOpacity 
      style={styles.vendaItem}
      onPress={() => navigation.navigate('VendaDetalhes', { vendaId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.vendaHeader}>
        <View style={styles.vendaInfo}>
          <Text style={styles.vendaCliente}>
            {item.cliente_nome || 'Cliente Avulso'}
          </Text>
          <Text style={styles.vendaData}>
            {formatDate(item.data_venda)}
          </Text>
        </View>
        
        <View style={styles.vendaStatus}>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: getStatusColor(item.status) }
          ]}>
            <Text style={styles.statusText}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.vendaFooter}>
        <View style={styles.vendaValores}>
          <Text style={styles.vendaTotal}>
            Total: {formatCurrency(item.total)}
          </Text>
          <Text style={styles.vendaLucro}>
            Lucro: {formatCurrency(item.lucro)}
          </Text>
        </View>
        
        <View style={styles.vendaPagamento}>
          <Text style={styles.pagamentoIcon}>
            {getFormaPagamentoIcon(item.forma_pagamento)}
          </Text>
          <Text style={styles.pagamentoTexto}>
            {item.forma_pagamento.charAt(0).toUpperCase() + item.forma_pagamento.slice(1)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const resumo = calcularResumo();

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Histórico de Vendas</Text>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Carregando vendas...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Histórico de Vendas</Text>
      </View>

      {/* Filtros */}
      <View style={styles.filtrosContainer}>
        <FlatList
          data={filtros}
          horizontal
          keyExtractor={item => item.key}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filtroButton,
                filtroSelecionado === item.key && styles.filtroButtonSelected
              ]}
              onPress={() => aplicarFiltro(item.key)}
            >
              <Text style={[
                styles.filtroButtonText,
                filtroSelecionado === item.key && styles.filtroButtonTextSelected
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filtrosList}
        />
      </View>

      {/* Resumo */}
      {vendas.length > 0 && (
        <View style={styles.resumoContainer}>
          <View style={styles.resumoItem}>
            <Text style={styles.resumoLabel}>Vendas</Text>
            <Text style={styles.resumoValor}>{resumo.quantidade}</Text>
          </View>
          <View style={styles.resumoItem}>
            <Text style={styles.resumoLabel}>Total</Text>
            <Text style={styles.resumoValor}>
              {formatCurrency(resumo.totalVendas)}
            </Text>
          </View>
          <View style={styles.resumoItem}>
            <Text style={styles.resumoLabel}>Lucro</Text>
            <Text style={styles.resumoValor}>
              {formatCurrency(resumo.totalLucro)}
            </Text>
          </View>
        </View>
      )}

      {/* Lista de vendas */}
      {vendas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>Nenhuma venda encontrada</Text>
          <Text style={styles.emptySubtitle}>
            Não há vendas para o período selecionado
          </Text>
        </View>
      ) : (
        <FlatList
          data={vendas}
          keyExtractor={item => item.id.toString()}
          renderItem={renderVenda}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2196F3']}
              tintColor="#2196F3"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 55,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  filtrosContainer: {
    backgroundColor: 'white',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filtrosList: {
    paddingHorizontal: 20,
  },
  filtroButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filtroButtonSelected: {
    backgroundColor: '#2196F3',
  },
  filtroButtonText: {
    fontSize: 14,
    color: '#666',
  },
  filtroButtonTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  resumoContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 20,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resumoItem: {
    alignItems: 'center',
  },
  resumoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  resumoValor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  listContainer: {
    padding: 20,
  },
  vendaItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  vendaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  vendaInfo: {
    flex: 1,
  },
  vendaCliente: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  vendaData: {
    fontSize: 12,
    color: '#666',
  },
  vendaStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  vendaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  vendaValores: {
    flex: 1,
  },
  vendaTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  vendaLucro: {
    fontSize: 14,
    color: '#4CAF50',
  },
  vendaPagamento: {
    alignItems: 'center',
  },
  pagamentoIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  pagamentoTexto: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});