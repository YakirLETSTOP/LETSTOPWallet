// src/utils/VeChainFetcher.ts
import * as thor from '@vechain/web3-providers-connex';
import Connex from '@vechain/connex';
import {ethers, BlockTag, FunctionFragment, getBytes} from 'ethers';
import {
  Fetcher,
  HistoricalTransaction,
  TransactionStatus,
  TransferTransaction,
} from '../types/interfaces';
import SecretsManager from './SecretsManager';
import {Transaction, secp256k1} from 'thor-devkit';
import {
  TransactionClause,
  TransactionUtils,
  clauseBuilder,
  networkInfo,
} from '@vechain/sdk-core';


class VeChainFetcher implements Fetcher {
  readonly name = 'VeChainFetcher';
  private testnetUrl: string;
  private thorClient;
  private vechainProvider: ethers.BrowserProvider;

  constructor() {
    this.testnetUrl = 'https://testnet.veblocks.net/';
    this.thorClient = new Connex.Thor({
      node: 'https://testnet.veblocks.net/',
      network: 'test',
    });
    // @ts-expect-warning
    this.vechainProvider = thor.ethers.modifyProvider(
      new ethers.BrowserProvider(
        new thor.Provider({
          connex: new Connex({
            node: this.testnetUrl,
            network: 'test',
          }),
        }),
      ),
    );

  }

  createWallet(seed: string) {
    // update provider with private key to get a signer later on
    return new ethers.Wallet(ethers.HDNodeWallet.fromSeed(seed).privateKey);
  }

  // async getPastTransactions(
  //   address: string,
  //   startBlock?: BlockTag,
  //   endBlock?: BlockTag,
  // ): Promise<any> {
  //   const txsFilter = this.thorClient.filter('transfer', [
  //     {sender: address},
  //     {recipient: address},
  //   ]);
  //   const txs = await txsFilter.apply(0, 100);
  //   const formatedTxns: HistoricalTransaction[] = [];
  //   txs.forEach(txn => {
  //     formatedTxns.push({
  //       blockchain: 'VeChain',
  //       transactionId: txn.meta.txID,
  //       timestamp: new Date(txn.meta.blockTimestamp * 1000)
  //         .toUTCString()
  //         .split(' ')
  //         .slice(0, 5)
  //         .join(' '),
  //       from: txn.sender,
  //       to: txn.recipient,
  //       value: parseFloat(ethers.formatEther(txn.amount)),
  //       tokenName: 'VET',
  //       tokenAddress: '0x4f6FC409e152D33843Cf4982d414C1Dd0879277e',
  //     });
  //   });
  //   console.log('vechain tx list: ' + JSON.stringify(formatedTxns));
  //   return formatedTxns;
  // }

  async getPastTransactions(
    address: string,
    tokenAddress?: string,
    tokenName?: string,
    startBlock?: BlockTag,
    endBlock?: BlockTag,
  ): Promise<HistoricalTransaction[]> {
   // console.log('In vechainFetcher trying to get history....')
    // const transferFilter = this.thorClient.filter('transfer', [
    //   { sender: address },
    //   { recipient: address },
    //   { asset: tokenAddress }
    // ]);
  
    // const txs = await txsFilter.apply(0, 100);
    // const formattedTxns: HistoricalTransaction[] = [];
  
    // for (const txn of txs) {
    //   const receipt = await this.thorClient.transaction(txn.meta.txID).getReceipt();
    //   const status = receipt!.reverted ? 'Reverted' : 'Confirmed';
  
    //   formattedTxns.push({
    //     blockchain: 'VeChain',
    //     transactionId: txn.meta.txID,
    //     timestamp: new Date(txn.meta.blockTimestamp * 1000)
    //       .toUTCString()
    //       .split(' ')
    //       .slice(0, 5)
    //       .join(' '),
    //     from: txn.sender,
    //     to: txn.recipient,
    //     value: parseFloat(ethers.formatEther(txn.amount)),
    //     tokenName: tokenName,
    //     tokenAddress: tokenAddress,
    //     status: status,
    //   });
    // }
  
    //console.log('VeChain tx list: ' + JSON.stringify(formattedTxns));
    return [{
      blockchain: 'VeChain',
      transactionId: '0x',
      timestamp: new Date().toISOString(),
      from: '0x',
      to: '0x',
      value: 0,
      tokenName: 'B3TR',
      tokenAddress: 'B3TR',
      status: TransactionStatus.FAILED,
    }]
  }
  
