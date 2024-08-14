// src/utils/SolanaFetcher.ts
import {
  Connection,
  PublicKey,
  clusterApiUrl,
  Keypair,
  Transaction,
  ParsedInstruction,
  ParsedTransactionWithMeta,
  PartiallyDecodedInstruction,
} from '@solana/web3.js';
import {
  Fetcher,
  SolanaInstruction,
  TransactionStatus,
  TransactionType,
} from '../types/interfaces';

import {HistoricalTransaction, TransferTransaction} from '../types/interfaces';
import {
  TOKEN_PROGRAM_ID,
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddress,
  transfer,
} from '@solana/spl-token';
import SecretsManager from './SecretsManager';
import {Buffer} from '@craftzdog/react-native-buffer';

//const BN = require('bn.js');

//change to mainnet
const solanaConnection = new Connection(clusterApiUrl('testnet'), 'confirmed');

class SolanaFetcher implements Fetcher {
  readonly name = 'SolanaFetcher';
  readonly NATIVE_SOL_MINT = new PublicKey(
    'So11111111111111111111111111111111111111111',
  );
  createWallet(seed: Buffer) {
    //seed = Buffer.from('3edx69n4vUgVomkWo9FqhdbXxYA1noYkjpDSg6UB3MhpuUvh37eQeXjmQG5TCDrrJDHL7FnxyGoruMQyzi9LYeg4')
    //console.log(seed.byteLength);
    try {
      const privateKeyBytes = seed; //Buffer.from(seed, 'hex')
      const keypair = Keypair.fromSeed(privateKeyBytes);
      //console.log(bs58.encode(keypair.secretKey));
      //console.log(keypair.publicKey.toBase58());
      if (!PublicKey.isOnCurve(keypair.publicKey.toBytes())) {
        throw new Error('Failed to create Solana wallet');
      }
      return keypair;
    } catch (e) {
      console.log(e);
    }
    return Keypair.generate();
  }
  //      signatures.forEach((sig) => console.log('sig: ' + sig.signature + '\n'))

  // Invastigate where the received txn are
  async getPastTransactions(
    address: string,
    tokenAddress: string,
  ): Promise<HistoricalTransaction[]> {
    const formattedTxns: HistoricalTransaction[] = [];
    const userPubKey = new PublicKey(address);
    const tokenPubKey = new PublicKey(tokenAddress);
    const userTokenAddress = await getAssociatedTokenAddress(
      tokenPubKey,
      userPubKey,
    );

    try {
      // Refactor to support continous fetch, after validating cached transactions
      const signatures = await solanaConnection.getSignaturesForAddress(
        userTokenAddress,
        {limit: 30},
      );

      signatures.forEach(sig => console.log('sig: ' + sig.signature + '\n'));

      for (const sig of signatures) {
        try {
          const txn = await solanaConnection.getParsedTransaction(
            sig.signature,
            {
              maxSupportedTransactionVersion: 0,
            },
          );

          const instruction = this.getValidTransferInstruction(txn);
          if (!instruction) continue;

          const {source, destination, amount, tokenAddress} =
            this.getTransferInfo(instruction, txn);
          if (!source || !destination || !amount || !tokenAddress) continue;

          // Skip if the token is SOL - might be redundant, because we query on userTokenAddress, not main address
          // if (tokenAddress.equals(this.NATIVE_SOL_MINT)) continue;
          // console.log(source)
          // console.log(destination)
          const originalSource = (await getAccount(solanaConnection, new PublicKey(source))).owner.toBase58();
          const originalDestination = (await getAccount(solanaConnection, new PublicKey(destination))).owner.toBase58();
          // console.log('original source: ' + originalSource);
          // console.log('original destination: ' + originalDestination)
          const isOutgoing = originalSource === address;
          const from = isOutgoing ? address : originalSource;
          const to = isOutgoing ? originalDestination : address;

          const tokenName = await this.getTokenInfo(tokenAddress.toString());
          const usdValue = await this.getUSDValue(
            tokenAddress.toString(),
            amount / 1e9,
          );
          const txnDirection = from == address ? 'Sent' : 'Received';
         //console.log('txnType: ' + txnDirection)
          formattedTxns.push({
            blockchain: 'Solana',
            transactionId: sig.signature,
            timestamp: this.formatTimestamp(txn!.blockTime),
            from,
            to,
            value: amount / 1e9,
            status:
              txn!.meta?.err == null
                ? TransactionStatus.CONFIRMED
                : TransactionStatus.FAILED,
            tokenName,
            tokenAddress: tokenAddress.toString(),
            usdValue,
            type: txnDirection ,
          });

          console.log('Inserting another solana txn: ' + sig.signature);
        } catch (error) {
          console.error(
            `Error processing transaction ${sig.signature}:`,
            error,
          );
        }
      }
    } catch (error) {
      console.error('Error fetching past transactions:', error);
    }

    return formattedTxns;
  }

