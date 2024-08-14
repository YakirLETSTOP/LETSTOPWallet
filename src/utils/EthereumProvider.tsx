import 'react-native-quick-crypto';
// // Import the crypto getRandomValues shim (**BEFORE** the shims)
// import 'react-native-get-random-values';
// // Import the the ethers shims (**BEFORE** ethers)
// import '@ethersproject/shims';
// // Import the ethers library
import {ethers, BlockTag} from 'ethers';
import {Fetcher, TransferTransaction} from '../types/interfaces';

class EthereumFetcher implements Fetcher {
  readonly name = 'EthereumFetcher';
  private readonly ethereumProvider = ethers.getDefaultProvider('sepolia');
  createWallet(seed: string) {
    return new ethers.Wallet(ethers.HDNodeWallet.fromSeed(seed).privateKey);
  }

  async getPastTransactions(
    address: string,
    startBlock?: BlockTag,
    endBlock?: BlockTag,
  ): Promise<any> {
    const params = {
      action: 'txlist',
      address,
      startblock: startBlock == null ? 0 : startBlock,
      endblock: endBlock == null ? 999999999999 : endBlock,
      sort: 'desc',
    };
    const txList = await new ethers.EtherscanProvider().fetch('account', params);
    console.log('Eth tx list: ' + txList);
    return txList;
  }
  signTransaction(
    txn: TransferTransaction
  ): Promise<any> {
    throw new Error('Method not implemented.');
  }
  async getBalance(address: string): Promise<number> {
    //console.log('Getting ethereum balance...');
    //console.log('proivder: ' + (await ethereumProvider.provider.getNetwork()).name)
    // try {
    //   const balance = await this.ethereumProvider.getBalance(address);
    //   // console.log(
    //   //   'ethereum balance ' + parseFloat(ethers.formatEther(balance)),
    //   // );
    //   return parseFloat(ethers.formatEther(balance));
    // } catch (e) {
    //   console.log(e);
    // }
    console.log('Ethereum getBalance')
    return Promise.resolve(0);
  }
}

export default EthereumFetcher;
