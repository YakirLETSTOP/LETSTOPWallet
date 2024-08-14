// src/utils/GeneralBlockchainFetcher.ts
import {Buffer} from '@craftzdog/react-native-buffer';
import EthereumFetcher from './EthereumProvider';
import SolanaFetcher from './SolanaProvider';
import VeChainFetcher from './VeChainProvider';
import Crypto from 'react-native-quick-crypto';
import {
  HDNodeWallet,
  isAddress,
  ZeroAddress,
  LangEn,
  Wordlist,
  toUtf8Bytes,
  Mnemonic,
} from 'ethers';
import {
  HistoricalTransaction,
  Token,
  TransferTransaction,
} from '../types/interfaces';
import {Fetchers} from '../types/interfaces';
import {PublicKey} from '@solana/web3.js';
import SecretsManager from './SecretsManager';
import {derivePath} from 'ed25519-hd-key';
import Config from 'react-native-config';

class BlockchainFetcher {
  private readonly ethereumFetcher: EthereumFetcher;
  private readonly solanaFetcher: SolanaFetcher;
  private readonly veChainFetcher: VeChainFetcher;
  private readonly fetchers: Fetchers = {};
  private readonly solanaPath = `m/44'/501'/0'/0'`;
  private readonly veChainPath = `m/44'/818'/0'/0'`;
  constructor() {
    this.ethereumFetcher = new EthereumFetcher();
    this.solanaFetcher = new SolanaFetcher();
    this.veChainFetcher = new VeChainFetcher();
   // console.log(Config.SOLANA!);
   // console.log(Config.VECHAIN!);
    this.fetchers[Config.SOLANA!] = this.solanaFetcher;
    this.fetchers[Config.VECHAIN!] = this.veChainFetcher;
    this.fetchers['ethereum'] = this.ethereumFetcher;
    //console.log(Object.keys(this.fetchers))
  }

  generatePrivateKey() {
    let start = performance.now();
    // Fastest solution for now - need to find a way to integrate to ethers
    const cryptoPKey = '0x'.concat(Crypto.randomBytes(32).toString('hex'));
    let end = performance.now();
    // console.log(`QuickCrypto: ${end - start} ms`);
    // console.log(cryptoPKey);
    // start = performance.now();
    // const etheresPkey = ethers.Wallet.createRandom().privateKey;
    // end = performance.now();
    // console.log(`ethers: ${end - start} ms`);
    // console.log(etheresPkey);
    return cryptoPKey;
  }

  // password here should be he given passcode
  generateMnemonics(password: string = '', wordlist?: Wordlist) {
    password = '';
    if (password == null) {
      password = '';
    }
    if (wordlist == null) {
      wordlist = LangEn.wordlist();
    }
    // const mnemonics = Mnemonic.fromEntropy(
    //   Crypto.randomBytes(16),
    //   password,
    //   wordlist,
    // );
    // Only here for testing on testnet
    let mnemonic =
      'word concert palm federal satisfy dynamic figure athlete dinner position permit black';
    //console.log(mnemonics.phrase)
    return mnemonic; //s.phrase;
    //return mnemonics.phrase;
  }

  normalize(str: string) {
    return (str || '').normalize('NFKD');
  }

  getSeedFromMnemonics(mnemonics: string, password: string = '') {
    //password = '1234567890';
    const salt = toUtf8Bytes('mnemonic' + password, 'NFKD');
    //const salt = 'mnemonic' + password;
    const seed =
      `0x` +
      Buffer.from(
        Crypto.pbkdf2Sync(
          toUtf8Bytes(mnemonics, 'NFKD'),
          salt,
          2048,
          64,
          'SHA-512',
        ),
      ).toString('hex');
    // Create seed from mnemonics, add 0x for wallet creation standard and return the wallet's private key
    return seed;
  }

