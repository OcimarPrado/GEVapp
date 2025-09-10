import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { getVendas, getProdutos } from "../api";

export default function ReportsScreen() {
  const [loading, setLoading] = useState(true);
  const [resumo, setResumo] = useState<any>(null);

  useEffect(() => {
    Promise.all([getVendas(), getProdutos()])
      .then(([vendasRes, produtosRes]) => {
        const vendas = vendasRes.data.data;
        const produtos = produtosRes.data.data;

        const totalVendas = vendas.reduce((acc: number, v: any) => acc + v.total, 0);
        const totalProdutos = produtos.length;

        setResumo({ totalVendas, totalProdutos });
      })
      .catch(() => Alert.alert("Erro", "Não foi possível gerar os relatórios"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.card}>💰 Total em Vendas: R$ {resumo?.totalVendas}</Text>
      <Text style={styles.card}>📦 Produtos cadastrados: {resumo?.totalProdutos}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  card: { fontSize: 18, marginBottom: 15, fontWeight: "bold" },
});
