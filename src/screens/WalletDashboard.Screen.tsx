import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {useWallet} from '../contexts/WalletContext';
import {RootStackParamList} from '../Navigation';
import {StackScreenProps} from '@react-navigation/stack';
import {
  Credit,
  CreditAndToken,
  CreditDashboardAsset,
  Token,
  TokenDashboardAsset,
} from '../types/interfaces';
import {ASSETS} from '../assets';
import useCacheManager from '../hooks/useCacheManager';

type Props = StackScreenProps<RootStackParamList, 'WalletDashboard'>;

const WalletDashboardScreen: React.FC<Props> = ({navigation, route}) => {
  const {getBalance, loadSupportedAssets, getSupportedCredits} = useWallet();
  const [tokensD, isLoadingTokens, refreshTokensD, isRefreshingTokens] =
    useCacheManager<Token[]>(
      'dashboard-tokens',
      loadSupportedAssets,
      30 * 24 * 60 * 60 * 1000, // 30 days expiration
    );
  const [creditsD, isLoadingCredits, refreshCreditsD, isRefreshingCredits] =
    useCacheManager<Credit[]>(
      'dashboard-credits',
      getSupportedCredits,
      30 * 24 * 60 * 60 * 1000, // 30 days expiration
    );
  const [balances, isLoadingBalances, refreshBalances, isRefreshingBalances] =
    useCacheManager<{
      ethereumBalance: number;
      veChainBalance: number;
      solanaBalance: number;
    }>('dashboard-balances', getBalance, 1 * 60 * 1000); // 1 minutes expiration

  // const [tokensData, setTokensData] = useState<TokenDashboardAsset>({});
  // const [creditAndToken, setCreditToToken] = useState<CreditAndToken[]>([]);
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [isUserRefreshing, setIsUserRefreshing] = useState(false);

  // For testing ONLY!
  const refreshBalanceCounter = useRef(0);
  const refreshAllDataCounter = useRef(0);

  const {tokensData, creditAndToken} = useMemo(() => {
    if (!tokensD || !creditsD || !balances)
      return {tokensData: {}, creditAndToken: []};

    const tokenData: TokenDashboardAsset = {};
    const creditToken: CreditAndToken[] = [];

    for (const token of tokensD) {
      const balance =
        token.chain === 'solana'
          ? balances.solanaBalance
          : balances.veChainBalance;
      tokenData[token.name] = {
        id: token.id,
        address: token.address,
        name: token.name,
        chain: token.chain,
        amount: balance.toFixed(2),
        decimals: token.decimals ?? 9,
        symbol: token.symbol,
        usdValue: token.usdValue,
        icon: `data:image/png;base64,${token.icon}`,
      };
      const credit = creditsD.find(credit => credit.tokenName === token.symbol);
      if (credit) {
        //  console.log(credit.name + ' ' + credit.icon)
        creditToken.push({
          credit: credit,
          token: tokenData[token.name],
        });
      }
    }

    return {tokensData: tokenData, creditAndToken: creditToken};
  }, [tokensD, creditsD, balances]);

  useEffect(() => {
    //console.log('Setting up balance refresh interval');
    const interval = setInterval(() => {
      //console.log(`Refreshing balance (count: ${refreshBalanceCounter.current += 1})`);
      refreshBalances(); // This will force a refresh due to the 1-minute expiration
    }, 60 * 1000); // 1 minute
    return () => {
      //console.log('Clearing balance refresh interval');
      clearInterval(interval);
    };
  }, [refreshBalances]);

  const handleSwitchPair = useCallback(() => {
    // console.log(creditAndToken[currentPairIndex].credit)
    setCurrentPairIndex(prevIndex => (prevIndex + 1) % creditAndToken.length);
  }, [creditAndToken.length]);

  const refreshAllData = useCallback(() => {
    //console.log('refreshAllDataCounter: ' + (refreshAllDataCounter.current += 1))
    refreshTokensD();
    refreshCreditsD();
    refreshBalances();
  }, [refreshTokensD, refreshCreditsD, refreshBalances]);

  const handleUserRefresh = useCallback(async () => {
    setIsUserRefreshing(true);
    refreshAllData();
    setIsUserRefreshing(false);
  }, [refreshAllData]);

  const renderListEmptyComponent = () => {
    if (isLoading) {
      return <ActivityIndicator size="large" color="#FFF" />;
    }
    return <Text style={styles.headerTextContainer}>No assets found</Text>;
  };

  const isLoading = isLoadingTokens || isLoadingCredits || isLoadingBalances;
  const isRefreshing =
    isRefreshingTokens || isRefreshingCredits || isRefreshingBalances;
  //console.log(creditAndToken[currentPairIndex].credit.icon);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.greeting}>Hi, User</Text>
          <Text style={styles.welcomeBack}>Welcome Back</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('WalletSettings', {})}>
          <Image
            source={require('../assets/SettingsButton.png')}
            style={styles.settingsIcon}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.balanceContainer}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceAmount}>$17,200.52</Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.sendButton}
          onPress={() =>
            navigation.navigate('Transfer', {tokens: tokensD!})
          }>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.receiveButton}>
          <Text style={styles.receiveButtonText}>Receive</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buyButton}>
          <Text style={styles.buyButtonText}>Buy</Text>
        </TouchableOpacity>
      </View>

      <View>
        <View style={styles.convertHeader}>
          <Text style={styles.convertTitle}>Convert</Text>
          <TouchableOpacity onPress={handleSwitchPair}>
            <Image source={ASSETS.ConvertButton} />
          </TouchableOpacity>
        </View>
        {creditAndToken.length > 0 ? (
          <TouchableOpacity
            style={styles.convertSection}
            onPress={() =>
              navigation.navigate('Convert', {
                data: creditAndToken[currentPairIndex],
              })
            }>
            <View style={styles.convertContainer}>
              <View style={styles.convertItemContainer}>
                <Image
                  source={creditAndToken[currentPairIndex].credit.icon}
                  style={styles.icon}
                />
                <View style={styles.textContainer}>
                  <Text style={styles.convertItem}>
                    {creditAndToken[currentPairIndex].credit.name}
                  </Text>
                  <Text style={styles.convertItemSub}>Credit</Text>
                </View>
              </View>
              <View style={styles.convertItemContainer}>
                <Image
                  source={{uri: creditAndToken[currentPairIndex].token.icon}}
                  style={styles.icon}
                />
                <View style={styles.textContainer}>
                  <Text style={styles.convertItem}>
                    {creditAndToken[currentPairIndex].token.symbol}
                  </Text>
                  <Text style={styles.convertItemSub}>Token</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <ActivityIndicator color="#FFF" />
        )}
      </View>

      <View style={styles.assetsSection}>
        <View style={styles.assetsHeader}>
          <Text style={styles.assetsTitle}>Assets</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('WalletHistory', {tokens: tokensD!})}>
            <Image source={require('../assets/AssetsHamburgerMenu.png')} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={Object.values(tokensData)}
          keyExtractor={item => `${item.id}`}
          renderItem={({item}) => (
            <View style={{justifyContent: 'center'}}>
              <TouchableOpacity
                style={styles.assetItem}
                onPress={() =>
                  navigation.navigate('WalletHistory', {tokens: [item]})
                }>
                <View style={styles.assetInfo}>
                  <Image source={{uri: item.icon}} style={styles.assetIcon} />
                  <View style={styles.assetTextContainer}>
                    <Text style={styles.assetName}>{item.name}</Text>
                    <Text style={styles.convertItemSub}>{item.symbol}</Text>
                  </View>
                </View>
                <View style={styles.assetAmountContainer}>
                  <Text style={styles.assetAmount}>{item.amount}</Text>
                  <Text style={styles.assetValue}>
                    ${(+item.usdValue * +item.amount).toFixed(2)}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={isUserRefreshing}
              onRefresh={handleUserRefresh}
            />
          }
          ListEmptyComponent={renderListEmptyComponent}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  greeting: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  welcomeBack: {
    color: '#a1a1a1',
    fontSize: 14,
  },
  settingsIcon: {
    width: 24,
    height: 24,
  },
  balanceContainer: {
    backgroundColor: '#2c2c2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  balanceLabel: {
    color: '#a1a1a1',
    fontSize: 14,
  },
  balanceAmount: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sendButton: {
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    padding: 16,
    flex: 1,
    marginRight: 8,
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  receiveButton: {
    backgroundColor: '#3a3a3c',
    borderRadius: 8,
    padding: 16,
    flex: 1,
    marginRight: 8,
  },
  receiveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buyButton: {
    backgroundColor: '#3a3a3c',
    borderRadius: 8,
    padding: 16,
    flex: 1,
  },
  buyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  convertSection: {
    marginBottom: 20,
  },
  convertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  convertTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  convertContainer: {
    backgroundColor: '#2c2c2e',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  convertItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 30,
    height: 30,
    marginRight: 8,
  },
  arrowIcon: {
    width: 20,
    height: 20,
    tintColor: '#ff3b30',
  },
  textContainer: {
    flexDirection: 'column',
  },
  convertItem: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  convertItemSub: {
    color: '#8e8e93',
    fontSize: 12,
  },
  assetsSection: {
    marginBottom: 20,
  },
  assetsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  assetsTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  assetItem: {
    backgroundColor: '#2c2c2e',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  assetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20, // Add some space between the items
  },
  assetIcon: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  assetTextContainer: {
    flexDirection: 'column',
  },
  assetName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  assetAmountContainer: {
    alignItems: 'flex-end',
  },
  assetAmount: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  assetValue: {
    color: '#a1a1a1',
    fontSize: 14,
  },
});

export default WalletDashboardScreen;
