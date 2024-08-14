// src/context/WalletContext.tsx
// src/context/WalletContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from 'react';
import {Keypair} from '@solana/web3.js';
import BlockchainFetcher from '../utils/BlockchainFetcher';
// import {Buffer} from 'react-native-quick-crypto';
import {Wallet} from 'ethers';
import {
  ChainToWallet,
  Credit,
  HistoricalTransaction,
  Token,
  TransactionType,
  TransferTransaction,
} from '../types/interfaces';
import SecretsManager from '../utils/SecretsManager';
import {Alert, Platform} from 'react-native';
import Config from 'react-native-config';
import {ASSETS} from '../assets';

type WalletContextType = {
  // remove mnemonics as a variable and store securely
  ethereumWallet: Wallet | null;
  veChainWallet: Wallet | null;
  solanaWallet: Keypair | null;
  createWallets: (password?: string) => Promise<void>;
  importWallets: (mnemonics: string) => Promise<void>;
  getBalance: () => Promise<{
    ethereumBalance: number;
    veChainBalance: number;
    solanaBalance: number;
  }>;
  getHistory: (tokens: Token[]) => Promise<HistoricalTransaction[]>;
  signTransaction: (
    user: string,
    recipient: string,
    token: string,
    amount: string,
    type: TransactionType,
    signature: string,
    chain: string,
  ) => Promise<TransferTransaction>;
  isValidRecipient: (recipient: string) => boolean;
  getSolanaUserTokenAddress: (token: string, user: string) => Promise<string>;
  loadSupportedAssets: () => Promise<Token[]>;
  getSupportedCredits: () => Promise<Credit[]>;
  logout: () => Promise<void>;
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{children: ReactNode}> = ({children}) => {
  const [bf] = useState(() => new BlockchainFetcher());
  const [ethereumWallet, setEthereumWallet] = useState<Wallet>({} as Wallet);
  const [veChainWallet, setVeChainWallet] = useState<Wallet>({} as Wallet);
  const [solanaWallet, setSolanaWallet] = useState<Keypair>({} as Keypair);
  const [chainToWallet, setChainToWallet] = useState({} as ChainToWallet);
  // const [supportedTokens, setSupportedTokens] = useState([] as Token[]);
  // const [supportedCredits, setSupportedCredits] = useState([] as Credit[]);

  const getSupportedCredits = async () => {
    //return CacheManager.getData('supportedCredits', async () => {
    try {
      // console.log('in getSupportedCredits');
      // Replace with actual API call if needed
      const credits = [
        {
          id: 'STOPCREDIT',
          name: 'LETSTOP',
          tokenName: 'STOP',
          amount: 0,
          icon: ASSETS.LETSTOPCredit,
        },
        {
          id: 'B3TERCREDIT',
          name: 'VeBetterDAO',
          tokenName: 'B3TR',
          amount: 0,
          icon: ASSETS.B3TRToken,
        },
      ];
      // console.log('credits: ' + credits);
      return credits;
    } catch (error) {
      console.error('Error fetching supported credits:', error);
      throw error;
    }
  }; //, 30 * 24 * 60 * 60 * 1000); // 30 days expiration
  //}, []);

  const getSolanaUserTokenAddress = async (token: string, user: string) => {
    return await bf.getSolanaUserTokenAddress(token, user);
  };

  const createWallets = async () => {
    console.log('Creating wallet...');
    loadSupportedAssets();
    let start = performance.now();
    //const pass = await SecretsManager.getSecret('userPasscode');
    const mnemonics = bf.generateMnemonics();
    let end = performance.now();
    // console.log(
    //   `Generating phrase took: ${end - start} ms, phrase: ${mnemonics}`,
    // );
    start = performance.now();
    const seed = bf.getSeedFromMnemonics(mnemonics);
    //console.log(seed.slice(2));
    end = performance.now();
    console.log('seed created, creating wallets...');
    // change to seed instead of private key
    // privat key will be retrieved from the created wallets
    const {ethereumWallet, veChainWallet, solanaWallet} =
      await bf.createWallets(seed);
    registerWallet(solanaWallet.publicKey.toBase58(), veChainWallet.address);
    // check if this a valid await (give some time to fetch answer from server)
    await SecretsManager.setSecret('mnemonics', mnemonics);
    setEthereumWallet(ethereumWallet);
    setVeChainWallet(veChainWallet);
    setSolanaWallet(solanaWallet);
    const chainzToWallet: ChainToWallet = {};
    // refactor to be dynamic
    chainzToWallet['solana'] = solanaWallet;
    chainzToWallet['vechain'] = veChainWallet;
    setChainToWallet(chainzToWallet);
  };

  const importWallets = async (mnemonics: string) => {
    const seed = bf.getSeedFromMnemonics(mnemonics);
    const {ethereumWallet, veChainWallet, solanaWallet} =
      await bf.createWallets(seed as string);
    loadSupportedAssets();
    await SecretsManager.setSecret('mnemonics', mnemonics);
    // add fail mechanism if wallet is invalid for save
    await registerWallet(
      solanaWallet.publicKey.toBase58(),
      veChainWallet.address,
    );
    setEthereumWallet(ethereumWallet);
    setVeChainWallet(veChainWallet);
    setSolanaWallet(solanaWallet);
  };

  const registerWallet = async (solAddress: string, vetAddress: string) => {
    const appWallet = {
      solanaAddress: solAddress,
      vechainAddress: vetAddress,
    };
    // Auth token of user
    const authToken =
      'Bearer eyJraWQiOiJNaTh6RWlvZWEydHVybmFmRHVvUmttcjhvUnZETTFxWElVUis2V0tFc25BPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiI4NGY4OTQyOC01MDQxLTcwOWQtZmQzYy0yNTI3MTllODEwNzkiLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAudXMtZWFzdC0xLmFtYXpvbmF3cy5jb21cL3VzLWVhc3QtMV8xOHNFb0pGZ0YiLCJjbGllbnRfaWQiOiI3NnI0MGozcGRpcjMxZXQ0cjl2Ym9ncGlnOCIsIm9yaWdpbl9qdGkiOiI3MzM3NTE0MS02ZTA3LTQxNzEtYTk4OC03NjVlZmMyOWJiMDkiLCJldmVudF9pZCI6Ijg4NjViZmYxLWNlOTAtNGNiMS1iYzBkLWUwZWJkY2E4ZTBkYyIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4iLCJhdXRoX3RpbWUiOjE3MjA1MjM2MjksImV4cCI6MTcyMDUyMzkyOSwiaWF0IjoxNzIwNTIzNjI5LCJqdGkiOiI2ODVmYTgyZS1lNmYyLTRlYTMtODc5MC1iZjU1N2NkZGYxMDQiLCJ1c2VybmFtZSI6InRlc3QifQ.rEMJTBavrll4ksT3rayeQpIpVyUB0cgdeg8eKVbxg8pe2XACud5jjlWC-siLBl87C4SVP0zlt8ZS_23Ob9isbt5WD62VpouIVVFVQY9sG8KnnEp_mBGN18ZEJQxXUnOp5TPdW8lKQMxTvOpL1UzdhozwmDD4BqJP6vKErD_pQA1pbcP6r1TGyicR1wFD4uY9PUTAZvRNLh2VZ4YEUsNhvd7DH3xgqPSqjZFeYUhm7HIwXS8eDrhLdPXpYYPSHBz4GXws28XFJXSHn0PG_ZsMDFFA2hsexuK5MzK6JcSfm8lv_fgoLWpaHQypT_vPpevn6tDhUbJGE3cOI1uhSyg1Ow';
    // from env
    const path =
      'https://jvc6gtf6s2.execute-api.us-east-1.amazonaws.com/prod/wallet/addWallet';
    // Platform.OS == 'android'
    //   ? 'http://10.0.2.2:3000/wallet/addWallet'
    //   : 'http://127.0.0.1:3000/wallet/addWallet';
    try {
      const response = await fetch(path, {
        method: 'POST',
        headers: {
          "x-api-key" : 'YcjrFCn9Mq7Je0frKR9PY2ulK57UZFeUaV0oyXw8',
          'Content-Type': 'application/json',
          Authorization: `${authToken}`,
        },
        body: JSON.stringify({wallet: appWallet}),
      });
      console.log('response ' + JSON.stringify(response));
      const responseData = await response.json();
      //console.log(JSON.stringify(response));
      if (response.status == 201) {
        console.log('Wallet registered successfully');
        //console.log(JSON.stringify(responseData));
      } else {
        console.log('Unable to register wallet');
      }
    } catch (e) {
      console.log(e);
    }
  };

  const isValidRecipient = (recipient: string) => {
    return bf.isValidRecipient(recipient);
  };

  const getBalance = useCallback(async () => {
    //console.log('getBalance called in WalletContext');
    if (ethereumWallet && veChainWallet && solanaWallet && bf) {
      // console.log('Fetching balance...');
      // console.log('Wallet addresses:', {
      //   ethereum: ethereumWallet.address,
      //   veChain: veChainWallet.address,
      //   solana: solanaWallet.publicKey.toBase58(),
      // });
      try {
        const balances = await bf.getBalances(
          ethereumWallet.address,
          veChainWallet.address,
          solanaWallet.publicKey.toBase58(),
        );
        // console.log('Got balances in context:', balances);
        return balances;
      } catch (error) {
        console.error('Error fetching balances:', error);
        return {ethereumBalance: 0, veChainBalance: 0, solanaBalance: 0};
      }
    } else {
      console.log('Wallets or bf not initialized:', {
        ethereumWallet: !!ethereumWallet,
        veChainWallet: !!veChainWallet,
        solanaWallet: !!solanaWallet,
        bf: !!bf,
      });
      return {ethereumBalance: 0, veChainBalance: 0, solanaBalance: 0};
    }
  }, [ethereumWallet, veChainWallet, solanaWallet, bf]);

  // Implement from bf - need to be more dynamic
  const getHistory = useCallback(
    async (tokens: Token[]) => {
      //  console.log('In walletContext trying to get history....');
      let isAddress = false;
      const txList: HistoricalTransaction[] = [];
      if (tokens.length == 1) {
        let address = '';
        switch (tokens[0].chain) {
          case Config.SOLANA!:
            address = (
              chainToWallet[tokens[0].chain] as Keypair
            ).publicKey.toBase58();
            isAddress = true;
            break;
          case Config.VECHAIN!:
            address = (chainToWallet[tokens[0].chain] as Wallet).address;
            isAddress = true;
            break;
          default:
            break;
        }
        if (address != '') {
          txList.push(...(await bf.getTokenHistory(tokens[0], address)));
        }
      }
      if (!isAddress) {
        //  console.log('chainToWallet: ' + JSON.stringify(chainToWallet));
        const historyData = (tokens: Token[]) => {
          const data = [];
          for (const token of tokens) {
            if (Config.SOLANA! == token.chain) {
              data.push([
                (chainToWallet[Config.SOLANA!] as Keypair).publicKey.toBase58(),
                token.address,
                token.chain,
              ]);
            } else if (Config.VECHAIN! == token.chain) {
              data.push([
                (chainToWallet[Config.VECHAIN!] as Wallet).address,
                token.address,
                token.chain,
              ]);
            }
          }
          return data;
        };

        const pastQueryData = historyData(tokens);
        if (!pastQueryData) {
          console.log('No tokens found!!!');
          return [];
        }
        txList.push(...(await bf.getAllTokensHistory(pastQueryData)));
      }
      // console.log('Got history on walletContext: ' + txList.length)
      return txList;
    },
    [chainToWallet, bf],
  );

  const signTransaction = async (
    user: string,
    recipient: string,
    token: string,
    amount: string,
    type: TransactionType,
    signature: string,
    chain: string,
  ) => {
    const txn: TransferTransaction = {
      amount: amount,
      recipientPublicAddress: recipient,
      recipientTokenAddress: '',
      token: token,
      type: type,
      user: user,
      signature: signature,
      recentBlockHash: '',
      feePayer: '',
      chain: chain,
    };
    // bf adds user address and signature
    const txWithSignature = await bf.SignTransaction(txn);
    return txWithSignature;
  };

  const loadSupportedAssets = useCallback(async () => {
    //return CacheManager.getData('supportedAssets', async () => {
    const authToken =
      'Bearer eyJraWQiOiJNaTh6RWlvZWEydHVybmFmRHVvUmttcjhvUnZETTFxWElVUis2V0tFc25BPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiI4NGY4OTQyOC01MDQxLTcwOWQtZmQzYy0yNTI3MTllODEwNzkiLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAudXMtZWFzdC0xLmFtYXpvbmF3cy5jb21cL3VzLWVhc3QtMV8xOHNFb0pGZ0YiLCJjbGllbnRfaWQiOiI3NnI0MGozcGRpcjMxZXQ0cjl2Ym9ncGlnOCIsIm9yaWdpbl9qdGkiOiI3MzM3NTE0MS02ZTA3LTQxNzEtYTk4OC03NjVlZmMyOWJiMDkiLCJldmVudF9pZCI6Ijg4NjViZmYxLWNlOTAtNGNiMS1iYzBkLWUwZWJkY2E4ZTBkYyIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4iLCJhdXRoX3RpbWUiOjE3MjA1MjM2MjksImV4cCI6MTcyMDUyMzkyOSwiaWF0IjoxNzIwNTIzNjI5LCJqdGkiOiI2ODVmYTgyZS1lNmYyLTRlYTMtODc5MC1iZjU1N2NkZGYxMDQiLCJ1c2VybmFtZSI6InRlc3QifQ.rEMJTBavrll4ksT3rayeQpIpVyUB0cgdeg8eKVbxg8pe2XACud5jjlWC-siLBl87C4SVP0zlt8ZS_23Ob9isbt5WD62VpouIVVFVQY9sG8KnnEp_mBGN18ZEJQxXUnOp5TPdW8lKQMxTvOpL1UzdhozwmDD4BqJP6vKErD_pQA1pbcP6r1TGyicR1wFD4uY9PUTAZvRNLh2VZ4YEUsNhvd7DH3xgqPSqjZFeYUhm7HIwXS8eDrhLdPXpYYPSHBz4GXws28XFJXSHn0PG_ZsMDFFA2hsexuK5MzK6JcSfm8lv_fgoLWpaHQypT_vPpevn6tDhUbJGE3cOI1uhSyg1Ow';
    const path =
      Platform.OS == 'android'
        ? 'http://10.0.2.2:3000/wallet/assets'
        : 'http://127.0.0.1:3000/wallet/assets';
    try {
      const response = await fetch(path, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${authToken}`,
        },
      });
      const responseData = await response.json();
      if (response.status == 200) {
        //  console.log('Assets retrieved successfully');
      } else {
        console.log('Unable to retrieve assets');
      }
      //@ts-ignore
      const formatted = responseData.map(({_id: id, ...rest}) => ({
        id,
        ...rest,
      }));
      return formatted as Token[];
    } catch (err) {
      console.error('Error fetching supported assets:', err);
      throw err;
    }
    //}, 30 * 24 * 60 * 60 * 1000); // 30 days expiration
  }, []);

  const logout = async () => {
    console.log('Logout');
  };

  const contextValue = useMemo(
    () => ({
      ethereumWallet,
      veChainWallet,
      solanaWallet,
      createWallets,
      importWallets,
      getBalance,
      getHistory,
      signTransaction,
      isValidRecipient,
      getSolanaUserTokenAddress,
      loadSupportedAssets,
      getSupportedCredits,
      logout,
    }),
    [
      ethereumWallet,
      veChainWallet,
      solanaWallet,
      createWallets,
      importWallets,
      getBalance,
      getHistory,
      signTransaction,
      isValidRecipient,
      getSolanaUserTokenAddress,
      loadSupportedAssets,
      getSupportedCredits,
      logout,
    ],
  );

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context || context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  //console.log(JSON.stringify(context.getBalance.toString()))
  return context;
};
