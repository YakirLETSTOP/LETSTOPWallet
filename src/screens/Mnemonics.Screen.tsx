// src/screens/MnemonicScreen.tsx
import React, {useContext, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  FlatList,
} from 'react-native';
import {RootStackParamList} from '../Navigation';
import {StackScreenProps} from '@react-navigation/stack';
import SecretsManager from '../utils/SecretsManager';
import Clipboard from '@react-native-clipboard/clipboard';

type Props = StackScreenProps<RootStackParamList, 'Mnemonics'>;

const MnemonicsScreen: React.FC<Props> = ({navigation, route}) => {
  const [mnemonics, setMnemonics] = useState(['']);
  const previousScreen = route.params.previousScreen;

  useEffect(() => {
    const getMenomics = async () => {
      const mn = await SecretsManager.getSecret('mnemonics');
      setMnemonics(Array.from(mn!.split(' ').slice(0, 12)));
    };
    getMenomics();
  }, [mnemonics]);

  const copyToClipboard = () => {
    Clipboard.setString(mnemonics.join(' '));
    Alert.alert('Mnemonic phrase copied to clipboard!');
  };

  const handleMnemonicsNavigation = () => {
    if (previousScreen == 'Initial') {
      navigation.replace('MnemonicsConfirmation', {});
    } else if (previousScreen == 'settings') {
      navigation.pop();
    }
  };

  return (
    <View style={styles.container}>
      {previousScreen == 'Initial' ? (
        <Text style={styles.title}>Wallet Created! </Text>
      ) : (
        <Text style={styles.title}>Backup Wallet</Text>
      )}
      <Text style={styles.subtitle}>Your Mnemonic Phrase</Text>
      <View>
        <FlatList
          data={mnemonics}
          keyExtractor={(item, index) => `${index}-${item}`}
          renderItem={({item, index}) => (
            <View style={styles.wordContainer}>
              <Text style={styles.wordText}>{`${index + 1}. ${item}`}</Text>
            </View>
          )}
          numColumns={2}
        />
      </View>
      <TouchableOpacity style={styles.copyButton} onPress={copyToClipboard}>
        <Text style={styles.copyButtonText}>Copy to clipboard</Text>
      </TouchableOpacity>
      <View style={styles.storeContainer}>
        <Text style={styles.storeText}>Store them safely and never share them!</Text>
      </View>
      <TouchableOpacity
        style={styles.continueButton}
        // Add conditional navigation (if coming from settings e.g.)
        onPress={() => handleMnemonicsNavigation()}>
        {previousScreen == 'Initial' ? (
          <Text style={styles.continueButtonText}>Continue</Text>
        ) : (
          <Text style={styles.continueButtonText}>Confirm</Text>
        )}
      </TouchableOpacity>
    </View>
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
    //flexWrap: 'wrap',
    borderColor: '#474747',
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
    marginBottom: 2,
    // backgroundColor: '#1E1E1E',
  },
  mnemonicContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  wordContainer: {
    backgroundColor: '#333',
    padding: 12,
    margin: 8,
    borderRadius: 10,
    width: '45%',
    height: '75%',
    alignItems: 'center',
  },
  wordText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  copyButtonText: {
    color: '#FFF',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  storeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    // paddingVertical: 10,
    paddingHorizontal: 80,
    marginBottom: 30,
    // width: '80%'
  },
  storeText: {
    color: 'red',
    fontSize: 18,
    //fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 24,
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
});
export default MnemonicsScreen;
