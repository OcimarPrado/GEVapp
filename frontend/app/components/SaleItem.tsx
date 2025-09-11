import React from "react";
import { View, Text, StyleSheet } from "react-native";

type Sale = {
  productName: string;
  quantity: number;
  total: number;
  date: string;
};

type SaleItemProps = {
  sale: Sale;
}

export default function SaleItem({ sale }: SaleItemProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{sale.productName}</Text>
      <Text style={styles.details}>Qtd: {sale.quantity}</Text>
      <Text style={styles.details}>Total: R$ {sale.total.toFixed(2)}</Text>
      <Text style={styles.date}>{sale.date}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    marginVertical: 6,
    borderRadius: 10,
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  name: {
    fontSize: 15,
    fontWeight: "bold",
  },
  details: {
    fontSize: 13,
    color: "#444",
  },
  date: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
  },
});
