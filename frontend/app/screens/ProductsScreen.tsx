import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Modal,
} from 'react-native';
import { useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';

interface Produto {
  id: number;
  nome: string;
  preco_custo: number;
  preco_venda: number;
  margem_lucro: number;
  estoque_atual: number;
  imagem?: string;
  observacoes?: string;
}

type RootStackParamList = {
  Products: { reload?: boolean } | undefined;
};

type ProductsScreenRouteProp = RouteProp<RootStackParamList, 'Products'>;

const ProductItem = ({ 
  produto, 
  onPress, 
  onDelete, 
  onEdit 
}: { 
  produto: Produto; 
  onPress: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) => {
  const [showOptions, setShowOptions] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getEstoqueColor = (estoque: number) => {
    if (estoque === 0) return '#f44336';
    if (estoque <= 10) return '#ff9800';
    return '#4caf50';
  };

  const confirmarDelecao = () => {
    setShowOptions(false);
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir o produto "${produto.nome}"?\n\nEsta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: onDelete
        }
      ]
    );
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.productItem} 
        onPress={onPress} 
        onLongPress={() => setShowOptions(true)}
        activeOpacity={0.7}
      >
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {produto.nome}
          </Text>

          <View style={styles.pricesContainer}>
            <Text style={styles.precoCusto}>
              Custo: {formatCurrency(produto.preco_custo)}
            </Text>
            <Text style={styles.precoVenda}>
              Venda: {formatCurrency(produto.preco_venda)}
            </Text>
          </View>

          <View style={styles.bottomRow}>
            <View style={styles.margemContainer}>
              <Text style={styles.margemText}>
                {produto.margem_lucro.toFixed(1)}% lucro
              </Text>
            </View>

            <View style={[styles.estoqueContainer, { backgroundColor: getEstoqueColor(produto.estoque_atual) }]}>
              <Text style={styles.estoqueText}>
                {produto.estoque_atual} un.
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setShowOptions(true)}
        >
          <Text style={styles.menuIcon}>⋮</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Modal de opções */}
      <Modal
        visible={showOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptions(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptions(false)}
        >
          <View style={styles.optionsModal}>
            <Text style={styles.optionsTitle}>{produto.nome}</Text>
            
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => {
                setShowOptions(false);
                onEdit();
              }}
            >
              <Text style={styles.optionIcon}>✏️</Text>
              <Text style={styles.optionText}>Editar Produto</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.optionButton, styles.deleteOption]}
              onPress={confirmarDelecao}
            >
              <Text style={styles.optionIcon}>🗑️</Text>
              <Text style={[styles.optionText, styles.deleteText]}>Excluir Produto</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowOptions(false)}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export default function ProductsScreen({ navigation }: any) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const route = useRoute<ProductsScreenRouteProp>();

  const carregarProdutos = async (searchTerm?: string, showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const url = searchTerm 
        ? `http://localhost:3000/api/produtos?search=${encodeURIComponent(searchTerm)}`
        : 'http://localhost:3000/api/produtos';

      console.log('📦 Carregando produtos de:', url);

      const response = await fetch(url);
      const result = await response.json();

      console.log('📦 Resposta dos produtos:', result);

      if (result.success) {
        setProdutos(result.data);
        console.log(`✅ ${result.data.length} produtos carregados`);
      } else {
        throw new Error(result.error || 'Erro ao carregar produtos');
      }

    } catch (error: any) {
      console.error('❌ Erro ao carregar produtos:', error);
      Alert.alert(
        'Erro',
        'Não foi possível carregar os produtos. Verifique sua conexão e tente novamente.'
      );
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const deletarProduto = async (produtoId: number) => {
    try {
      console.log('🗑️ Tentando deletar produto ID:', produtoId);
      
      // Testar conectividade primeiro
      const statusResponse = await fetch('http://localhost:3000/api/status');
      if (!statusResponse.ok) {
        throw new Error('Backend não está respondendo');
      }
      
      const response = await fetch(`http://localhost:3000/api/produtos/${produtoId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('🗑️ Status da resposta:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('🗑️ Resposta da deleção:', result);

      if (result.success) {
        // Remover produto da lista local imediatamente
        setProdutos(prevProdutos => prevProdutos.filter(produto => produto.id !== produtoId));
        
        Alert.alert('Sucesso!', 'Produto excluído com sucesso!');
        console.log('✅ Produto removido da lista local');
      } else {
        throw new Error(result.error || 'Erro ao excluir produto');
      }

    } catch (error: any) {
      console.error('❌ Erro ao deletar produto:', error);
      Alert.alert(
        'Erro ao Excluir',
        `Não foi possível excluir o produto.\nErro: ${error.message}\n\nVerifique se o backend está rodando.`,
        [
          { text: 'Tentar Novamente', onPress: () => deletarProduto(produtoId) },
          { text: 'Cancelar' }
        ]
      );
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await carregarProdutos(search, false);
    setRefreshing(false);
  }, [search]);

  useFocusEffect(
    useCallback(() => {
      console.log('🔄 ProductsScreen em foco, carregando produtos...');
      carregarProdutos();
    }, [])
  );

  useEffect(() => {
    if (route.params?.reload) {
      console.log('🔄 Reload solicitado, recarregando produtos...');
      carregarProdutos();
      navigation.setParams({ reload: undefined });
    }
  }, [route.params?.reload]);

  const handleSearch = useCallback((text: string) => {
    setSearch(text);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      if (text.length > 2 || text.length === 0) {
        carregarProdutos(text);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, []);

  const handleProductPress = (produto: Produto) => {
    navigation.navigate('NewProduct', { produto });
  };

  const handleAddProduct = () => {
    navigation.navigate('NewProduct');
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📦</Text>
      <Text style={styles.emptyTitle}>
        {search ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {search 
          ? 'Tente buscar por outro termo' 
          : 'Comece cadastrando seu primeiro produto'
        }
      </Text>
      {!search && (
        <TouchableOpacity 
          style={styles.emptyButton}
          onPress={handleAddProduct}
        >
          <Text style={styles.emptyButtonText}>Cadastrar Produto</Text>
        </TouchableOpacity>
      )}
    </View>
  );

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
          <Text style={styles.title}>Estoque Inteligente</Text>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Carregando produtos...</Text>
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
        
        <Text style={styles.title}>Estoque Inteligente</Text>
        <Text style={styles.subtitle}>
          {produtos.length} produto{produtos.length !== 1 ? 's' : ''} cadastrado{produtos.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Busca */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Buscar produtos..."
          value={search}
          onChangeText={handleSearch}
          placeholderTextColor="#999"
          returnKeyType="search"
        />
      </View>

      {/* Instruções */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          💡 Toque para editar • Pressione e segure para mais opções
        </Text>
      </View>
      
      {/* Lista */}
      <FlatList
        data={produtos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ProductItem 
            produto={item} 
            onPress={() => handleProductPress(item)}
            onEdit={() => handleProductPress(item)}
            onDelete={() => deletarProduto(item.id)}
          />
        )}
        contentContainerStyle={[
          styles.listContainer,
          produtos.length === 0 && styles.listContainerEmpty
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2196F3']}
            tintColor="#2196F3"
          />
        }
        ListEmptyComponent={renderEmptyState}
      />

      {/* Botão flutuante para adicionar */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={handleAddProduct}
        activeOpacity={0.8}
      >
        <Text style={styles.floatingButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { 
    marginTop: 10, 
    color: '#666',
    fontSize: 16
  },
  header: { 
    backgroundColor: '#2196F3', 
    paddingTop: 50, 
    paddingBottom: 20, 
    paddingHorizontal: 20, 
    alignItems: 'center',
    position: 'relative'
  },
  backButton: { 
    position: 'absolute', 
    left: 20, 
    top: 55 
  },
  backButtonText: { 
    color: 'white', 
    fontSize: 16,
    fontWeight: '600'
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: 'white', 
    marginBottom: 5 
  },
  subtitle: { 
    fontSize: 14, 
    color: 'white', 
    opacity: 0.9 
  },
  searchContainer: { 
    padding: 20,
    paddingBottom: 10,
  },
  searchInput: { 
    backgroundColor: 'white', 
    borderRadius: 25, 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    fontSize: 16, 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.22, 
    shadowRadius: 2.22 
  },
  instructionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  instructionsText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  listContainer: { 
    paddingHorizontal: 20, 
    paddingBottom: 100 
  },
  listContainerEmpty: {
    flex: 1,
  },
  productItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  pricesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  precoCusto: {
    fontSize: 12,
    color: '#666',
  },
  precoVenda: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  margemContainer: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  margemText: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '600',
  },
  estoqueContainer: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  estoqueText: {
    fontSize: 11,
    color: 'white',
    fontWeight: '600',
  },
  menuButton: {
    padding: 10,
    marginLeft: 10,
  },
  menuIcon: {
    fontSize: 20,
    color: '#666',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  optionsModal: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    maxWidth: 300,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  deleteOption: {
    backgroundColor: '#ffebee',
  },
  optionIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  deleteText: {
    color: '#d32f2f',
  },
  cancelButton: {
    marginTop: 10,
    paddingVertical: 15,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
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
  emptyButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  floatingButton: { 
    position: 'absolute', 
    bottom: 30, 
    right: 30, 
    width: 60, 
    height: 60, 
    backgroundColor: '#FF9800', 
    borderRadius: 30, 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 5, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.25, 
    shadowRadius: 3.84 
  },
  floatingButtonText: { 
    color: 'white', 
    fontSize: 28, 
    fontWeight: 'bold' 
  },
});