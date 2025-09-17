import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';

type RootStackParamList = {
  NewProduct: { produto?: any } | undefined;
};

type NewProductScreenRouteProp = RouteProp<RootStackParamList, 'NewProduct'>;

export default function NewProductScreen({ navigation }: any) {
  const [nome, setNome] = useState('');
  const [precoCusto, setPrecoCusto] = useState('');
  const [precoVenda, setPrecoVenda] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [estoqueAtual, setEstoqueAtual] = useState('');
  const [imagem, setImagem] = useState<any>(null);
  const [imagemExistente, setImagemExistente] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [margemLucro, setMargemLucro] = useState('0.00');

  const route = useRoute<NewProductScreenRouteProp>();
  const produto = route.params?.produto;
  const isEditing = !!produto;

  // Limpar formulário quando sair da tela
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        // Cleanup ao sair da tela
        if (!isEditing) {
          limparFormulario();
        }
      };
    }, [isEditing])
  );

  const limparFormulario = () => {
    setNome('');
    setPrecoCusto('');
    setPrecoVenda('');
    setObservacoes('');
    setEstoqueAtual('');
    setImagem(null);
    setImagemExistente(null);
    setMargemLucro('0.00');
  };

  useEffect(() => {
    if (isEditing && produto) {
      setNome(produto.nome || '');
      setPrecoCusto(produto.preco_custo?.toString() || '');
      setPrecoVenda(produto.preco_venda?.toString() || '');
      setObservacoes(produto.observacoes || '');
      setEstoqueAtual(produto.estoque_atual?.toString() || '0');
      setImagemExistente(produto.imagem || null);
      setMargemLucro(produto.margem_lucro?.toFixed(2) || '0.00');
      setImagem(null); // Reset imagem nova
    }
  }, [isEditing, produto]);

  // Calcular margem de lucro em tempo real (CORRIGIDO)
  useEffect(() => {
    const calcularMargem = () => {
      if (precoCusto && precoVenda) {
        const custoNum = parseFloat(precoCusto.replace(',', '.'));
        const vendaNum = parseFloat(precoVenda.replace(',', '.'));
        
        console.log('Calculando margem:', { custoNum, vendaNum });
        
        if (custoNum > 0 && vendaNum > 0) {
          const margem = ((vendaNum - custoNum) / custoNum * 100);
          const margemFormatada = margem.toFixed(2);
          setMargemLucro(margemFormatada);
          console.log('Margem calculada:', margemFormatada + '%');
        } else {
          setMargemLucro('0.00');
        }
      } else {
        setMargemLucro('0.00');
      }
    };

    calcularMargem();
  }, [precoCusto, precoVenda]);

  const formatarNumero = (valor: string) => {
    // Remove caracteres não numéricos exceto ponto e vírgula
    return valor.replace(/[^0-9.,]/g, '').replace(',', '.');
  };

  const escolherImagem = async () => {
    try {
      // Pedir permissões
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão Necessária',
          'Precisamos de acesso à galeria para selecionar imagens.',
          [
            { text: 'Cancelar' },
            { text: 'Configurações', onPress: () => ImagePicker.requestMediaLibraryPermissionsAsync() }
          ]
        );
        return;
      }

      // Abrir galeria
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      console.log('ImagePicker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        
        // Verificar tamanho da imagem
        if (selectedImage.fileSize && selectedImage.fileSize > 5 * 1024 * 1024) {
          Alert.alert('Atenção', 'A imagem é muito grande. Selecione uma imagem menor que 5MB.');
          return;
        }

        setImagem(selectedImage);
        console.log('Imagem selecionada com sucesso:', selectedImage.uri);
        
        Alert.alert('Sucesso', 'Imagem selecionada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem. Tente novamente.');
    }
  };

  const validarCampos = () => {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'O nome do produto é obrigatório!');
      return false;
    }

    const custoNum = parseFloat(formatarNumero(precoCusto));
    const vendaNum = parseFloat(formatarNumero(precoVenda));

    if (!precoCusto || isNaN(custoNum) || custoNum <= 0) {
      Alert.alert('Atenção', 'Informe um preço de custo válido!');
      return false;
    }

    if (!precoVenda || isNaN(vendaNum) || vendaNum <= 0) {
      Alert.alert('Atenção', 'Informe um preço de venda válido!');
      return false;
    }

    if (vendaNum <= custoNum) {
      Alert.alert('Atenção', 'O preço de venda deve ser maior que o preço de custo!');
      return false;
    }

    return true;
  };

  const salvarProduto = async () => {
    console.log('🚀 Iniciando salvamento do produto');
    
    if (!validarCampos()) {
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      
      formData.append('nome', nome.trim());
      formData.append('preco_custo', parseFloat(formatarNumero(precoCusto)).toFixed(2));
      formData.append('preco_venda', parseFloat(formatarNumero(precoVenda)).toFixed(2));
      formData.append('observacoes', observacoes.trim());
      formData.append('estoque_atual', estoqueAtual ? parseInt(estoqueAtual).toString() : '0');

      // Adicionar imagem se foi selecionada uma nova
      if (imagem && imagem.uri) {
        const imageUri = imagem.uri;
        const imageName = imageUri.split('/').pop() || `produto_${Date.now()}.jpg`;
        
        console.log('Adicionando imagem ao FormData:', {
          uri: imageUri,
          name: imageName,
          type: imagem.type || 'image/jpeg'
        });

        formData.append('imagem', {
          uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
          type: imagem.type || 'image/jpeg',
          name: imageName,
        } as any);
      }

      const url = isEditing 
        ? `http://localhost:3000/api/produtos/${produto.id}`
        : 'http://localhost:3000/api/produtos';
      
      const method = isEditing ? 'PUT' : 'POST';

      console.log(`📤 Enviando ${method} para ${url}`);

      const response = await fetch(url, {
        method,
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();
      console.log('📥 Resposta do servidor:', result);

      if (result.success) {
        const mensagem = isEditing ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!';
        
        Alert.alert(
          'Sucesso!',
          mensagem,
          [
            {
              text: 'OK',
              onPress: () => {
                if (!isEditing) {
                  limparFormulario();
                }
                navigation.navigate('Products', { reload: true });
              }
            }
          ]
        );
      } else {
        throw new Error(result.error || 'Erro desconhecido do servidor');
      }

    } catch (error: any) {
      console.error('❌ Erro ao salvar produto:', error);
      
      let mensagemErro = 'Não foi possível salvar o produto';
      
      if (error.message) {
        mensagemErro = error.message;
      }
      
      // Verificar erros específicos
      if (error.message?.includes('Network request failed')) {
        mensagemErro = 'Erro de conexão. Verifique se o servidor está rodando.';
      } else if (error.message?.includes('400')) {
        mensagemErro = 'Dados inválidos. Verifique os campos obrigatórios.';
      } else if (error.message?.includes('500')) {
        mensagemErro = 'Erro interno do servidor. Tente novamente.';
      }

      Alert.alert('Erro', mensagemErro);
    } finally {
      setLoading(false);
    }
  };

  const imagemParaExibir = imagem ? imagem.uri : (imagemExistente ? `http://localhost:3000${imagemExistente}` : null);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            if (!isEditing) {
              limparFormulario();
            }
            navigation.goBack();
          }}
        >
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        
        <Text style={styles.title}>
          {isEditing ? 'Editar Produto' : 'Novo Produto'}
        </Text>
      </View>

      <View style={styles.form}>
        {/* Nome */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome do Produto *</Text>
          <TextInput
            placeholder="Ex: Smartphone Samsung Galaxy"
            value={nome}
            onChangeText={setNome}
            style={styles.input}
            placeholderTextColor="#999"
          />
        </View>

        {/* Preços */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Preço de Custo *</Text>
            <TextInput
              placeholder="0,00"
              value={precoCusto}
              onChangeText={(text) => setPrecoCusto(formatarNumero(text))}
              keyboardType="numeric"
              style={styles.input}
              placeholderTextColor="#999"
            />
          </View>

          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Preço de Venda *</Text>
            <TextInput
              placeholder="0,00"
              value={precoVenda}
              onChangeText={(text) => setPrecoVenda(formatarNumero(text))}
              keyboardType="numeric"
              style={styles.input}
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Margem de Lucro */}
        <View style={styles.margemContainer}>
          <Text style={styles.margemText}>
            Margem de Lucro: {margemLucro}%
          </Text>
          {parseFloat(margemLucro) < 10 && parseFloat(margemLucro) > 0 && (
            <Text style={styles.margemAlerta}>
              ⚠️ Margem baixa - considere aumentar o preço de venda
            </Text>
          )}
        </View>

        {/* Estoque */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Estoque Atual</Text>
          <TextInput
            placeholder="0"
            value={estoqueAtual}
            onChangeText={(text) => setEstoqueAtual(text.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
            style={styles.input}
            placeholderTextColor="#999"
          />
        </View>

        {/* Observações */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Observações</Text>
          <TextInput
            placeholder="Informações adicionais sobre o produto..."
            value={observacoes}
            onChangeText={setObservacoes}
            style={[styles.input, styles.textArea]}
            multiline={true}
            numberOfLines={3}
            textAlignVertical="top"
            placeholderTextColor="#999"
          />
        </View>

        {/* Imagem */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Imagem do Produto</Text>
          
          <TouchableOpacity
            style={styles.imageButton}
            onPress={escolherImagem}
            disabled={loading}
          >
            <Text style={styles.imageButtonText}>
              {imagemParaExibir ? 'Alterar Imagem' : 'Selecionar Imagem'}
            </Text>
          </TouchableOpacity>

          {imagemParaExibir && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: imagemParaExibir }}
                style={styles.image}
                resizeMode="cover"
                onError={(error) => {
                  console.log('Erro ao carregar imagem:', error);
                  Alert.alert('Erro', 'Não foi possível carregar a imagem');
                }}
              />
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={() => {
                  setImagem(null);
                  setImagemExistente(null);
                }}
              >
                <Text style={styles.removeImageText}>Remover</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Botão Salvar */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={salvarProduto}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.loadingText}>
                {isEditing ? 'Atualizando...' : 'Salvando...'}
              </Text>
            </View>
          ) : (
            <Text style={styles.saveButtonText}>
              {isEditing ? 'Atualizar Produto' : 'Salvar Produto'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Informações adicionais */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            * Campos obrigatórios
          </Text>
          <Text style={styles.infoText}>
            💡 A margem de lucro é calculada automaticamente
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 55,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  margemContainer: {
    backgroundColor: '#E8F5E8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  margemText: {
    color: '#2E7D32',
    fontWeight: '600',
    fontSize: 16,
  },
  margemAlerta: {
    color: '#FF6B00',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  imageButton: {
    backgroundColor: '#FF9800',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    elevation: 2,
  },
  imageButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  removeImageButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    marginTop: 10,
  },
  removeImageText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  saveButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginLeft: 10,
    fontSize: 16,
  },
  infoContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
});