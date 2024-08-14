import React, {useState} from 'react';
import {View, Text, TextInput, Button, StyleSheet} from 'react-native';
import {ParamListBase, useNavigation} from '@react-navigation/native';
import BlockchainFetcher from '../utils/BlockchainFetcher';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useWallet} from '../contexts/WalletContext';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../Navigation';

type Props = StackScreenProps<RootStackParamList, 'ImportWallet'>;


const ImportWalletScreen: React.FC<Props> = ({navigation, route}) => {
  const {importWallets} = useWallet();
  const bf = new BlockchainFetcher();
  const [mnemonics, setMnemonics] = useState('');
  const [error, setError] = useState('');

  const importAndStoreWallets = async () => {
    // const {pKeyEthereum, pKeyVeChain} = bf.getPrivateKeyFromMnemonics(mnemonics);
    // console.log('Import: ' + pKeyEthereum, "\n" , pKeyVeChain);
    await importWallets(mnemonics);
    navigation.replace('Passcode', {previousScreen: "Import Wallet"});
  };

  return (
    <View style={styles.container}>
      <Text>Import Wallets</Text>
      <TextInput
        style={styles.input}
        placeholder="Mnemonics"
        value={mnemonics}
        onChangeText={setMnemonics}
      />
      <Button title="Import Wallets" onPress={importAndStoreWallets} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    width: '80%',
    paddingHorizontal: 8,
  },
});

export default ImportWalletScreen;
