import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
} from 'react-native';

interface Produto {
  id: number;
  nome: string;
  preco_venda: number;
  estoque_atual: number;
}

interface ItemVenda {
  produto_id: number;
  produto_nome: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

export default function NewSaleScreen({ navigation }: any) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [itensVenda, setItensVenda] = useState<ItemVenda[]>([]);
  const [clienteNome, setClienteNome] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('dinheiro');
  const [parcelas, setParcelas] = useState('1');
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProdutos, setLoadingProdutos] = useState(true);
  const [modalProdutoVisible, setModalProdutoVisible] = useState(false);
  const [searchProduto, setSearchProduto] = useState('');

  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/produtos');
      const result = await response.json();
      
      if (result.success) {
        setProdutos(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoadingProdutos(false);
    }
  };

  const produtosFiltrados = produtos.filter(produto =>
    produto.nome.toLowerCase().includes(searchProduto.toLowerCase()) &&
    produto.estoque_atual > 0
  );

  const adicionarProduto = (produto: Produto) => {
    const itemExistente = itensVenda.find(item => item.produto_id === produto.id);
    
    if (itemExistente) {
      if (itemExistente.quantidade < produto.estoque_atual) {
        const novosItens = itensVenda.map(item =>
          item.produto_id === produto.id
            ? {
                ...item,
                quantidade: item.quantidade + 1,
                subtotal: (item.quantidade + 1) * item.preco_unitario
              }
            : item
        );
        setItensVenda(novosItens);
      } else {
        Alert.alert('Atenção', 'Quantidade maior que o estoque disponível!');
      }
    } else {
      const novoItem: ItemVenda = {
        produto_id: produto.id,
        produto_nome: produto.nome,
        quantidade: 1,
        preco_unitario: produto.preco_venda,
        subtotal: produto.preco_venda
      };
      setItensVenda([...itensVenda, novoItem]);
    }
    
    setModalProdutoVisible(false);
    setSearchProduto('');
  };

  const alterarQuantidade = (produtoId: number, novaQuantidade: number) => {
    const produto = produtos.find(p => p.id === produtoId);
    
    if (novaQuantidade <= 0) {
      removerItem(produtoId);
      return;
    }
    
    if (produto && novaQuantidade > produto.estoque_atual) {
      Alert.alert('Atenção', 'Quantidade maior que o estoque disponível!');
      return;
    }

    const novosItens = itensVenda.map(item =>
      item.produto_id === produtoId
        ? {
            ...item,
            quantidade: novaQuantidade,
            subtotal: novaQuantidade * item.preco_unitario
          }
        : item
    );
    setItensVenda(novosItens);
  };

  const removerItem = (produtoId: number) => {
    setItensVenda(itensVenda.filter(item => item.produto_id !== produtoId));
  };

  const calcularTotal = () => {
    return itensVenda.reduce((total, item) => total + item.subtotal, 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const finalizarVenda = async () => {
    if (itensVenda.length === 0) {
      Alert.alert('Atenção', 'Adicione pelo menos um produto à venda!');
      return;
    }

    setLoading(true);

    try {
      const vendaData = {
        itens: itensVenda.map(item => ({
          produto_id: item.produto_id,
          quantidade: item.quantidade
        })),
        cliente_nome: clienteNome || 'Cliente Avulso',
        forma_pagamento: formaPagamento,
        parcelas: parseInt(parcelas),
        observacoes: observacoes
      };

      const response = await fetch('http://localhost:3000/api/vendas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vendaData)
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert(
          'Sucesso!',
          `Venda realizada com sucesso!\nTotal: ${formatCurrency(result.data.total)}\nLucro: ${formatCurrency(result.data.lucro)}`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Limpar formulário
                setItensVenda([]);
                setClienteNome('');
                setObservacoes('');
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }

    } catch (error: any) {
      console.error('Erro ao finalizar venda:', error);
      Alert.alert('Erro', error.message || 'Não foi possível finalizar a venda');
    } finally {
      setLoading(false);
    }
  };

  const renderItemVenda = ({ item }: { item: ItemVenda }) => (
    <View style={styles.itemVenda}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemNome}>{item.produto_nome}</Text>
        <Text style={styles.itemPreco}>
          {formatCurrency(item.preco_unitario)} cada
        </Text>
      </View>
      
      <View style={styles.quantidadeContainer}>
        <TouchableOpacity 
          style={styles.quantidadeButton}
          onPress={() => alterarQuantidade(item.produto_id, item.quantidade - 1)}
        >
          <Text style={styles.quantidadeButtonText}>-</Text>
        </TouchableOpacity>
        
        <Text style={styles.quantidadeText}>{item.quantidade}</Text>
        
        <TouchableOpacity 
          style={styles.quantidadeButton}
          onPress={() => alterarQuantidade(item.produto_id, item.quantidade + 1)}
        >
          <Text style={styles.quantidadeButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.subtotalContainer}>
        <Text style={styles.subtotal}>
          {formatCurrency(item.subtotal)}
        </Text>
        <TouchableOpacity onPress={() => removerItem(item.produto_id)}>
          <Text style={styles.removerText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProdutoModal = ({ item }: { item: Produto }) => (
    <TouchableOpacity
      style={styles.produtoModalItem}
      onPress={() => adicionarProduto(item)}
    >
      <Text style={styles.produtoModalNome}>{item.nome}</Text>
      <Text style={styles.produtoModalPreco}>
        {formatCurrency(item.preco_venda)} - Estoque: {item.estoque_atual}
      </Text>
    </TouchableOpacity>
  );

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
        <Text style={styles.title}>Nova Venda</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <TextInput
            style={styles.input}
            placeholder="Nome do cliente (opcional)"
            value={clienteNome}
            onChangeText={setClienteNome}
            placeholderTextColor="#999"
          />
        </View>

        {/* Produtos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Produtos</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setModalProdutoVisible(true)}
            >
              <Text style={styles.addButtonText}>+ Adicionar</Text>
            </TouchableOpacity>
          </View>

          {itensVenda.length === 0 ? (
            <View style={styles.emptyProducts}>
              <Text style={styles.emptyProductsText}>
                Nenhum produto adicionado
              </Text>
            </View>
          ) : (
            <FlatList
              data={itensVenda}
              keyExtractor={item => item.produto_id.toString()}
              renderItem={renderItemVenda}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Pagamento */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Forma de Pagamento</Text>
          <View style={styles.paymentOptions}>
            {['dinheiro', 'cartao', 'pix'].map((forma) => (
              <TouchableOpacity
                key={forma}
                style={[
                  styles.paymentOption,
                  formaPagamento === forma && styles.paymentOptionSelected
                ]}
                onPress={() => setFormaPagamento(forma)}
              >
                <Text style={[
                  styles.paymentOptionText,
                  formaPagamento === forma && styles.paymentOptionTextSelected
                ]}>
                  {forma.charAt(0).toUpperCase() + forma.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Observações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Observações</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Observações adicionais..."
            value={observacoes}
            onChangeText={setObservacoes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholderTextColor="#999"
          />
        </View>
      </ScrollView>

      {/* Total e Finalizar */}
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>
            {formatCurrency(calcularTotal())}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.finalizarButton, loading && styles.finalizarButtonDisabled]}
          onPress={finalizarVenda}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.finalizarButtonText}>Finalizar Venda</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal de Produtos */}
      <Modal
        visible={modalProdutoVisible}
        animationType="slide"
        onRequestClose={() => setModalProdutoVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecionar Produto</Text>
            <TouchableOpacity 
              onPress={() => setModalProdutoVisible(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={styles.modalSearch}
            placeholder="Buscar produto..."
            value={searchProduto}
            onChangeText={setSearchProduto}
            placeholderTextColor="#999"
          />

          {loadingProdutos ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator size="large" color="#2196F3" />
            </View>
          ) : (
            <FlatList
              data={produtosFiltrados}
              keyExtractor={item => item.id.toString()}
              renderItem={renderProdutoModal}
              style={styles.modalList}
            />
          )}
        </View>
      </Modal>
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
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  addButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyProducts: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  emptyProductsText: {
    color: '#999',
    fontSize: 16,
  },
  itemVenda: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemPreco: {
    fontSize: 14,
    color: '#666',
  },
  quantidadeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15,
  },
  quantidadeButton: {
    backgroundColor: '#2196F3',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantidadeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantidadeText: {
    marginHorizontal: 15,
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 30,
    textAlign: 'center',
  },
  subtotalContainer: {
    alignItems: 'flex-end',
  },
  subtotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 5,
  },
  removerText: {
    fontSize: 16,
  },
  paymentOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentOption: {
    flex: 1,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  paymentOptionSelected: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  paymentOptionText: {
    fontSize: 14,
    color: '#666',
  },
  paymentOptionTextSelected: {
    color: '#2196F3',
    fontWeight: '600',
  },
  footer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  totalLabel: {
    fontSize: 18,
    color: '#333',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  finalizarButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  finalizarButtonDisabled: {
    backgroundColor: '#ccc',
  },
  finalizarButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    backgroundColor: '#2196F3',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  modalCloseText: {
    fontSize: 24,
    color: 'white',
  },
  modalSearch: {
    backgroundColor: 'white',
    margin: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  modalList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  produtoModalItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  produtoModalNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  produtoModalPreco: {
    fontSize: 14,
    color: '#666',
  },
});