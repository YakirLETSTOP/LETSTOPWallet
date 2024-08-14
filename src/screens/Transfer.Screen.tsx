import React, {useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  ScrollView,
  Image,
  FlatList,
  KeyboardAvoidingView,
} from 'react-native';
import {StackScreenProps} from '@react-navigation/stack';
import {RootStackParamList} from '../Navigation';
import {useWallet} from '../contexts/WalletContext';
import {Token, TransactionType} from '../types/interfaces';
import SecretsManager from '../utils/SecretsManager';
import {globalStyles} from '../styles/styles';
import Icon from 'react-native-vector-icons/Ionicons';

type Props = StackScreenProps<RootStackParamList, 'Transfer'>;

const TokenPicker: React.FC<{
  selectedToken: Token;
  tokens: Token[];
  onSelectToken: (token: Token) => void;
}> = ({selectedToken, tokens, onSelectToken}) => {
  const [isOpen, setIsOpen] = useState(false);

  const renderToken = ({item}: {item: Token}) => (
    <TouchableOpacity
      style={styles.tokenItem}
      onPress={() => {
        onSelectToken(item);
        setIsOpen(false);
      }}>
      <Image
        source={{uri: `data:image/jpg;base64,${item.icon}`}}
        style={styles.tokenIcon}
      />
      <Text style={styles.tokenSymbol}>{item.symbol}</Text>
    </TouchableOpacity>
  );

  return (
    <View>
      <TouchableOpacity
        style={styles.tokenPickerButton}
        onPress={() => setIsOpen(!isOpen)}>
        <Image
          source={{uri: `data:image/jpg;base64,${selectedToken.icon}`}}
          style={styles.tokenIcon}
        />
        <Text style={styles.selectedTokenSymbol}>{selectedToken.symbol}</Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.tokenList}>
          <FlatList
            data={tokens}
            renderItem={renderToken}
            keyExtractor={item => item.id}
            style={styles.tokenListContent}
          />
        </View>
      )}
    </View>
  );
};

