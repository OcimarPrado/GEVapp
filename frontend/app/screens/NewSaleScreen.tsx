import { useState, useEffect } from "react";
import { View, TextInput, Button, Alert, StyleSheet, Text, ActivityIndicator } from "react-native";
import { Picker } from '@react-native-picker/picker';
import { addVenda, getProdutos } from "../api";

export default function NewSaleScreen({ navigation }: any) {
  const [cliente, setCliente] = useState("");
  const [produtoId, setProdutoId] = useState<number | null>(null);
  const [total, setTotal] = useState("");
  const [loading, setLoading] = useState(false);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(true);

  useEffect(() => {
    // Busca os produtos do backend
    const fetchProdutos = async () => {
      try {
        const res = await getProdutos();
        setProdutos(res.data.data || []);
        if (res.data.data.length > 0) setProdutoId(res.data.data[0].id);
      } catch (err) {
        console.error("Erro ao buscar produtos:", err);
        Alert.alert("Erro", "Não foi possível carregar os produtos do backend.");
      } finally {
        setLoadingProdutos(false);
      }
    };
    fetchProdutos();
  }, []);

  const salvarVenda = async () => {
    if (!cliente.trim() || !total.trim() || produtoId === null) {
      Alert.alert("Atenção", "Preencha todos os campos!");
      return;
    }

    const valor = parseFloat(total.replace(",", "."));
    if (isNaN(valor) || valor <= 0) {
      Alert.alert("Erro", "Digite um valor válido para a venda.");
      return;
    }

    try {
      setLoading(true);

      const vendaData = {
        cliente_nome: cliente,
        itens: [
          { produto_id: produtoId, quantidade: 1 } // mínimo de 1 item
        ],
        forma_pagamento: "dinheiro",
        parcelas: 1,
      };

      console.log("Enviando venda:", vendaData);
      const res = await addVenda(vendaData);
      console.log("Resposta do servidor:", res.data);

      Alert.alert("Sucesso", "Venda registrada com sucesso!");
      navigation.navigate("Dashboard");
    } catch (err: any) {
      console.error("Erro ao registrar venda:", err.response?.data || err.message);
      Alert.alert(
        "Erro",
        err.response?.data?.error ||
        "Não foi possível registrar a venda.\nVerifique a conexão com o backend e se o IP está correto."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingProdutos) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text>Carregando produtos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Nome do Cliente"
        value={cliente}
        onChangeText={setCliente}
        style={styles.input}
      />

      <Text style={{ marginBottom: 5 }}>Produto:</Text>
      <Picker
        selectedValue={produtoId}
        style={{ marginBottom: 15 }}
        onValueChange={(itemValue) => setProdutoId(Number(itemValue))}
      >
        {produtos.map((p) => (
          <Picker.Item
            key={p.id}
            label={`${p.nome} (Estoque: ${p.estoque_atual || 0})`}
            value={p.id}
          />
        ))}
      </Picker>

      <TextInput
        placeholder="Valor total da venda"
        value={total}
        onChangeText={setTotal}
        keyboardType="numeric"
        style={styles.input}
      />

      <View style={{ marginBottom: 10 }}>
        <Button
          title={loading ? "Registrando..." : "Registrar Venda"}
          onPress={salvarVenda}
          disabled={loading}
        />
      </View>

      <Button
        title="⬅ Voltar para Tela Inicial"
        onPress={() => navigation.navigate("Dashboard")}
        color="#888"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    justifyContent: "center",
  },
  input: {
    marginBottom: 15,
    borderBottomWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
});
