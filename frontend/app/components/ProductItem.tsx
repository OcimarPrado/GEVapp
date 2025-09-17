// components/ProductItem.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';

interface ProductItemProps {
  produto: {
    id: number;
    nome: string;
    preco_custo: number;
    preco_venda: number;
    margem_lucro: number;
    estoque_atual: number;
    imagem?: string;
    observacoes?: string;
  };
  onPress: () => void;
}

export default function ProductItem({ produto, onPress }: ProductItemProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getEstoqueColor = (estoque: number) => {
    if (estoque === 0) return '#f44336'; // Vermelho
    if (estoque <= 10) return '#ff9800'; // Laranja
    return '#4caf50'; // Verde
  };

  const getEstoqueText = (estoque: number) => {
    if (estoque === 0) return 'Sem estoque';
    if (estoque <= 10) return 'Estoque baixo';
    return 'Em estoque';
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      {/* Imagem do produto */}
      <View style={styles.imageContainer}>
        {produto.imagem ? (
          <Image
            source={{ uri: produto.imagem.startsWith('http') ? produto.imagem : `http://localhost:3000${produto.imagem}` }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>📦</Text>
          </View>
        )}
      </View>

      {/* Informações do produto */}
      <View style={styles.infoContainer}>
        <Text style={styles.nome} numberOfLines={2}>
          {produto.nome}
        </Text>

        {/* Preços */}
        <View style={styles.pricesContainer}>
          <Text style={styles.precoCusto}>
            Custo: {formatCurrency(produto.preco_custo)}
          </Text>
          <Text style={styles.precoVenda}>
            Venda: {formatCurrency(produto.preco_venda)}
          </Text>
        </View>

        {/* Margem e Estoque */}
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

        {/* Status do estoque */}
        <Text style={[styles.statusEstoque, { color: getEstoqueColor(produto.estoque_atual) }]}>
          {getEstoqueText(produto.estoque_atual)}
        </Text>
      </View>

      {/* Indicador de edição */}
      <View style={styles.editIndicator}>
        <Text style={styles.editIcon}>✏️</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
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
  imageContainer: {
    marginRight: 15,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    fontSize: 24,
  },
  infoContainer: {
    flex: 1,
  },
  nome: {
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
    marginBottom: 4,
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
  statusEstoque: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'right',
  },
  editIndicator: {
    marginLeft: 10,
    opacity: 0.5,
  },
  editIcon: {
    fontSize: 16,
  },
});