  // parseTokenTransfers(txn: ParsedTransactionWithMeta, userAddress: string): Array<{
  //   from: string,
  //   to: string,
  //   amount: number,
  //   tokenAddress: PublicKey
  // }> {
  //   const transfers: Array<{from: string, to: string, amount: number, tokenAddress: PublicKey}> = [];

  //   if (!txn.meta || !txn.meta.postTokenBalances || !txn.meta.preTokenBalances) return transfers;

  //   const accountKeys = txn.transaction.message.accountKeys.map(key => key.pubkey.toString());
  //   const userIndex = accountKeys.indexOf(userAddress);

  //   if (userIndex === -1) return transfers;

  //   for (let i = 0; i < txn.meta.postTokenBalances.length; i++) {
  //     const postBalance = txn.meta.postTokenBalances[i];
  //     const preBalance = txn.meta.preTokenBalances.find(pb => pb.accountIndex === postBalance.accountIndex);

  //     if (!preBalance) continue;

  //     const balanceDiff = (postBalance.uiTokenAmount.uiAmount || 0) - (preBalance.uiTokenAmount.uiAmount || 0);

  //     if (balanceDiff !== 0) {
  //       const isUserAccount = postBalance.accountIndex === userIndex;
  //       transfers.push({
  //         from: balanceDiff < 0 ? accountKeys[postBalance.accountIndex] : (isUserAccount ? userAddress : 'unknown'),
  //         to: balanceDiff > 0 ? accountKeys[postBalance.accountIndex] : (isUserAccount ? userAddress : 'unknown'),
  //         amount: Math.abs(balanceDiff),
  //         tokenAddress: new PublicKey(postBalance.mint)
  //       });
  //     }
  //   }

  //   return transfers;
  // }

  // Get past transaction Helper functions
  getValidTransferInstruction(
    txn: ParsedTransactionWithMeta | null,
  ): ParsedInstruction | PartiallyDecodedInstruction | null {
    if (!txn || !txn.meta) return null;

    const instructions = txn.transaction.message.instructions;

    for (const instr of instructions) {
      if ('parsed' in instr && instr.parsed) {
        if (
          instr.parsed.type === 'transfer' ||
          instr.parsed.type === 'transferChecked'
        ) {
          return instr;
        }
      } else if ('info' in instr && instr.info) {
        if (JSON.stringify(instr.info).includes('transfer')) {
          return instr;
        }
      }
    }

    return null;
  }