const TransferScreen: React.FC<Props> = ({navigation, route}) => {
  const {signTransaction, isValidRecipient} = useWallet();
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [token, setToken] = useState(route.params.tokens[0]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const tokens: Token[] = [...route.params.tokens];

  const handleMaxPress = () => {
    setAmount(token.amount);
  };

  const handleReviewTransfer = () => {
    if (!isValidRecipient(recipient)) {
      Alert.alert('Error', 'Please enter a valid recipient');
      return;
    }
    if (!amount || +amount <= 0 || +amount > +token.amount) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    setModalVisible(true);
  };

  const handleConfirmTransfer = () => {
    setModalVisible(false);
    performTransfer();
  };

  const performTransfer = async () => {
    setLoading(true);
    const authToken = await SecretsManager.getSecret('authToken');
    try {
      const transactionType = TransactionType.TRANSFER;
      const signedTransaction = await signTransaction(
        '',
        recipient,
        token.address,
        amount,
        transactionType,
        '',
        token.chain,
      );

      if (!signedTransaction.signature || !signedTransaction.user) {
        Alert.alert(
          'Failed building transaction',
          `Can't build the requested transaction`,
        );
        return;
      }

      const path =
        'https://jvc6gtf6s2.execute-api.us-east-1.amazonaws.com/prod/transfer'; //Platform.OS === 'android' ? 'http://10.0.2.2:3000/transfer' : 'http://127.0.0.1:3000/transfer';
      const response = await fetch(path, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${authToken}`,
        },
        body: JSON.stringify(signedTransaction),
      });

      if (response.status === 200 || response.status === 201) {
        const txnId = await response.text();
        Alert.alert(
          'Success',
          `Transaction completed successfully\nTransactionID:\n${JSON.stringify(
            txnId,
          )}`,
        );
      } else {
        Alert.alert('Error', `Transaction failed, Error: ${response.status}`);
      }
    } catch (error) {
      console.error(error);
      Alert.alert(
        'Error',
        'An error occurred while processing the transaction',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
    style={styles.container} 
    behavior={"padding"}
    keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
  >
    <ScrollView 
      contentContainerStyle={styles.scrollViewContent}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Send</Text>
      <View style={styles.mainContainer}>
        <View style={styles.amountContainer}>
          <View style={styles.tokenPickerContainer}>
            <Text style={styles.tokenLabel}>Token:</Text>
            <TokenPicker
              selectedToken={token}
              tokens={tokens}
              onSelectToken={setToken}
            />
          </View>
          <View style={styles.amountInputContainer}>
            <Text style={styles.balanceText}>Balance: {token.amount ?? 0}</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#888"
            />
            <TouchableOpacity style={styles.maxButton} onPress={handleMaxPress}>
              <Text style={styles.maxButtonText}>Max</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.arrowContainer}>
          <Text style={styles.arrowText}>↓</Text>
        </View>
        <View style={styles.recipientContainer}>
          <TouchableOpacity style={styles.searchIconContainer}>
            <Icon name='search-outline' size={24} color={'#8FA2B7'}/>
          </TouchableOpacity>
          <TextInput
            style={styles.recipientInput}
            value={recipient}
            onChangeText={setRecipient}
            placeholder="Search ENS or address"
            placeholderTextColor="#888"
          />
          <TouchableOpacity style={styles.qrIconContainer}>
            <Icon name='scan-outline' size={24} color={'#8FA2B7'}/>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.reviewButton}
          onPress={handleReviewTransfer}
          disabled={loading}
        >
          <Text style={styles.reviewButtonText}>
            {loading ? <ActivityIndicator color="#FFF" /> : 'Review transfer'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Transfer</Text>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>You will send</Text>
              <View style={styles.reviewValueContainer}>
                <Image
                  source={{uri: token.icon}}
                  style={styles.reviewTokenIcon}
                />
                <Text style={styles.reviewValue}>
                  {amount} {token.symbol}
                </Text>
              </View>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>From</Text>
              <Text
                style={styles.reviewValue}
                numberOfLines={1}
                ellipsizeMode="middle">
                {token.address}
              </Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>To</Text>
              <Text
                style={styles.reviewValue}
                numberOfLines={1}
                ellipsizeMode="middle">
                {recipient}
              </Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Chain</Text>
              <Text style={styles.reviewValue}>{token.chain}</Text>
            </View>
            <Text style={styles.termsText}>
              By continuing, I agree to the terms of service and consent to the
              privacy policy.
            </Text>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirmTransfer}>
              <Text style={styles.confirmButtonText}>Confirm Transfer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    color: '#FFF',
    fontWeight: 'bold',
  },
  mainContainer: {
    flex: 1,
  },
  amountContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
   // height: '15%'
  },
  tokenPickerContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
  },
  tokenLabel: {
    color: '#888',
    fontSize: 16,
    marginRight: 8,
    marginBottom: 16,
  },
  amountInputContainer: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  balanceText: {
    color: '#888',
    fontSize: 14,
    marginBottom: 4,
  },
  amountInput: {
    color: '#FFF',
    fontSize: 24,
    textAlign: 'right',
    width: '100%',
    marginBottom: 4,
  },
  maxButton: {
    alignSelf: 'flex-end',
  },
  maxButtonText: {
    color: '#FF453A',
    fontWeight: 'bold',
    fontSize: 14,
  },
  arrowContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  arrowText: {
    fontSize: 40,
    color: 'white',
  },
  recipientContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIconContainer: {
    marginRight: 8,
  },
  recipientInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
  },
  qrIconContainer: {
    marginLeft: 8,
  },
  buttonContainer: {
    padding: 16,
  },
  reviewButton: {
    backgroundColor: 'red',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  reviewButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  iconPlaceholder: {
    fontSize: 20,
    color: '#888',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#FFF',
    textAlign: 'center',
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewLabel: {
    fontSize: 16,
    color: '#888',
  },
  reviewValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    maxWidth: '60%',
  },
  reviewTokenIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    borderRadius: 10,
  },
  termsText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  confirmButton: {
    backgroundColor: '#FF4136',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // TokenPicker styles
  tokenPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'black',
    borderRadius: 12,
    padding: 8,
  },
  tokenIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
    borderRadius: 12,
  },
  selectedTokenSymbol: {
    color: '#FFF',
    fontSize: 16,
    marginRight: 8,
  },
  dropdownArrow: {
    color: '#FFF',
    fontSize: 16,
  },
  tokenList: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    backgroundColor: 'black',
    borderRadius: 12,
    maxHeight: 200,
    zIndex: 0,
    elevation: 0,
  },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  tokenSymbol: {
    color: '#FFF',
    fontSize: 16,
    marginLeft: 8,
  },
  tokenListContent: {
    padding: 8,
  },
});

export default TransferScreen;
