import React from "react";
import { View, Text, StyleSheet } from "react-native";

type SaleItemProps = {
  productName: string;
  quantity: number;
  total: number;
  date: string;
};

export default function SaleItem({ productName, quantity, total, date }: SaleItemProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{productName}</Text>
      <Text style={styles.details}>Qtd: {quantity}</Text>
      <Text style={styles.details}>Total: R$ {total.toFixed(2)}</Text>
      <Text style={styles.date}>{date}</Text>
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
