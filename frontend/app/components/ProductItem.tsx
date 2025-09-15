import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

type ProductItemProps = {
  produto: {
    nome: string;
    preco_venda: number;
    estoque: number;
  };
  onPress?: () => void;
};

export default function ProductItem({ produto, onPress }: ProductItemProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View>
        <Text style={styles.name}>{produto.nome}</Text>
        <Text style={styles.details}>Preço: R$ {produto.preco_venda.toFixed(2)}</Text>
        <Text style={styles.details}>Estoque: {produto.estoque}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    marginVertical: 6,
    borderRadius: 10,
    backgroundColor: "#fff",
    elevation: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
  },
  details: {
    fontSize: 14,
    color: "#555",
  },
});
