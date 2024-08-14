import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ListRenderItem,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  StatusBar,
  Image,
  Linking,
  Alert,
} from 'react-native';
import {useWallet} from '../contexts/WalletContext';
import {HistoricalTransaction} from '../types/interfaces';
import {RootStackParamList} from '../Navigation';
import {StackScreenProps} from '@react-navigation/stack';
import {ASSETS, AssetsKey} from '../assets';
import useCacheManager from '../hooks/useCacheManager';
import Config from 'react-native-config';
import InAppBrowser from 'react-native-inappbrowser-reborn';

type Props = StackScreenProps<RootStackParamList, 'WalletHistory'>;
// TODO - add mechanism to fetch transactions by last transaction's block for efficiency
// TODO - persist the transactions on screen - only present fresh data AFTER loading (silent loading)
const WalletHistoryScreen: React.FC<Props> = ({navigation, route}) => {
  const whichKey =
    route.params.tokens.length == 1 ? route.params.tokens[0].id : 'all';
  const cacheKey = useMemo(() => `transactions-${whichKey}`, [whichKey]);
  const {getHistory} = useWallet();
  const [transactions, isLoading, refreshTransactions, isRefreshing] =
    useCacheManager<HistoricalTransaction[]>(
      cacheKey,
      useCallback(() => getHistory(route.params.tokens), [route.params.tokens]),
      5 * 60 * 1000, // 1 minutes cache expiration
    );

  const processedTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions.map(transaction => ({
      ...transaction,
      //icon: getTokenIcon(transaction.tokenName),
    }));
  }, [transactions]);

  const [selectedTransaction, setSelectedTransaction] =
    useState<HistoricalTransaction | null>(null);


  // Modify the onRefresh handler
  const handleRefresh = useCallback(() => {
    if (!isRefreshing) {
      refreshTransactions();
    }
  }, [refreshTransactions, isRefreshing]);

  useEffect(() => {
    console.log('Processed Transactions:', processedTransactions.length);
    console.log('Is Loading:', isLoading);
    console.log('Is Refreshing:', isRefreshing);
  }, [processedTransactions, isLoading, isRefreshing]);

  // replace with token data?
  const getTokenIcon = (token: string) => {
    const key: AssetsKey = (token + 'Token') as AssetsKey;
    return ASSETS[key];
  };
  
  // Add copy mechanism
  const truncateString = (str: string | undefined) => {
    if (!str) return;
    // Captures 0x + 4 characters, then the last 4 characters.
    const truncateRegex = /^(0x[a-zA-Z0-9]{4})[a-zA-Z0-9]+([a-zA-Z0-9]{4})$/;
    const truncated = str.match(truncateRegex);
    if (!truncated)
      return `${str.slice(0, 4).concat('...').concat(str.slice(-4))}`;
    return `${truncated[1]}…${truncated[2]}`;
  };

  const handleViewOnScan = async (txId: string | undefined) => {
    if (!txId) return;
    console.log(txId);
    const url = `${Config.SOLSCAN_URL!}/tx/${txId}?cluster=testnet`;
    // const inAppBrowse = await InAppBrowser.isAvailable();
    // console.log(inAppBrowse)
    try {
      Alert.alert(
        'Redirected to SolScan',
        `Are you sure you want to leave to SolScan?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              return;
            },
          },
          {text: 'OK', onPress: () => handleBrowsing(url)},
        ],
      );
    } catch (e) {
      console.log(`Couldn't open this Tx link...`);
    }
  };

  const handleBrowsing = async (url: string) => {
    if (await InAppBrowser.isAvailable()) {
      await InAppBrowser.open(url, {
        // iOS Properties
        dismissButtonStyle: 'cancel',
        preferredBarTintColor: 'black',
        preferredControlTintColor: 'black',
        readerMode: false,
        animated: true,
        modalPresentationStyle: 'fullScreen',
        modalTransitionStyle: 'coverVertical',
        modalEnabled: true,
        enableBarCollapsing: false,
        // Android Properties
        showTitle: true,
        toolbarColor: 'black',
        secondaryToolbarColor: 'black',
        navigationBarColor: 'black',
        navigationBarDividerColor: 'black',
        enableUrlBarHiding: true,
        enableDefaultShare: true,
        forceCloseOnRedirection: false,
        // Specify full animation resource identifier(package:anim/name)
        // or only resource name(in case of animation bundled with app).
        animations: {
          startEnter: 'slide_in_right',
          startExit: 'slide_out_left',
          endEnter: 'slide_in_left',
          endExit: 'slide_out_right',
        },
        headers: {
          'my-custom-header': 'my custom header value',
        },
      });
    } else if (await Linking.canOpenURL(url)) {
      await Linking.openURL(url);
    }
  };

  const renderTransaction: ListRenderItem<HistoricalTransaction> = ({item}) => (
    <View>
      <View style={styles.dateStatusContainer}>
        <Text style={styles.date}>{item.timestamp}</Text>
        <View style={styles.statusContainer}>
          <View style={styles.statusIcon}>
            <Image
              source={
                item.type === 'Received' ? ASSETS.ReceivedTxn : ASSETS.SentTxn
              }
              style={styles.txnStateIcon}
            />
          </View>
          <View style={styles.statusTextContainer}>
            <Text
              style={[
                styles.status,
                styles[item.status.toLowerCase() as keyof typeof styles],
              ]}>
              {item.status}
            </Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={styles.transactionContainer}
        onPress={() => setSelectedTransaction(item)}>
        <Image source={getTokenIcon(item.tokenName)} style={styles.tokenIcon} />
        <View style={styles.tokenInfo}>
          <Text style={styles.tokenSymbol}>{item.tokenName}</Text>
        </View>
        <View style={styles.amountInfo}>
          <Text style={styles.tokenAmount}>{item.value}</Text>
          <Text style={styles.tokenValue}>${item.usdValue}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <Text style={styles.title}>Transfer History</Text>
        {isLoading && !transactions ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : transactions && transactions.length > 0 ? (
          <FlatList
            data={processedTransactions}
            renderItem={renderTransaction}
            keyExtractor={item => item.transactionId}
            contentContainerStyle={styles.listContainer}
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
        ) : (
          <View style={styles.noTransactionsContainer}>
            <Text style={styles.noTransactionsText}>
              No transactions available.
            </Text>
          </View>
        )}
      </View>
      <Modal
        visible={!!selectedTransaction}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedTransaction(null)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedTransaction(null)}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              Sent {selectedTransaction?.tokenName} Token
            </Text>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Status</Text>
              <Text
                style={[
                  styles.modalValue,
                  styles[
                    selectedTransaction?.status.toLowerCase() as keyof typeof styles
                  ],
                ]}>
                {selectedTransaction?.status}
              </Text>
              <Text style={styles.modalDate}>
                {selectedTransaction?.timestamp}
              </Text>
            </View>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>From</Text>
              <Text style={styles.modalValue}>
                {truncateString(selectedTransaction?.from)}
              </Text>
            </View>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>To</Text>
              <Text style={styles.modalValue}>
                {truncateString(selectedTransaction?.to)}
              </Text>
            </View>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Transacation ID</Text>
              <Text style={styles.modalValue}>
                {truncateString(selectedTransaction?.transactionId)}
              </Text>
            </View>
            <View style={styles.modalAmountContainer}>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Amount</Text>
                <Text style={styles.modalValue}>
                  {selectedTransaction?.value} {selectedTransaction?.tokenName}
                </Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>USD Value</Text>
                <Text style={styles.modalValue}>
                  {selectedTransaction?.usdValue}
                </Text>
              </View>
              <View style={[styles.modalRow, styles.modalTotal]}>
                <Text style={styles.modalLabel}>Total amount</Text>
                <Text style={styles.modalValue}>
                  {100} {selectedTransaction?.tokenName}
                </Text>
                <Text style={styles.modalUsdValue}>{100 * 0.15} $</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.viewOnEtherscanButton}
              onPress={() =>
                handleViewOnScan(selectedTransaction?.transactionId)
              }>
              {/* Need to change this to be more dynamic and support multiple scans  */}
              <Text style={styles.viewOnEtherscanText}>View on SolScan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 16,
    alignContent: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    paddingBottom: 16,
  },
  dateStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  date: {
    color: '#8E8E93',
    fontSize: 14,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusTextContainer: {
    backgroundColor: '#1C1C1E',
    paddingVertical: 4,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  statusIcon: {
    width: 26,
    height: 26,
    marginRight: 6,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    //overflow: 'hidden',
  },
  txnStateIcon: {
    width: '80%',
    height: '80%',
    resizeMode: 'contain',
  },
  status: {
    fontSize: 14,
    //fontWeight: 'bold',
    color: '#34C759', // Adjust color based on status
  },
  transactionContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12, // Rounded corners to match the design
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8, // Adjust the margin as needed
  },
  tokenIcon: {
    width: 32, // Adjust the size as needed
    height: 32,
    marginRight: 12, // Add space between the icon and the token info
  },
  tokenInfo: {
    flex: 1,
  },
  tokenSymbol: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  amountInfo: {
    alignItems: 'flex-end',
  },
  tokenAmount: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tokenValue: {
    color: '#8E8E93',
    fontSize: 14,
  },
  confirmed: {
    color: '#4CD964',
  },
  // finalized: {
  //   color: '#4CD964',
  // },
  pending: {
    color: '#FF9500',
  },
  failed: {
    color: '#FF3B30',
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  icon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  tokenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalLabel: {
    color: '#8E8E93',
    fontSize: 14,
  },
  modalValue: {
    color: '#fff',
    fontSize: 14,
  },
  modalDate: {
    color: '#8E8E93',
    fontSize: 12,
  },
  modalAmountContainer: {
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  modalTotal: {
    borderTopWidth: 1,
    borderTopColor: '#3A3A3C',
    paddingTop: 8,
    marginTop: 8,
  },
  modalUsdValue: {
    color: '#8E8E93',
    fontSize: 14,
  },
  viewOnEtherscanButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  viewOnEtherscanText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noTransactionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noTransactionsText: {
    color: '#8E8E93',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default WalletHistoryScreen;

// // src/screens/WalletHistoryScreen.tsx
// import React, { useEffect, useState } from 'react';
// import { View, Text, FlatList, StyleSheet, ListRenderItem, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
// import { useWallet } from '../contexts/WalletContext';
// import { HistoricalTransaction } from '../types/interfaces';
// import { RootStackParamList } from '../Navigation';
// import { StackScreenProps } from '@react-navigation/stack';

// type Props = StackScreenProps<RootStackParamList, 'WalletHistory'>;

// const WalletHistoryScreen: React.FC<Props> = ({ navigation, route }) => {
//   const { getHistory } = useWallet();
//   const { ethereumWallet, veChainWallet, solanaWallet } = useWallet();
//   const [transactions, setTransactions] = useState<HistoricalTransaction[] | null>(null);
//   const [loading, setLoading] = useState<boolean>(false);
//   const [selectedTransaction, setSelectedTransaction] = useState<HistoricalTransaction | null>(null);

//   useEffect(() => {
//     const loadTransactions = async () => {
//       setLoading(true);
//       const history = await getHistory(route.params.token!);
//       console.log(JSON.stringify(history));
//       const hist = history ? history : null;
//       setTransactions(hist);
//       setLoading(false);
//     };
//     loadTransactions();
//   }, []);

//   const renderTransaction: ListRenderItem<HistoricalTransaction> = ({ item }) => {
//     const isReceived =
//       item.to === ethereumWallet!.address ||
//       item.to === veChainWallet!.address ||
//       item.to === solanaWallet!.publicKey.toBase58();
//     return (
//       <TouchableOpacity style={styles.transactionContainer} onPress={() => setSelectedTransaction(item)}>
//         <View style={styles.rowContent}>
//           <Text style={styles.date}>{item.timestamp}</Text>
//           <View style={styles.tokenInfo}>
//             <Text style={styles.tokenSymbol}>{item.tokenName}</Text>
//             <Text style={styles.tokenAmount}>{item.value}</Text>
//             <Text style={styles.tokenValue}>15,000 USD</Text> {/* Placeholder value */}
//           </View>
//           <View style={styles.statusWrapper}>
//             <Text style={[styles.status, /*styles[item.status.toLowerCase()]*/]}>{item.status}</Text>
//             {isReceived ? (
//               <Text style={styles.inArrow}>↓</Text>
//             ) : (
//               <Text style={styles.outArrow}>↑</Text>
//             )}
//           </View>
//         </View>
//       </TouchableOpacity>
//     );
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Transactions History</Text>
//       {loading ? (
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#0000ff" />
//         </View>
//       ) : transactions?.length === 0 ? (
//         <View style={styles.noTransactionsContainer}>
//           <Text style={styles.noTransactionsText}>No transactions available.</Text>
//         </View>
//       ) : (
//         <FlatList
//           data={transactions}
//           renderItem={renderTransaction}
//           keyExtractor={item => item.transactionId}
//         />
//       )}
//       {selectedTransaction && (
//         <Modal visible={true} transparent={true} onRequestClose={() => setSelectedTransaction({} as HistoricalTransaction)}>
//           <View style={styles.modalContainer}>
//             <View style={styles.modalContent}>
//               <Text style={styles.modalTitle}>Sent {selectedTransaction.tokenName} Token</Text>
//               <Text style={styles.modalDate}>Date: {selectedTransaction.timestamp}</Text>
//               <Text style={styles.modalFrom}>From: {selectedTransaction.from}</Text>
//               <Text style={styles.modalTo}>To: {selectedTransaction.to}</Text>
//               <Text style={styles.modalAmount}>Amount: {selectedTransaction.value} {selectedTransaction.tokenName}</Text>
//               <TouchableOpacity onPress={() => setSelectedTransaction({} as HistoricalTransaction)}>
//                 <Text style={styles.closeButton}>Close</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </Modal>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 16,
//     backgroundColor: '#000',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#fff',
//     marginBottom: 16,
//   },
//   transactionContainer: {
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#333',
//   },
//   rowContent: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   date: {
//     color: '#fff',
//   },
//   tokenInfo: {
//     flexDirection: 'column',
//     alignItems: 'flex-start',
//   },
//   tokenSymbol: {
//     color: '#fff',
//     fontWeight: 'bold',
//   },
//   tokenAmount: {
//     color: '#fff',
//   },
//   tokenValue: {
//     color: '#fff',
//   },
//   statusWrapper: {
//     flexDirection: 'column',
//     alignItems: 'flex-end',
//   },
//   status: {
//     fontWeight: 'bold',
//   },
//   confirmed: {
//     color: 'green',
//   },
//   pending: {
//     color: 'orange',
//   },
//   failed: {
//     color: 'red',
//   },
//   inArrow: {
//     color: 'green',
//   },
//   outArrow: {
//     color: 'red',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   noTransactionsContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   noTransactionsText: {
//     fontSize: 18,
//     color: '#999',
//   },
//   modalContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.8)',
//   },
//   modalContent: {
//     width: '80%',
//     backgroundColor: '#333',
//     padding: 16,
//     borderRadius: 8,
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#fff',
//   },
//   modalDate: {
//     color: '#fff',
//   },
//   modalFrom: {
//     color: '#fff',
//   },
//   modalTo: {
//     color: '#fff',
//   },
//   modalAmount: {
//     color: '#fff',
//   },
//   closeButton: {
//     marginTop: 16,
//     color: 'blue',
//     textAlign: 'center',
//   },
// });

// export default WalletHistoryScreen;
