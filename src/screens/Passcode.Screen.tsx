import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import SecretsManager from '../utils/SecretsManager';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../Navigation';
import { useWallet } from '../contexts/WalletContext';
import Icon from 'react-native-vector-icons/Ionicons';

type Props = StackScreenProps<RootStackParamList, 'Passcode'>;

const PasscodeScreen: React.FC<Props> = ({ navigation, route }) => {
  const { importWallets } = useWallet();
  const [passcode, setPasscode] = useState('');
  const [isSettingPasscode, setIsSettingPasscode] = useState(false);
  const [isVerifyingPasscode, setIsVerifyingPasscode] = useState(false);
  const [tempPasscode, setTempPasscode] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [isSuspended, setIsSuspended] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const checkPasscode = async () => {
      await SecretsManager.deleteSecret('userPasscode');
      await SecretsManager.deleteSecret('mnemonics');
      const hasPasscode = await SecretsManager.getSecret('userPasscode');
      setIsSettingPasscode(!hasPasscode);
    };
    checkPasscode();
  }, []);

  const handleSetPasscode = async () => {
    if (passcode.length !== 6) {
      Alert.alert('Invalid Passcode', 'Passcode should be 6 digits long.');
      return;
    }
    if (isVerifyingPasscode) {
      if (passcode === tempPasscode) {
        await SecretsManager.setSecret('userPasscode', passcode);
        navigation.replace('Initial', {});
      } else {
        Alert.alert('Passcode Mismatch', 'The passcodes do not match. Please try again.');
        setIsVerifyingPasscode(false);
        setPasscode('');
        setTempPasscode('');
      }
    } else {
      setTempPasscode(passcode);
      setIsVerifyingPasscode(true);
      setPasscode('');
    }
  };

  const handleVerifyPasscode = async () => {
    const storedPasscode = await SecretsManager.getSecret('userPasscode');
    if (storedPasscode === passcode) {
      const mnemonics = await SecretsManager.getSecret('mnemonics');
      if (!mnemonics) {
        navigation.replace('Initial', {});
      } else {
        await importWallets(mnemonics);
        navigation.replace('WalletDashboard', { previousScreen: 'Passcode' });
      }
    } else {
      setRetryCount(retryCount + 1);
      if (retryCount >= 2) {
        setIsSuspended(true);
        setTimeout(() => {
          setRetryCount(0);
          setIsSuspended(false);
        }, 120000);
      }
      Alert.alert('Error', `Incorrect passcode. Attempt ${retryCount + 1} out of 3`);
      setPasscode('');
    }
  };

  const handlePasscodeChange = (value: string) => {
    setPasscode(value);
  };

  const handleConfirm = () => {
    if (passcode.length !== 6) {
      Alert.alert('Invalid Passcode', 'Passcode should be 6 digits long.');
      return;
    }
    if (isSettingPasscode) {
      handleSetPasscode();
    } else {
      handleVerifyPasscode();
    }
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  const renderPasscodeDots = () => {
    const dots = [];
    for (let i = 0; i < 6; i++) {
      dots.push(
        <View
          key={i}
          style={[styles.passcodeCircle, i < passcode.length && styles.passcodeCircleFilled]}
        />
      );
    }
    return dots;
  };

  if (isSuspended) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Too many failed attempts. Try again in 2 minutes.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Icon name="chevron-back" size={24} color="#FFF" />
      </TouchableOpacity>
      <Text style={styles.title}>
        {isSettingPasscode
          ? isVerifyingPasscode
            ? 'Confirm Wallet Passcode'
            : 'Set Wallet Passcode'
          : 'Insert Wallet Passcode'}
      </Text>
      <TouchableOpacity onPress={focusInput} style={styles.passcodeContainer}>
        {renderPasscodeDots()}
      </TouchableOpacity>
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        keyboardType="numeric"
        maxLength={6}
        value={passcode}
        onChangeText={handlePasscodeChange}
        secureTextEntry
      />
      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
        <Text style={styles.confirmButtonText}>Confirm</Text>
      </TouchableOpacity>
    </View>
  );
};

const { height, width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
  },
  title: {
    fontSize: 20,
    color: '#FFF',
    marginTop: height * 0.1,
    marginBottom: height * 0.05,
  },
  passcodeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: height * 0.3,
    height: 50,
  },
  passcodeCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFF',
    marginHorizontal: 8,
  },
  passcodeCircleFilled: {
    backgroundColor: '#FFF',
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  confirmButton: {
    position: 'absolute',
    bottom: height * 0.1,
    backgroundColor: 'red',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PasscodeScreen;