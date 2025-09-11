import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet,
  Alert,
  ScrollView
} from "react-native";
import { getDashboard } from "../api";

export default function DashboardScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [dados, setDados] = useState<any>(null);

  useEffect(() => {
    carregarDashboard();
  }, []);

  const carregarDashboard = async () => {
    try {
      const response = await getDashboard();
      setDados(response.data.data);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar o dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Carregando dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gestão de Estoque e Vendas!</Text>
        <Text style={styles.subtitle}>Tecnologia que Automatiza Resultados</Text>
      </View>
      
      {/* Cards de estatísticas */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.salesCard]}>
          <Text style={styles.statValue}>
            R$ {dados?.vendas_mes?.toFixed(2) || '0,00'}
          </Text>
          <Text style={styles.statLabel}>Vendas do Mês</Text>
        </View>
        
        <View style={[styles.statCard, styles.productsCard]}>
          <Text style={styles.statValue}>{dados?.total_produtos || 0}</Text>
          <Text style={styles.statLabel}>Produtos</Text>
        </View>
        
        <View style={[styles.statCard, styles.profitCard]}>
          <Text style={styles.statValue}>
            R$ {dados?.lucro_mes?.toFixed(2) || '0,00'}
          </Text>
          <Text style={styles.statLabel}>Lucro Líquido</Text>
        </View>
        
        <View style={[styles.statCard, styles.pendingCard]}>
          <Text style={styles.statValue}>{dados?.vendas_pendentes || 0}</Text>
          <Text style={styles.statLabel}>Pendências</Text>
        </View>
      </View>

      {/* Botões de navegação */}
      <TouchableOpacity 
        style={styles.mainButton} 
        onPress={() => navigation.navigate('NewSale')}
      >
        <Text style={styles.mainButtonText}>🚀 NOVA VENDA</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.secondaryButton} 
        onPress={() => navigation.navigate('Products')}
      >
        <Text style={styles.secondaryButtonText}>📦 GERENCIAR PRODUTOS</Text>
      </TouchableOpacity>

      
      <TouchableOpacity 
        style={styles.secondaryButton} 
        onPress={() => navigation.navigate('SalesHistory')}
      >
        <Text style={styles.secondaryButtonText}>📋 HISTÓRICO DE VENDAS</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.secondaryButton} 
        onPress={() => navigation.navigate('Reports')}
      >
        <Text style={styles.secondaryButtonText}>📊 VER RELATÓRIOS</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>✨ Deixe a tecnologia trabalhar por você</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  salesCard: { borderLeftWidth: 4, borderLeftColor: '#2196F3' },
  productsCard: { borderLeftWidth: 4, borderLeftColor: '#FF9800' },
  profitCard: { borderLeftWidth: 4, borderLeftColor: '#4CAF50' },
  pendingCard: { borderLeftWidth: 4, borderLeftColor: '#F44336' },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  mainButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  mainButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#2196F3',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
  },
  secondaryButtonText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
  },
});
