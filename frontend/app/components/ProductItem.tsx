import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

type ProductItemProps = {
  name: string;
  price: number;
  stock: number;
  onPress?: () => void;
};

export default function ProductItem({ name, price, stock, onPress }: ProductItemProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.details}>Preço: R$ {price.toFixed(2)}</Text>
        <Text style={styles.details}>Estoque: {stock}</Text>
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