  getTransferInfo(
    instruction: ParsedInstruction | PartiallyDecodedInstruction,
    txn: ParsedTransactionWithMeta | null,
  ): {
    source?: string;
    destination?: string;
    amount?: number;
    tokenAddress?: PublicKey;
  } {
    if ('parsed' in instruction) {
      if (
        instruction.parsed.type === 'transfer' ||
        instruction.parsed.type === 'transferChecked'
      ) {
        const tokenAddress = txn?.meta?.postTokenBalances?.[0]?.mint
          ? new PublicKey(txn.meta.postTokenBalances[0].mint)
          : this.NATIVE_SOL_MINT;
         // console.log('Transfer info source: ' + instruction.parsed.info.source);
         // console.log('Transfer info destination: ' + instruction.parsed.info.destination);
        return {
          source: instruction.parsed.info.source, // || instruction.parsed.info.authority,
          destination: instruction.parsed.info.destination,
          amount:
            instruction.parsed.info.amount ||
            instruction.parsed.info.tokenAmount?.amount,
          tokenAddress,
        };
      }
    }
    // Handle PartiallyDecodedInstruction if needed
    return {};
  }

  // async getFromAndTo(
  //   address: string,
  //   source: string,
  //   destination: string,
  //   tokenAddress: string,
  //   solanaConnection: Connection,
  // ): Promise<{from: string; to: string}> {
  //   const userPubKey = new PublicKey(address);
  //   const tokenPubKey = new PublicKey(tokenAddress);
  //   const recipientPubKey = new PublicKey(destination);

  //   const userTokenAddress = await getAssociatedTokenAddress(
  //     tokenPubKey,
  //     userPubKey,
  //   );
  //   const recipientTokenAddress = await solanaConnection.getParsedAccountInfo(
  //     recipientPubKey,
  //   );

  //   const recipient =
  //     recipientTokenAddress.value?.data &&
  //     'parsed' in recipientTokenAddress.value.data
  //       ? recipientTokenAddress.value.data.parsed.info.owner
  //       : '';

  //   if (source === userTokenAddress.toBase58()) {
  //     return {from: address, to: recipient};
  //   } else {
  //     return {from: recipient, to: address};
  //   }
  // }

  getTransactionType(
    instruction: ParsedInstruction | PartiallyDecodedInstruction,
  ): string {
    if ('parsed' in instruction) {
      return instruction.parsed.type;
    }
    // Handle PartiallyDecodedInstruction if needed
    return '';
  }

