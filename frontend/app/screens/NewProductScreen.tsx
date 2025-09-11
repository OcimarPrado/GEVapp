import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { addProduto } from "../api";

export default function NewProductScreen({ navigation, route }: any) {
  const [nome, setNome] = useState("");
  const [precoCusto, setPrecoCusto] = useState("");
  const [precoVenda, setPrecoVenda] = useState("");
  const [estoqueAtual, setEstoqueAtual] = useState("0");
  const [imagem, setImagem] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const escolherImagem = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão necessária", "Permita o acesso à galeria.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled) setImagem(result.assets[0]);
  };

  const salvarProduto = async () => {
    if (!nome.trim() || !precoCusto.trim() || !precoVenda.trim()) {
      Alert.alert("Atenção", "Preencha todos os campos obrigatórios!");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("nome", nome.trim());
      formData.append("preco_custo", precoCusto.trim());
      formData.append("preco_venda", precoVenda.trim());
      formData.append("estoque_atual", estoqueAtual);

      if (imagem?.uri) {
        const localUri = Platform.OS === "android" ? imagem.uri : imagem.uri.replace("file://", "");
        const filename = imagem.uri.split("/").pop() || `photo_${Date.now()}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const mimeType = match ? `image/${match[1]}` : "image/jpeg";

        formData.append("imagem", {
          uri: localUri,
          name: filename,
          type: mimeType,
        } as any);
      }

      const res = await addProduto(formData);
      if (res?.data?.success) {
        Alert.alert("Sucesso", "Produto cadastrado com sucesso!");
        if (route.params?.onSave) route.params.onSave(); // Atualiza lista
        navigation.goBack();
      } else {
        Alert.alert("Erro", res?.data?.message || "Erro ao cadastrar produto");
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert("Erro", "Não foi possível cadastrar o produto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Novo Produto</Text>

      <TextInput placeholder="Nome do produto" value={nome} onChangeText={setNome} style={styles.input} editable={!isSubmitting} />
      <TextInput placeholder="Preço de custo" value={precoCusto} onChangeText={setPrecoCusto} style={styles.input} keyboardType="decimal-pad" editable={!isSubmitting} />
      <TextInput placeholder="Preço de venda" value={precoVenda} onChangeText={setPrecoVenda} style={styles.input} keyboardType="decimal-pad" editable={!isSubmitting} />
      <TextInput placeholder="Estoque atual" value={estoqueAtual} onChangeText={setEstoqueAtual} style={styles.input} keyboardType="number-pad" editable={!isSubmitting} />

      <TouchableOpacity style={styles.imageButton} onPress={escolherImagem} disabled={isSubmitting}>
        <Text style={styles.imageButtonText}>{imagem ? "Alterar Imagem" : "Escolher Imagem"}</Text>
      </TouchableOpacity>

      {imagem && <Image source={{ uri: imagem.uri }} style={styles.previewImage} />}

      <TouchableOpacity style={[styles.saveButton, isSubmitting && { opacity: 0.7 }]} onPress={salvarProduto} disabled={isSubmitting}>
        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Salvar Produto</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} disabled={isSubmitting}>
        <Text style={styles.backButtonText}>⬅ Voltar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: "#f5f5f5", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold", color: "#2196F3", marginBottom: 20 },
  input: { width: "100%", borderBottomWidth: 1, borderBottomColor: "#ccc", paddingVertical: 10, paddingHorizontal: 6, marginBottom: 15, fontSize: 16 },
  imageButton: { backgroundColor: "#2196F3", borderRadius: 8, padding: 12, marginBottom: 15, width: "100%", alignItems: "center" },
  imageButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  previewImage: { width: 200, height: 200, borderRadius: 12, marginBottom: 20 },
  saveButton: { backgroundColor: "#4CAF50", borderRadius: 8, padding: 15, marginBottom: 15, width: "100%", alignItems: "center" },
  saveButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  backButton: { backgroundColor: "#ddd", borderRadius: 8, padding: 12, width: "100%", alignItems: "center" },
  backButtonText: { color: "#333", fontSize: 16, fontWeight: "500" },
});