  async signTransaction(tx: TransferTransaction): Promise<any> {
    try {
      const vechainPrivKey = await SecretsManager.getSecret(
        'vechainPrivateKey',
      );
      const userAddress = new ethers.Wallet(vechainPrivKey!).address;
      // Define the desired function of the target contract
      const transferFromFragment = FunctionFragment.from(
        'transferFrom(address,address,uint256)',
      );
      // Define the clause for the txn
      const clauses: TransactionClause[] = [
        clauseBuilder.functionInteraction(
          '0x0000000000000000000000000000456E65726779',
          transferFromFragment,
          [userAddress, tx.recipientPublicAddress, tx.amount],
        ),
      ];
      const gas = TransactionUtils.intrinsicGas(clauses);
      const txBody = {
        // Test-net
        chainTag: networkInfo.testnet.chainTag,
        // After which block this tx should happen?
        // 16 characters of block ID.
        blockRef: '0x0000000000000000',
        // Expires after 30 days.
        expiration: 30 * 8640,
        // Clause defines which contract and function(s) to call
        clauses: clauses,
        gasPriceCoef: 0,
        gas: gas,
        dependsOn: null,
        nonce: '0xa3b6232f', // Random number
        // Must include this field to activate VIP-191.
        reserved: {
          features: 1,
        },
      };
      const signedTx = new Transaction(txBody);
      const userOriginHash = signedTx.signingHash(userAddress);
      signedTx.signature = secp256k1.sign(
        userOriginHash,
        Buffer.from(getBytes(vechainPrivKey!))
      );
     // console.log('User signed tx: ' + JSON.stringify(signedTx));
    //  console.log('Encoded user signed tx: ' + JSON.stringify(signedTx.encode()));
    } catch (e) {
      console.log(e);
    }
    return tx;
  }
  async getBalance(address: string): Promise<number> {
    // //console.log('Getting veChain balance...');
    // console.log('vechain address: ' + address);
    // try {
    //   // make more readable - change blockTag to latest
    //   const balance = await this.vechainProvider.getBalance(address);
    // //  console.log(balance);
    // //  console.log('vechain balance ' + parseFloat(ethers.formatEther(balance)));
    //   return parseFloat(ethers.formatEther(balance));
    // } catch (e) {
    //   console.log('vechain balance error', '\n', e);
    // }
    // // for now
    return Promise.resolve(0);
  }
}

export default VeChainFetcher;

/*

  const userAddress = new ethers.Wallet(vechainPrivKey!).address;
      const transferFromFragment = FunctionFragment.from(
        'transferFrom(address,address,uint256)',
      );
      const clauses: TransactionClause[] = [
        clauseBuilder.functionInteraction(
          '0x0000000000000000000000000000456E65726779',
          transferFromFragment,
          [userAddress, tx.recipient, tx.amount],
        ),
      ];
      console.log(JSON.stringify(clauses));
      const gas = TransactionUtils.intrinsicGas(clauses);
      // blockRef
      // expiration
      // gaspricecoef
      //dependsOn
      // nonce
      const body: TransactionBody = {
        chainTag: networkInfo.testnet.chainTag,
        // After which block this tx should happen?
        // 16 characters of block ID.
        blockRef: '0x0000000000000000',
        // Expires after 30 days. - change that to less (deadline)
        expiration: 30 * 8640,
        clauses,
        gasPriceCoef: 0,
        gas,
        dependsOn: null,
        // should be random
        nonce: 12345678,
        reserved: {
          features: 1,
        },
      };
      const txn = new Transaction(body);
      const signingHash =
      //console.log(vechainPrivKey!)
      console.log('veChain bytes: ' + getBytes(vechainPrivKey!).byteLength);
      const signedTransaction = TransactionHandler.sign(
        body,
        Buffer.from(getBytes(vechainPrivKey!)),
      );
      console.log('vechain txn: ')
      for (const [key, value] of Object.entries(signedTransaction)) {
        console.log(key + ' : ' + JSON.stringify(value) + '\n');



 */