  formatTimestamp(blockTime: number | null | undefined): string {
    const date = blockTime ? new Date(blockTime * 1000) : new Date();
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  // async getPastTransactions(address: string): Promise<HistoricalTransaction[]> {
  //   console.log('In solFetcher trying to get history....');
  //   //console.log(address);
  //   const txns = []
  //   const publicKey = new PublicKey(address);

  //   const signatures = await solanaConnection.getSignaturesForAddress(
  //     publicKey,
  //     {
  //       limit: 20, // Change limit?
  //     },
  //   );

  //   const formattedTxns: HistoricalTransaction[] = [];

  //   for (const sig of signatures) {
  //     try {
  //       const txn = await solanaConnection.getParsedTransaction(sig.signature, {
  //         maxSupportedTransactionVersion: 0,
  //       });

  //       if (!txn || !txn.meta) continue;

  //       const timestamp = txn.blockTime
  //         ? new Date(txn.blockTime * 1000)
  //         : new Date();

  //       // Look for token balance changes
  //       const tokenBalanceChanges = txn.meta.postTokenBalances
  //         ?.map((postBalance, index) => {
  //           const preBalance = txn.meta?.preTokenBalances?.[index];
  //           if (preBalance && postBalance.mint === preBalance.mint) {
  //             return {
  //               mint: postBalance.mint,
  //               owner: postBalance.owner,
  //               amount: (
  //                 BigInt(postBalance.uiTokenAmount.amount) -
  //                 BigInt(preBalance.uiTokenAmount.amount)
  //               ).toString(),
  //               decimals: postBalance.uiTokenAmount.decimals,
  //             };
  //           }
  //           return null;
  //         })
  //         .filter(change => change !== null && change.amount !== '0');

  //       for (const change of tokenBalanceChanges || []) {
  //         if (!change) continue;
  //         txns.push(txn);
  //         const tokenInfo = await this.getTokenInfo(change.mint);
  //         const value = Number(change.amount) / Math.pow(10, change.decimals);
  //         const usdValue = await this.getUSDValue(change.mint, Math.abs(value));
  //         const info = this.getSourceAndDestination(txn);
  //         //console.log('info: ' + JSON.stringify(info));
  //         if (!info) continue;
  //         formattedTxns.push({
  //           blockchain: 'Solana',
  //           transactionId: sig.signature,
  //           timestamp: timestamp.toUTCString().split(' ').slice(0, 5).join(' '),
  //           from: info.source,
  //           to: info.destination,
  //           value: Math.abs(value),
  //           status:
  //             sig.confirmationStatus === 'finalized'
  //               ? 'Confirmed'
  //               : sig.confirmationStatus || 'Pending',
  //           tokenName: tokenInfo.symbol || 'Unknown',
  //           tokenAddress: change.mint,
  //           usdValue: +usdValue.toFixed(2),
  //           type: value < 0 ? 'Sent' : 'Received',
  //         });
  //       }
  //     } catch (error) {
  //       console.error('Error processing transaction:', error);
  //     }
  //   }
  //   console.log('TXNSZ: ' + JSON.stringify(txns))
  //   formattedTxns.filter(
  //     (x, ind, self) =>
  //       ind ===
  //       self.findIndex(t => {
  //         t.transactionId === x.transactionId;
  //       }),
  //   );
  //   //console.log('Solana tx list:', JSON.stringify(formattedTxns));
  //   return formattedTxns;
  // }

  // getSourceAndDestination(txn: ParsedTransactionWithMeta) {
  //   for (const tx of txn.transaction.message.instructions) {
  //     if ('parsed' in tx) {
  //       if (tx.parsed.type == 'transfer') {
  //         return tx.parsed.info;
  //         // console.log(inf.source);
  //         // console.log(inf.destination);
  //       }
  //     }
  //   }
  // }
  // Helper function to get token info
  async getTokenInfo(mintAddress: string): Promise<string> {
    // Implement token info fetching logic here
    // You can use a token list or query a token registry
    let symbol = 'STOP';
    return symbol; // Placeholder
  }

  // Helper function to get USD value
  async getUSDValue(mintAddress: string, amount: number): Promise<number> {
    // Implement price fetching logic here
    // You can use a price feed API or oracle
    return amount * 0.15; // Placeholder
  }

  async signTransaction(txn: TransferTransaction): Promise<any> {
    try {
      const solanaSeed = await SecretsManager.getSecret('solanaSeed');
      const userKeypair = Keypair.fromSeed(Buffer.from(solanaSeed!, 'base64'));
      // console.log('Creating txn with: ' + userKeypair.publicKey.toBase58());
      // replace with token after testing
      //console.log('Initializing token mint address');
      const tokenMintAddress = new PublicKey( //txn.token
        'AAygeQg1Hirtt7V5dNaYLLup1E45ZGxgNWhyRSvUJ4fW',
      );
      // Create a transaction from client to recipient
      // change to take from env
      txn.feePayer = 'Dy6cR9z4iDZfZDbgkcgciMrNCqJob8MVx1Wje14QmqHv';
      txn.user = userKeypair.publicKey.toBase58();
      //console.log('Initializing payerPubKey')
      const payerPubKey = new PublicKey(txn.feePayer);
      //console.log('Initializing userPubKey')
      const userPubKey = new PublicKey(txn.user);
      // console.log('userPubKey ' + userPubKey.toBase58());
      //console.log('Initializing recipientPubKey')
      const recipientPubKey = new PublicKey(txn.recipientPublicAddress);
      const senderTokenAccount = await getAssociatedTokenAddress(
        tokenMintAddress,
        userPubKey,
      );

      const recipientTokenAccount = await getAssociatedTokenAddress(
        tokenMintAddress,
        recipientPubKey,
      );

      const transferInstruction = createTransferInstruction(
        senderTokenAccount,
        recipientTokenAccount,
        userPubKey,
        // Replace with the amount of tokens to transfer
        BigInt(+txn.amount * 1e9), // Amount of tokens to transfer
        [],
      );
      //  console.log('Adding transaction....');
      const transaction = new Transaction().add(transferInstruction);
      //  console.log('Transaction added....');
      transaction.recentBlockhash = (
        await solanaConnection.getLatestBlockhash('confirmed')
      ).blockhash;
      // console.log('Blockhash: ' + transaction.recentBlockhash);
      transaction.feePayer = payerPubKey;
      //console.log('Partially signing transaction....');
      // generate signer
      transaction.partialSign(userKeypair);
      //console.log('Transaction partially signed....');
      //console.log('Initializing transferRequest with the following: ');
      // console.log(`
      // user: ${senderTokenAccount.toString() ?? 'missing'},
      // token: ${tokenMintAddress.toBase58()},
      // amount: ${(+txn.amount).toString() ?? 'missing'},
      // recipientPubKey: ${recipientPubKey.toBase58() ?? 'missing'},
      // recipientTokenAddress: ${recipientTokenAccount.toBase58() ?? 'missing'}
      // signatures: ${JSON.stringify(transaction.signatures[1]) ?? 'missing'},
      // type: ${TransactionType.TRANSFER ?? 'missing'},
      // recentBlockHash: ${transaction.recentBlockhash ?? 'missing'},
      // feePayer: ${transaction.feePayer!.toString() ?? 'missing'},
      // `);
      // console.log('Initializing request....');
      const transferRequest: TransferTransaction = {
        user: txn.user,
        token: tokenMintAddress.toBase58(),
        amount: BigInt(+txn.amount).toString(),
        recipientPublicAddress: recipientPubKey.toBase58(),
        recipientTokenAddress: recipientTokenAccount.toBase58(),
        signature: transaction.signatures[1].signature!.toString('base64'), // turn to
        type: TransactionType.TRANSFER,
        recentBlockHash: transaction.recentBlockhash,
        feePayer: transaction.feePayer!.toString(),
        chain: txn.chain,
      };
      //console.log('request: ' + JSON.stringify(transferRequest));
      return transferRequest;
    } catch (e) {
      console.log(e);
      throw Error('Failed building transaction');
    }
  }

  async getUserTokenAddress(token: string, user: string) {
    const tokenPubKey = new PublicKey(token);
    const userTokenPubKey = new PublicKey(user);
    return (
      await getAssociatedTokenAddress(tokenPubKey, userTokenPubKey)
    ).toBase58();
  }

  async getBalance(address: string): Promise<number> {
    console.log('Getting Solana balance...');
    const userPublicKey = new PublicKey(address);
    // Add a check instead of print to make sure querying for balance is possible
    // console.log('isOnCurve: ' + PublicKey.isOnCurve(userPublicKey.toBytes()));
    // take from env
    const tokenAddress = 'AAygeQg1Hirtt7V5dNaYLLup1E45ZGxgNWhyRSvUJ4fW';
    const tokenPublicKey = new PublicKey(tokenAddress);
    try {
      const userTokenAccount = await getAssociatedTokenAddress(
        tokenPublicKey,
        userPublicKey,
      );
      const balance = +(
        await solanaConnection.getTokenAccountBalance(userTokenAccount)
      ).value.amount;
      console.log('balance: ' + balance);
      //console.log('UI balance: ' + balance / 1e9);
      // console.log('solana balance ' + balance);
      return balance / 1e9; // Convert lamports to SOL
    } catch (e) {
      console.log('solana error' + e);
    }
    return new Promise(() => 0);
  }
}

export default SolanaFetcher;
