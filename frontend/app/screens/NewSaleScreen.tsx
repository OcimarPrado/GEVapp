import { useState } from "react";
import { View, TextInput, Button, Alert } from "react-native";
import { addVenda } from "../api";

export default function NewSaleScreen({ navigation }: any) {
  const [cliente, setCliente] = useState("");
  const [total, setTotal] = useState("");

  const salvarVenda = async () => {
    if (!cliente || !total) {
      Alert.alert("Atenção", "Preencha todos os campos obrigatórios!");
      return;
    }

    try {
      await addVenda({ cliente_nome: cliente, total: parseFloat(total) });
      Alert.alert("Sucesso", "Venda registrada com sucesso!");
      navigation.goBack();
    } catch {
      Alert.alert("Erro", "Não foi possível registrar a venda");
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Nome do Cliente"
        value={cliente}
        onChangeText={setCliente}
        style={{ marginBottom: 10, borderBottomWidth: 1 }}
      />
      <TextInput
        placeholder="Valor total da venda"
        value={total}
        onChangeText={setTotal}
        keyboardType="numeric"
        style={{ marginBottom: 10, borderBottomWidth: 1 }}
      />
      <Button title="Registrar Venda" onPress={salvarVenda} />
    </View>
  );
}
