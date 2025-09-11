import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { getProdutos } from "../api"; // GET produtos

export default function ProductsScreen({ navigation }: any) {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      carregarProdutos();
    }
  }, [isFocused]);

  const carregarProdutos = async () => {
    setLoading(true);
    try {
      const res = await getProdutos();
      if (res?.data?.success) {
        setProdutos(res.data.produtos);
      } else {
        Alert.alert("Erro", "Não foi possível carregar os produtos.");
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert("Erro", "Falha ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const filtrarProdutos = () => {
    if (!search.trim()) return produtos;
    return produtos.filter((p) =>
      p.nome.toLowerCase().includes(search.toLowerCase())
    );
  };

  const renderProduto = ({ item }: any) => (
    <View style={styles.productItem}>
      <View style={styles.productImage}>
        {item.imagem ? (
          <Image source={{ uri: item.imagem }} style={{ width: 40, height: 40, borderRadius: 8 }} />
        ) : (
          <Text style={{ fontSize: 20 }}>📦</Text>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.nome}</Text>
        <Text style={styles.productPrice}>R$ {item.preco_venda}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.screenHeader}>
        <Text style={styles.headerTitle}>Estoque Inteligente</Text>
        <Text style={styles.headerSubtitle}>
          {produtos.length} produto{produtos.length !== 1 ? "s" : ""} cadastrados
        </Text>
      </View>

      <TextInput
        style={styles.searchBar}
        placeholder="🔍 Buscar produtos..."
        value={search}
        onChangeText={setSearch}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#2196F3" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filtrarProdutos()}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderProduto}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      <TouchableOpacity
        style={styles.floatingAdd}
        onPress={() =>
          navigation.navigate("NewProduct", {
            onSave: carregarProdutos, // função para atualizar lista
          })
        }
      >
        <Text style={{ fontSize: 28, color: "#fff" }}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 20 },
  screenHeader: {
    marginBottom: 20,
    backgroundColor: "#2196F3",
    padding: 20,
    borderRadius: 12,
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  headerSubtitle: { color: "#fff", fontSize: 14, opacity: 0.9, marginTop: 5 },
  searchBar: {
    backgroundColor: "#fff",
    borderRadius: 25,
    padding: 12,
    marginBottom: 20,
    fontSize: 14,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  productItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  productInfo: { flex: 1 },
  productName: { fontWeight: "600", color: "#333", marginBottom: 3 },
  productPrice: { fontWeight: "bold", color: "#4CAF50" },
  floatingAdd: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FF9800",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF9800",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 5,
  },
});