  async getBalances(
    ethereumAddress: string,
    veChainAddress: string,
    solanaAddress: string,
  ): Promise<{
    ethereumBalance: number;
    solanaBalance: number;
    veChainBalance: number;
  }> {
    try {
      //console.log('Fetching Ethereum balance...');
      const ethereumBalance = await this.fetchers['ethereum'].getBalance(ethereumAddress);
      //console.log('Ethereum balance fetched:', ethereumBalance);
  
     // console.log('Fetching Solana balance...');
      const solanaBalance = await this.fetchers[Config.SOLANA!].getBalance(solanaAddress);
     // console.log('Solana balance fetched:', solanaBalance);
  
    //  console.log('Fetching VeChain balance...');
      const veChainBalance = await this.fetchers[Config.VECHAIN!].getBalance(veChainAddress);
    //  console.log('VeChain balance fetched:', veChainBalance);
  
      const result = {
        ethereumBalance: Number(ethereumBalance) || 0,
        solanaBalance: Number(solanaBalance) || 0,
        veChainBalance: Number(veChainBalance) || 0,
      };
  
    //  console.log('All balances fetched successfully:', result);
      return result;
    } catch (error) {
      console.error('Error in getBalances:', error);
      throw error; // Re-throw the error to be caught in the WalletContext
    }
  }

  checkFetcher(token: string) {
    if (Object.hasOwn(this.fetchers, token)) {
      return token;
    }
    return false;
  }

  async getTokenHistory(token: Token, address: string) {
    //if (!address) return;
    try {
      return await this.fetchers[token.chain].getPastTransactions(address, token.address);
    } catch (e) {
      console.log(e);
    }
  }

  async getAllTokensHistory(addresses: string[][]) {
    //if (!addresses) return [];
    console.log('In bf trying to get history....');
    //console.log(JSON.stringify(addresses));
    const txList: HistoricalTransaction[] = [];
    try {
      // data[0] - user address to get past transactions, data[1] - Token address, data[2] - Chain Name
      for (const data of addresses) {
        txList.push(
          ...(await this.fetchers[data[2]].getPastTransactions(data[0], data[1])),
        );
      }
    } catch (e) {
      console.log(e);
    }
    return txList;
  }

  async createWallets(seed: string) {
    const hd = HDNodeWallet.fromSeed(seed);
    const solPathd = derivePath(this.solanaPath, seed.slice(2));
    // console.log('solPathd: ' + solPathd.key.toString('hex'));
    //const solSeed = Buffer.from(solPathd, 'hex').slice(0, 32);;
    //console.log('solSeed: ' + solSeed.byteLength)
    const derivedVeChainPKey = hd.derivePath(this.veChainPath).privateKey;
    //console.log(hd.derivePath(this.veChainPath).address);
    // Change to createWallet from seed
    const ethereumWallet = this.ethereumFetcher.createWallet(seed);
    //console.log('ethereum created!');
    const veChainWallet = this.veChainFetcher.createWallet(derivedVeChainPKey);
    // console.log('vechain created!');
    // console.log(solPathd.key.byteLength);
    const solanaWallet = this.solanaFetcher.createWallet(
      Buffer.from(solPathd.key),
    );
    // console.log('solana created!');
    // console.log('Wallets created!');
    await SecretsManager.setSecret('seed', seed);
    await SecretsManager.setSecret(
      'solanaSeed',
      solPathd.key.toString('base64'),
    );
    return {
      ethereumWallet,
      veChainWallet,
      solanaWallet,
    };
  }

  // Check is given address is valid and doesn't equal 0x0 (zero address)
  isValidRecipient = (recipient: string): boolean => {
    return (
      !!recipient &&
      recipient !== ZeroAddress &&
      (isAddress(recipient) ||
        PublicKey.isOnCurve(new PublicKey(recipient).toBytes()))
    );
  };

  async SignTransaction(txn: TransferTransaction) {
    // Change to tokens addresses
    const signedTx = await this.fetchers[txn.chain].signTransaction(txn);
    return signedTx ? signedTx : new Error(`Can't define transaction`);
  }

  async getSolanaUserTokenAddress(token: string, user: string) {
    return await this.solanaFetcher.getUserTokenAddress(token, user);
  }
}

export default BlockchainFetcher;
