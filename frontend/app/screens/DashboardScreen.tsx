import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

interface DashboardData {
  vendas_mes: number;
  total_produtos: number;
  lucro_mes: number;
  vendas_pendentes: number;
  historico: { dia: string; total_vendido: number; lucro: number }[];
}

const screenWidth = Dimensions.get('window').width - 40;

export default function DashboardScreen({ navigation }: any) {
  const [data, setData] = useState<DashboardData>({
    vendas_mes: 0,
    total_produtos: 0,
    lucro_mes: 0,
    vendas_pendentes: 0,
    historico: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      const response = await fetch('http://localhost:3000/api/dashboard');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();

      setData({
        vendas_mes: Number(result.cards.vendasMes) || 0,
        total_produtos: Number(result.cards.produtos) || 0,
        lucro_mes: Number(result.cards.lucroMes) || 0,
        vendas_pendentes: Number(result.cards.pendentes) || 0,
        historico: result.historico?.map(h => ({
          dia: h.dia,
          total_vendido: Number(h.total_vendido) || 0,
          lucro: Number(h.lucro) || 0,
        })) || [],
      });
    } catch (error: any) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível carregar o dashboard\n' + error.message);
      setData({
        vendas_mes: 0,
        total_produtos: 0,
        lucro_mes: 0,
        vendas_pendentes: 0,
        historico: [],
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData(false);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Carregando dashboard...</Text>
      </View>
    );
  }

  // Gráfico
  const chartLabels = data.historico.map(h => h.dia);
  const chartVendas = data.historico.map(h => h.total_vendido);
  const chartLucro = data.historico.map(h => h.lucro);

  // Média
  const avgVendas = chartVendas.reduce((a, b) => a + b, 0) / chartVendas.length || 0;
  const avgLucro = chartLucro.reduce((a, b) => a + b, 0) / chartLucro.length || 0;

  const chartData = {
    labels: chartLabels,
    datasets: [
      { data: chartVendas, color: () => '#2196F3', strokeWidth: 2, label: 'Vendas' },
      { data: chartLucro, color: () => '#4CAF50', strokeWidth: 2, label: 'Lucro' },
      { data: chartVendas.map(() => avgVendas), color: () => '#2196F3AA', strokeWidth: 1, withDots: false },
      { data: chartLucro.map(() => avgLucro), color: () => '#4CAF50AA', strokeWidth: 1, withDots: false },
    ],
    legend: ['Vendas', 'Lucro', 'Média Vendas', 'Média Lucro'],
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>GEV App</Text>
        <Text style={styles.subtitle}>Gestão Empresarial de Vendas</Text>
      </View>

      {/* Cards */}
      <View style={styles.cardsContainer}>
        <View style={styles.row}>
          <View style={[styles.card, styles.cardPrimary]}>
            <Text style={styles.cardValue}>{formatCurrency(data.vendas_mes)}</Text>
            <Text style={styles.cardLabel}>Vendas do Mês</Text>
          </View>
          <View style={[styles.card, styles.cardSuccess]}>
            <Text style={styles.cardValue}>{formatCurrency(data.lucro_mes)}</Text>
            <Text style={styles.cardLabel}>Lucro do Mês</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={[styles.card, styles.cardInfo]}>
            <Text style={styles.cardValue}>{data.total_produtos}</Text>
            <Text style={styles.cardLabel}>Produtos Cadastrados</Text>
          </View>
          <View style={[styles.card, styles.cardWarning]}>
            <Text style={styles.cardValue}>{data.vendas_pendentes}</Text>
            <Text style={styles.cardLabel}>Vendas Pendentes</Text>
          </View>
        </View>
      </View>

      {/* Gráfico */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Histórico de Vendas x Lucro</Text>
        <LineChart
          data={chartData}
          width={screenWidth}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#f5f5f5',
            backgroundGradientTo: '#f5f5f5',
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
            labelColor: () => '#333',
            propsForDots: { r: '4', strokeWidth: '2', stroke: '#2196F3' },
          }}
          style={styles.chartStyle}
        />
      </View>

      {/* Menu */}
      <View style={styles.menuContainer}>
        <Text style={styles.menuTitle}>Menu Principal</Text>
        <View style={styles.menuGrid}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Products')}>
            <Text style={styles.menuIcon}>📦</Text>
            <Text style={styles.menuText}>Produtos</Text>
            <Text style={styles.menuSubtext}>Gerenciar estoque</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('NewSale')}>
            <Text style={styles.menuIcon}>💰</Text>
            <Text style={styles.menuText}>Nova Venda</Text>
            <Text style={styles.menuSubtext}>Registrar venda</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('SalesHistory')}>
            <Text style={styles.menuIcon}>📊</Text>
            <Text style={styles.menuText}>Histórico</Text>
            <Text style={styles.menuSubtext}>Ver vendas</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Reports')}>
            <Text style={styles.menuIcon}>📈</Text>
            <Text style={styles.menuText}>Relatórios</Text>
            <Text style={styles.menuSubtext}>Análises</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Botão Atualizar */}
      <View style={styles.footerRefresh}>
        <TouchableOpacity style={styles.refreshButton} onPress={() => loadDashboardData()}>
          <Text style={styles.refreshButtonText}>🔄 Atualizar Informações</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  loadingText: { marginTop: 10, color: '#666', fontSize: 16 },
  header: { backgroundColor: '#2196F3', paddingTop: 50, paddingBottom: 30, paddingHorizontal: 20, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 5 },
  subtitle: { fontSize: 16, color: 'white', opacity: 0.9 },
  cardsContainer: { padding: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  card: { width: '48%', padding: 20, borderRadius: 12, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardPrimary: { backgroundColor: '#2196F3' },
  cardSuccess: { backgroundColor: '#4CAF50' },
  cardInfo: { backgroundColor: '#FF9800' },
  cardWarning: { backgroundColor: '#F44336' },
  cardValue: { fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 5 },
  cardLabel: { fontSize: 12, color: 'white', opacity: 0.9 },
  chartContainer: { marginHorizontal: 20, marginBottom: 20 },
  chartTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  chartStyle: { borderRadius: 12 },
  menuContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  menuTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  menuItem: { width: '48%', backgroundColor: 'white', padding: 20, borderRadius: 12, alignItems: 'center', marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  menuIcon: { fontSize: 32, marginBottom: 10 },
  menuText: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 5 },
  menuSubtext: { fontSize: 12, color: '#666' },
  footerRefresh: { alignItems: 'center', marginBottom: 30 },
  refreshButton: { backgroundColor: '#2196F3', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 25 },
  refreshButtonText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
});
