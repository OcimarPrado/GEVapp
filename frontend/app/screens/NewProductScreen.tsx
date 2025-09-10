import { useState } from "react";
import { View, TextInput, Button, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { addProduto } from "../api";

export default function NewProductScreen({ navigation }: any) {
  const [nome, setNome] = useState("");
  const [precoCusto, setPrecoCusto] = useState("");
  const [precoVenda, setPrecoVenda] = useState("");
  const [imagem, setImagem] = useState<any>(null);

  const escolherImagem = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.canceled) setImagem(result.assets[0]);
  };

  const salvarProduto = async () => {
    if (!nome || !precoCusto || !precoVenda) {
      Alert.alert("Atenção", "Preencha todos os campos obrigatórios!");
      return;
    }

    const formData = new FormData();
    formData.append("nome", nome);
    formData.append("preco_custo", precoCusto);
    formData.append("preco_venda", precoVenda);
    if (imagem) {
      formData.append("imagem", {
        uri: imagem.uri,
        type: "image/jpeg",
        name: "produto.jpg",
      } as any);
    }

    try {
      await addProduto(formData);
      Alert.alert("Sucesso", "Produto cadastrado com sucesso!");
      navigation.goBack();
    } catch {
      Alert.alert("Erro", "Não foi possível cadastrar o produto");
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput placeholder="Nome do produto" value={nome} onChangeText={setNome} style={{ marginBottom: 10, borderBottomWidth: 1 }} />
      <TextInput placeholder="Preço de custo" value={precoCusto} onChangeText={setPrecoCusto} keyboardType="numeric" style={{ marginBottom: 10, borderBottomWidth: 1 }} />
      <TextInput placeholder="Preço de venda" value={precoVenda} onChangeText={setPrecoVenda} keyboardType="numeric" style={{ marginBottom: 10, borderBottomWidth: 1 }} />
      <Button title="Escolher Imagem" onPress={escolherImagem} />
      <Button title="Salvar Produto" onPress={salvarProduto} />
    </View>
  );
}
