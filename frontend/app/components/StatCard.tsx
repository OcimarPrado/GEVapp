import React from "react";
import { View, Text, StyleSheet } from "react-native";

type StatCardProps = {
  title: string;
  value: string | number;
  color?: string;
};

export default function StatCard({ title, value, color = "#4CAF50" }: StatCardProps) {
  return (
    <View style={[styles.container, { borderLeftColor: color }]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 10,
    backgroundColor: "#fff",
    elevation: 3,
    borderLeftWidth: 5,
  },
  title: {
    fontSize: 14,
    color: "#666",
  },
  value: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 4,
  },
});
