import { useEffect, useState } from "react";
import { View, FlatList, ActivityIndicator, Alert } from "react-native";
import { getVendas } from "../api";
import SaleItem from "../components/SaleItem";

export default function SalesHistoryScreen() {
  const [vendas, setVendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVendas()
      .then((res) => setVendas(res.data.data))
      .catch(() => Alert.alert("Erro", "Não foi possível carregar as vendas"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={vendas}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <SaleItem sale={item} />}
      />
    </View>
  );
}
