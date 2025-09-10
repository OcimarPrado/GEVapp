import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function SplashScreen({ navigation }: any) {
  useEffect(() => {
  const timer = setTimeout(() => {
    navigation.replace('Login');
  }, 2500);
  return () => clearTimeout(timer);
}, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GEV App</Text>
      <ActivityIndicator size="large" color="#2196F3" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#2196F3', marginBottom: 20 },
});
