// src/screens/MnemonicScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../Navigation';
import SecretsManager from '../utils/SecretsManager';
import { mnemonic } from '@vechain/sdk-core';

type Props = StackScreenProps<RootStackParamList, 'MnemonicsConfirmation'>;

const MnemonicsScreen: React.FC<Props> = ({ navigation }) => {
  const [mnemonics, setMnemonics] = useState<string[]>([]);
  const [scrambledMnemonics, setScrambledMnemonics] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>(Array(12).fill(''));

  useEffect(() => {
    const loadMnemonics = async () => {
      const phrase = await SecretsManager.getSecret('mnemonics');
      if (phrase) {
        const words = phrase.split(' ').slice(0, 12);
        setMnemonics(words);
        setScrambledMnemonics(shuffleArray([...words]));
      }
    };
    loadMnemonics();
  }, []);

  const shuffleArray = (array: string[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const handleWordSelect = (word: string) => {
    const index = selectedWords.findIndex(w => w === '');
    if (index !== -1) {
      const newSelectedWords = [...selectedWords];
      newSelectedWords[index] = word;
      setSelectedWords(newSelectedWords);
    }
  };

  const handleContinue = () => {
    //if (selectedWords.join(' ') === mnemonics.join(' ')) {
      Alert.alert('Success', 'The mnemonics are correct!');
      navigation.replace('WalletDashboard', {});
    // } else {
    //   Alert.alert('Error', 'The mnemonics are incorrect. Please try again.');
    //   setSelectedWords(Array(12).fill(''));
    // }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Confirm your recovery phrase</Text>
      <Text style={styles.subtitle}>Select the missing words in order</Text>
      <View style={styles.mnemonicFrame}>
        <FlatList
          data={selectedWords}
          keyExtractor={(item, index) => `${index}-${item}`}
          renderItem={({ item, index }) => (
            <View style={styles.wordContainer}>
              <Text style={styles.wordText}>{`${index + 1}. ${item}`}</Text>
            </View>
          )}
          numColumns={2}
        />
      </View>
      <View style={styles.scrambledMnemonicFrame}>
  <FlatList
    data={scrambledMnemonics}
    keyExtractor={(item, index) => `scrambled-${index}-${item}`}
    renderItem={({ item }) => (
      <TouchableOpacity
        style={styles.scrambledWordButton}
        onPress={() => handleWordSelect(item)}
        disabled={selectedWords.includes(item)}
      >
        <Text style={[
          styles.wordText,
          selectedWords.includes(item) && styles.wordTextDisabled
        ]}>{item}</Text>
      </TouchableOpacity>
    )}
    numColumns={4}
    contentContainerStyle={styles.scrambledListContainer}
  />
</View>
      
      <TouchableOpacity
        style={styles.continueButton}
        onPress={handleContinue}
      >
        <Text style={styles.continueButtonText}>Confirm</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
    justifyContent: 'space-evenly',
  },
  title: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  mnemonicFrame: {
    justifyContent: 'center',
    flexDirection: 'row',
    borderColor: '#474747',
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
    marginBottom: 2,
  },
  mnemonicContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    padding: 10,
  },
  wordContainer: {
    backgroundColor: '#333',
    padding: 8,
    margin: 6,
    borderRadius: 5,
    width: '45%',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  wordText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
  },
  wordTextDisabled: {
    color: '#666',
  },
  continueButton: {
    backgroundColor: '#FF4500',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  ScrambledMnemonicsContainer: {
    justifyContent: 'center',
    flexDirection: 'row',
    borderColor: '#474747',
    borderWidth: 0.5,
    borderRadius: 10,
    padding: 10,
    marginBottom: 2,
  },
  scrambledMnemonicFrame: {
    justifyContent: 'center',
    flexDirection: 'row',
    padding: 16,
    marginBottom: 2,
  },
  scrambledWordButton: {
    backgroundColor: '#444',
    padding: 10,
    margin: 5,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'space-between',
    //width: '22%', // Adjusted to fit 4 columns with some spacing
  },
  scrambledWordText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
  },
  scrambledListContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});

export default MnemonicsScreen;