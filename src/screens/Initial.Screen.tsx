// src/screens/InitialScreen.tsx
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import {useWallet} from '../contexts/WalletContext';
import SecretsManager from '../utils/SecretsManager';
import {StackScreenProps} from '@react-navigation/stack';
import {RootStackParamList} from '../Navigation';
import LinearGradient from 'react-native-linear-gradient';

type Props = StackScreenProps<RootStackParamList, 'Initial'>;

const InitialScreen: React.FC<Props> = ({navigation, route}) => {
  const {createWallets} = useWallet();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token =
      'Bearer eyJraWQiOiJNaTh6RWlvZWEydHVybmFmRHVvUmttcjhvUnZETTFxWElVUis2V0tFc25BPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiI4NGY4OTQyOC01MDQxLTcwOWQtZmQzYy0yNTI3MTllODEwNzkiLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAudXMtZWFzdC0xLmFtYXpvbmF3cy5jb21cL3VzLWVhc3QtMV8xOHNFb0pGZ0YiLCJjbGllbnRfaWQiOiI3NnI0MGozcGRpcjMxZXQ0cjl2Ym9ncGlnOCIsIm9yaWdpbl9qdGkiOiI3MzM3NTE0MS02ZTA3LTQxNzEtYTk4OC03NjVlZmMyOWJiMDkiLCJldmVudF9pZCI6Ijg4NjViZmYxLWNlOTAtNGNiMS1iYzBkLWUwZWJkY2E4ZTBkYyIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4iLCJhdXRoX3RpbWUiOjE3MjA1MjM2MjksImV4cCI6MTcyMDUyMzkyOSwiaWF0IjoxNzIwNTIzNjI5LCJqdGkiOiI2ODVmYTgyZS1lNmYyLTRlYTMtODc5MC1iZjU1N2NkZGYxMDQiLCJ1c2VybmFtZSI6InRlc3QifQ.rEMJTBavrll4ksT3rayeQpIpVyUB0cgdeg8eKVbxg8pe2XACud5jjlWC-siLBl87C4SVP0zlt8ZS_23Ob9isbt5WD62VpouIVVFVQY9sG8KnnEp_mBGN18ZEJQxXUnOp5TPdW8lKQMxTvOpL1UzdhozwmDD4BqJP6vKErD_pQA1pbcP6r1TGyicR1wFD4uY9PUTAZvRNLh2VZ4YEUsNhvd7DH3xgqPSqjZFeYUhm7HIwXS8eDrhLdPXpYYPSHBz4GXws28XFJXSHn0PG_ZsMDFFA2hsexuK5MzK6JcSfm8lv_fgoLWpaHQypT_vPpevn6tDhUbJGE3cOI1uhSyg1Ow';
    SecretsManager.setSecret('authToken', token);
  });

 // useEffect(() => {
  //   const checkPasscode = async () => {
  //     // remove after testing
  //    //await SecretsManager.deleteSecret('userPasscode');
  //     // change to a user specific ID
  //     const savedPasscode = await SecretsManager.getSecret('userPasscode');
  //     // console.log(savedPasscode)
  //     if (!savedPasscode) {
  //       setIsFirstTime(true);
  //       console.log('without pc - isFirstTime: ' + isFirstTime)
  //       navigation.push('Passcode', {previousScreen: 'initialScreen'})
  //     } else if (savedPasscode && !isFirstTime){
  //       console.log('with pc - isFirstTime: ' + isFirstTime)
  //       //await checkWallet3s()
  //       navigation.replace('Passcode', {previousScreen: ''});
  //     }
  //   };
  //  checkPasscode();
  //  console.log('in useEffect, firstTime: ' + isFirstTime)
  // }, [isFirstTime]);
  

  const handleCreateWallet = async () => {
    setLoading(true);
    // Add checking exising wallet
    await createWallets();
    setLoading(false);
    // Passcode first (to be used for entropy) then
    navigation.replace('Mnemonics', {previousScreen: 'Initial'});
  };

  const handleImportWallet = () => {
    navigation.navigate('ImportWallet', {previousScreen: 'Initial'});
  };

  return (
    <View style={styles.gradientContainer}>
      <LinearGradient
        colors={['#6e0101', '#000000']}
        start={{x: 1, y: 0}}
        end={{x: 0, y: 0.7}}
        style={styles.gradientBackground}
      />
      <ScrollView contentContainerStyle={styles.container}>
        <Image
          source={require('../assets/WalletLogo.png')}
          style={styles.logo}
        />
        <Text style={styles.title}>Transaction Made Easy</Text>
        <Text style={styles.subtitle}>Buy, sell and exchange STOP Token.</Text>
        <TouchableOpacity
          style={[styles.button, styles.createWalletButton]}
          onPress={() => handleCreateWallet()}>
          <Text style={styles.createWalletButtonText}>Create Wallet</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.importWalletButton]}
          onPress={() => handleImportWallet()}>
          <Text style={styles.importWalletButtonText}>
            Add an existing wallet
          </Text>
        </TouchableOpacity>
        <Text style={styles.footerText}>
          By continuing, I agree to the{' '}
          <Text
            style={styles.link}
            onPress={() => console.log('TermsOfService')}>
            terms of service
          </Text>{' '}
          and consent to the{' '}
          <Text
            style={styles.link}
            onPress={() => console.log('PrivacyPolicy')}>
            privacy policy
          </Text>
          .
        </Text>
      </ScrollView>
    </View>
  );
};

const {width, height} = Dimensions.get('window');

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: width * 0.5,
    height: width * 0.5,
    resizeMode: 'contain',
    marginBottom: 25,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 26,
    color: 'grey',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  createWalletButton: {
    backgroundColor: '#FF2424',
  },
  createWalletButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  importWalletButton: {
    backgroundColor: 'transparent',
    borderColor: 'white',
    borderWidth: 1,
  },
  importWalletButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  footerText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
  },
  link: {
    color: '#FF0000',
    textDecorationLine: 'underline',
  },
});

export default InitialScreen;
