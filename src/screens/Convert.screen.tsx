import {StackScreenProps} from '@react-navigation/stack';
import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {RootStackParamList} from '../Navigation';
import SecretsManager from '../utils/SecretsManager';
import {ClaimTransaction} from '../types/interfaces';
import {useWallet} from '../contexts/WalletContext';
import {TransactionType} from '../types/interfaces';
import Config from 'react-native-config';
import {ASSETS} from '../assets';

type Props = StackScreenProps<RootStackParamList, 'Convert'>;

const ConvertScreen: React.FC<Props> = ({navigation, route}) => {
  // Can refactor all those shit states to one state that depends on objects
  const {token, credit} = route.params.data;
  // For testing purpose ONLY!!
  credit.amount = 1000;
  //console.log(JSON.stringify('icon: ' + token.icon))
  // handle this more elegantly
  const {veChainWallet, solanaWallet, getSolanaUserTokenAddress} = useWallet();
  const [fromAsset, setFromAsset] = useState(credit.name);
  const [toAsset, setToAsset] = useState(token.symbol);
  const [fromAssetType, setFromAssetType] = useState('Credits');
  const [toAssetType, setToAssetType] = useState('Tokens');
  const [fromValue, setFromValue] = useState(0);
  const [toValue, setToValue] = useState(0);
  const [fromBalance, setFromBalance] = useState(credit.amount ?? 100);
  const [toBalance, setToBalance] = useState(+token.amount ?? 0);
  const [warning, setWarning] = useState('');
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [arrowDirection, setArrowDirection] = useState(0);
  const [fromIcon, setFromIcon] = useState(credit.icon);
  const [toIcon, setToIcon] = useState(token.icon);

  const swapAssets = () => {
    const tempAsset = fromAsset;
    setFromAsset(toAsset);
    setFromAssetType(toAssetType);
    setToAsset(tempAsset);
    setToAssetType(fromAssetType);
    setFromValue(0);
    setToValue(0);
    setFromBalance(+toBalance);
    setToBalance(+fromBalance);
    //setArrowDirection(prevDirection => prevDirection + 180);
  };

  // Refactor to be more dynamic
  const handleIcon = (asset: string) => {
    if (asset == 'LETSTOP') {
      return fromIcon;
    }
    return {uri: toIcon};
  };

  const sanitizeInput = (value: string) => {
    return +value.replace(/[^0-9.]/g, '');
  };

  const handleFromValueChange = (value: string) => {
    const sanitizedValue = sanitizeInput(value);
    setFromValue(sanitizedValue);
    setToValue(sanitizedValue);
    if (sanitizedValue > fromBalance) {
      setWarning('Insufficient balance');
      setIsButtonDisabled(true);
    } else {
      setWarning('');
      setIsButtonDisabled(false);
    }
  };

  const handleClaim = () => {
    if (+toValue <= 0) {
      Alert.alert('Error', 'Please enter a positive amount');
      return;
    }

    Alert.alert(
      'Confirm Convertion',
      `Do you want to Convert ${fromValue} ${fromAsset} ${fromAssetType} to ${toValue} ${toAsset} ${toAssetType}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'OK', onPress: () => performConvertion()},
      ],
    );
  };

  const performConvertion = async () => {
    let token = '';
    const authToken = await SecretsManager.getSecret('authToken');
    const transactionType =
      toAssetType == 'Tokens'
        ? TransactionType.CLAIM_TOKEN
        : TransactionType.CLAIM_CREDIT;
    const path = `https://jvc6gtf6s2.execute-api.us-east-1.amazonaws.com/prod/${toAssetType
      .toLowerCase()
      .slice(0, -1)}`;

    // Platform.OS == 'android'
    //   ? `http://10.0.2.2:3000/convert/${toAssetType
    //       .toLowerCase()
    //       .slice(0, -1)}`
    //   : `http://127.0.0.1:3000/convert/${toAssetType
    //       .toLowerCase()
    //       .slice(0, -1)}`;
    // FIX THIS SHIT!
    if (fromAsset == 'STOP' || toAsset == 'STOP') {
      token = Config.STOP_TOKEN_ADDRESS!;
    }
    // Refactor to be dynamic and support vechain and future tokens

    const convertTranscation: ClaimTransaction = {
      user: solanaWallet!.publicKey.toBase58(),
      token: token,
      amount: toValue, // make sure to check the chosen token params
      type: transactionType,
    };

    console.log(JSON.stringify(convertTranscation));
    try {
      const response = await fetch(path, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${authToken}`,
        },
        body: JSON.stringify(convertTranscation),
      });

      if (response.status == 201 || response.status == 200) {
        const txnHash = await response.text();
        Alert.alert(
          'Success',
          `Transaction completed successfully \n TransactionID: \n ${JSON.stringify(
            txnHash,
          )}`,
        );
      } else {
        Alert.alert('Error', `Transaction failed, Error: ${response.status}`);
      }
    } catch (error) {
      console.log(error);
      Alert.alert(
        'Error',
        'An error occurred while processing the transaction',
      );
    } finally {
      navigation.goBack();
    }
  };

  const handleMaxPress = () => {
    //const maxValue = fromBalance.toString();
    setFromValue(fromBalance);
    setToValue(fromBalance);
    setWarning('');
    setIsButtonDisabled(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Convert</Text>
      <View style={styles.card}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>From</Text>
          <Text style={styles.balance}>Balance: {fromBalance}</Text>
        </View>
        <View style={styles.assetRow}>
          <Image source={handleIcon(fromAsset)} style={styles.icon} />
          <View>
            <Text style={styles.assetName}>{fromAsset}</Text>
            <Text style={styles.assetSubtext}>{fromAssetType}</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="0"
            keyboardType="numeric"
            value={fromValue.toString()}
            onChangeText={handleFromValueChange}
          />
        </View>
        {warning ? <Text style={styles.warning}>{warning}</Text> : null}
        <TouchableOpacity onPress={handleMaxPress}>
          <Text style={styles.maxText}>Max</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.separatorContainer}>
        <TouchableOpacity style={styles.separator} onPress={swapAssets}>
          <Image
            source={ASSETS.ConvertBetweenButton}
            style={styles.convertBetweenButton}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.card}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>To</Text>
          <Text style={styles.balance}>Balance: {toBalance}</Text>
        </View>
        <View style={styles.assetRow}>
          <Image source={handleIcon(toAsset)} style={styles.icon} />
          <View>
            <Text style={styles.assetName}>{toAsset}</Text>
            <Text style={styles.assetSubtext}>{toAssetType}</Text>
          </View>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            placeholder="0"
            keyboardType="numeric"
            value={toValue.toString()}
            editable={false}
          />
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isButtonDisabled && styles.buttonDisabled]}
          disabled={isButtonDisabled}
          onPress={handleClaim}>
          <Text style={styles.buttonText}>Convert</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 24,
    height: '100%', // Ensuring full screen background
  },
  title: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#1c1c1e',
    borderRadius: 8,
    padding: 18,
    marginBottom: 4, // Adjusted for closer spacing
    height: '15%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    color: '#888',
    fontSize: 14,
  },
  balance: {
    color: '#888',
    fontSize: 14,
  },
  assetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    width: 30,
    height: 30,
    marginRight: 12,
  },
  assetName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  assetSubtext: {
    color: '#888',
    fontSize: 12,
  },
  input: {
    backgroundColor: 'transparent',
    borderRadius: 4,
    color: 'white',
    fontSize: 20,
    padding: 8,
    textAlign: 'right',
    flex: 1,
  },
  inputDisabled: {
    backgroundColor: 'transparent',
    color: '#888',
  },
  maxText: {
    color: 'red',
    fontSize: 14,
    textAlign: 'right',
  },
  warning: {
    color: 'red',
    fontSize: 12,
    textAlign: 'left',
    //marginBottom: 8,
  },
  separatorContainer: {
    alignItems: 'center',
    marginVertical: -24, // Negative margin to overlap the cards
    zIndex: 1, // Ensure it appears above the cards
  },
  separator: {
    backgroundColor: 'black',
    borderRadius: 50,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'black',
  },
  separatorText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  button: {
    backgroundColor: 'red',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '80%',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: 'grey',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  convertBetweenButton: {
    height: 40,
    width: 40,
  },
});
export default ConvertScreen;
