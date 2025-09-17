import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';

interface ResumoFinanceiro {
  total_vendas: number;
  receita_total: number;
  custo_total: number;
  lucro_total: number;
  ticket_medio: number;
}

interface TopProduto {
  produto_nome: string;
  total_vendido: number;
  receita_total: number;
}

interface VendaDiaria {
  data: string;
  total_vendas: number;
  quantidade_vendas: number;
}

interface RelatorioData {
  vendas_diarias: VendaDiaria[];
  top_produtos: TopProduto[];
  resumo_financeiro: ResumoFinanceiro;
}

export default function ReportsScreen({ navigation }: any) {
  const [data, setData] = useState<RelatorioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const carregarRelatorios = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      console.log('📊 Carregando relatórios...');

      // Testar conectividade primeiro
      const statusResponse = await fetch('http://localhost:3000/api/status');
      if (!statusResponse.ok) {
        throw new Error('Backend não está respondendo');
      }

      console.log('✅ Backend conectado, carregando relatórios...');

      const response = await fetch('http://localhost:3000/api/relatorios/dashboard');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('📊 Resposta dos relatórios:', result);

      if (result.success && result.data) {
        setData(result.data);
        console.log('✅ Relatórios carregados com sucesso');
      } else {
        console.warn('⚠️ Sem dados de relatórios disponíveis');
        setData(null);
      }

    } catch (error: any) {
      console.error('❌ Erro ao carregar relatórios:', error);
      
      Alert.alert(
        'Erro nos Relatórios',
        `Não foi possível carregar os relatórios.\nErro: ${error.message}\n\nVerifique se o backend está rodando.`,
        [
          { text: 'Tentar Novamente', onPress: () => carregarRelatorios() },
          { text: 'OK' }
        ]
      );
      
      setData(null);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  };

  useEffect(() => {
    carregarRelatorios();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    carregarRelatorios(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const calcularMargemLucro = () => {
    if (!data?.resumo_financeiro) return 0;
    
    const { receita_total, custo_total } = data.resumo_financeiro;
    
    if (custo_total === 0) return 0;
    
    return ((receita_total - custo_total) / custo_total * 100);
  };

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
          <Text style={styles.title}>Relatórios</Text>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Carregando relatórios...</Text>
        </View>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Relatórios</Text>
        </View>
        
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>Sem dados para exibir</Text>
          <Text style={styles.emptySubtitle}>
            Ainda não há vendas suficientes para gerar relatórios
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => carregarRelatorios()}
          >
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
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
        <Text style={styles.title}>Relatórios</Text>
        <Text style={styles.subtitle}>Análise de Desempenho</Text>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2196F3']}
            tintColor="#2196F3"
          />
        }
      >
        {/* Resumo Financeiro */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Resumo do Mês</Text>
          
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, styles.primaryCard]}>
              <Text style={styles.metricValue}>
                {formatCurrency(data.resumo_financeiro.receita_total)}
              </Text>
              <Text style={styles.metricLabel}>Receita Total</Text>
            </View>

            <View style={[styles.metricCard, styles.successCard]}>
              <Text style={styles.metricValue}>
                {formatCurrency(data.resumo_financeiro.lucro_total)}
              </Text>
              <Text style={styles.metricLabel}>Lucro Total</Text>
            </View>
          </View>

          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, styles.infoCard]}>
              <Text style={styles.metricValue}>
                {data.resumo_financeiro.total_vendas}
              </Text>
              <Text style={styles.metricLabel}>Total de Vendas</Text>
            </View>

            <View style={[styles.metricCard, styles.warningCard]}>
              <Text style={styles.metricValue}>
                {formatCurrency(data.resumo_financeiro.ticket_medio)}
              </Text>
              <Text style={styles.metricLabel}>Ticket Médio</Text>
            </View>
          </View>

          {/* Margem de Lucro */}
          <View style={styles.margemCard}>
            <Text style={styles.margemLabel}>Margem de Lucro Geral</Text>
            <Text style={styles.margemValue}>
              {calcularMargemLucro().toFixed(2)}%
            </Text>
            {calcularMargemLucro() < 20 && (
              <Text style={styles.margemAlert}>
                ⚠️ Margem baixa - considere revisar preços
              </Text>
            )}
          </View>
        </View>

        {/* Top Produtos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Produtos Mais Vendidos</Text>
          
          {data.top_produtos.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>
                Nenhuma venda registrada ainda
              </Text>
            </View>
          ) : (
            <View style={styles.topProdutosContainer}>
              {data.top_produtos.map((produto, index) => (
                <View key={index} style={styles.topProdutoItem}>
                  <View style={styles.rankingNumber}>
                    <Text style={styles.rankingText}>{index + 1}°</Text>
                  </View>
                  
                  <View style={styles.produtoInfo}>
                    <Text style={styles.produtoNome} numberOfLines={1}>
                      {produto.produto_nome}
                    </Text>
                    <Text style={styles.produtoDetalhes}>
                      {produto.total_vendido} unidades • {formatCurrency(produto.receita_total)}
                    </Text>
                  </View>
                  
                  <View style={styles.produtoMedal}>
                    <Text style={styles.medalIcon}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Vendas Diárias */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Vendas dos Últimos 7 Dias</Text>
          
          {data.vendas_diarias.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>
                Nenhuma venda nos últimos 7 dias
              </Text>
            </View>
          ) : (
            <View style={styles.vendasDiariasContainer}>
              {data.vendas_diarias.map((venda, index) => (
                <View key={index} style={styles.vendaDiariaItem}>
                  <Text style={styles.vendaData}>
                    {formatDate(venda.data)}
                  </Text>
                  <View style={styles.vendaBarContainer}>
                    <View 
                      style={[
                        styles.vendaBar,
                        { 
                          width: `${Math.max((venda.total_vendas / Math.max(...data.vendas_diarias.map(v => v.total_vendas))) * 100, 5)}%` 
                        }
                      ]}
                    />
                  </View>
                  <View style={styles.vendaValores}>
                    <Text style={styles.vendaTotal}>
                      {formatCurrency(venda.total_vendas)}
                    </Text>
                    <Text style={styles.vendaQuantidade}>
                      {venda.quantidade_vendas} vendas
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Dicas de Crescimento */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Insights e Recomendações</Text>
          
          <View style={styles.insightsContainer}>
            {data.resumo_financeiro.total_vendas < 10 && (
              <View style={styles.insightCard}>
                <Text style={styles.insightTitle}>📈 Aumente suas vendas</Text>
                <Text style={styles.insightText}>
                  Você tem poucos produtos vendidos. Considere fazer promoções ou divulgar mais seus produtos.
                </Text>
              </View>
            )}

            {calcularMargemLucro() < 20 && (
              <View style={styles.insightCard}>
                <Text style={styles.insightTitle}>💰 Melhore sua margem</Text>
                <Text style={styles.insightText}>
                  Sua margem de lucro está baixa. Revise seus preços ou negocie melhores condições com fornecedores.
                </Text>
              </View>
            )}

            {data.resumo_financeiro.ticket_medio < 50 && (
              <View style={styles.insightCard}>
                <Text style={styles.insightTitle}>🛒 Aumente o ticket médio</Text>
                <Text style={styles.insightText}>
                  Ofereça produtos complementares ou kits para aumentar o valor médio das vendas.
                </Text>
              </View>
            )}

            {data.top_produtos.length > 0 && (
              <View style={styles.insightCard}>
                <Text style={styles.insightTitle}>🏆 Foque no que vende</Text>
                <Text style={styles.insightText}>
                  Seu produto mais vendido é "{data.top_produtos[0]?.produto_nome}". Considere manter bom estoque dele.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
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
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
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
    marginBottom: 30,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  metricCard: {
    width: '48%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  primaryCard: {
    backgroundColor: '#2196F3',
  },
  successCard: {
    backgroundColor: '#4CAF50',
  },
  infoCard: {
    backgroundColor: '#FF9800',
  },
  warningCard: {
    backgroundColor: '#9C27B0',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  metricLabel: {
    fontSize: 12,
    color: 'white',
    opacity: 0.9,
    textAlign: 'center',
  },
  margemCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  margemLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  margemValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  margemAlert: {
    fontSize: 12,
    color: '#FF6B00',
    marginTop: 8,
    textAlign: 'center',
  },
  emptySection: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  emptySectionText: {
    color: '#999',
    fontSize: 16,
  },
  topProdutosContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    elevation: 2,
  },
  topProdutoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rankingNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  rankingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  produtoInfo: {
    flex: 1,
  },
  produtoNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  produtoDetalhes: {
    fontSize: 12,
    color: '#666',
  },
  produtoMedal: {
    marginLeft: 10,
  },
  medalIcon: {
    fontSize: 20,
  },
  vendasDiariasContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    elevation: 2,
  },
  vendaDiariaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  vendaData: {
    width: 50,
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  vendaBarContainer: {
    flex: 1,
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginHorizontal: 15,
    overflow: 'hidden',
  },
  vendaBar: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 10,
  },
  vendaValores: {
    alignItems: 'flex-end',
    width: 80,
  },
  vendaTotal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  vendaQuantidade: {
    fontSize: 10,
    color: '#666',
  },
  insightsContainer: {
    gap: 15,
  },
  insightCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});