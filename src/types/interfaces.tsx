// src/utils/BlockchainFetcher.ts
import {
  ParsedTransactionMeta,
  ParsedTransaction,
  TransactionVersion,
  Keypair,
} from '@solana/web3.js';
import { Wallet } from 'ethers';
export interface Fetcher {
  name: string;
  getBalance(address: string): Promise<number>;
  getPastTransactions(address: string, tokenAddress: string): Promise<any>;
  signTransaction(txn: TransferTransaction): Promise<any>;
}

export interface Fetchers {
  [key: string]: Fetcher;
}

// src/types/Transaction.ts
export interface HistoricalTransaction {
  blockchain: 'Ethereum' | 'Solana' | 'VeChain';
  transactionId: string;
  timestamp: string;
  from: string;
  to: string;
  value: number;
  usdValue?: number;
  tokenName: string;
  tokenAddress: string;
  status: TransactionStatus;
  type?: string;
}

export interface TransferTransaction {
  user: string;
  token: string;
  amount: string;
  recipientPublicAddress: string;
  recipientTokenAddress: string;
  signature: string;
  type: TransactionType;
  recentBlockHash?: string;
  recentBlockHeight?: number;
  feePayer: string;
  chain: string;
}

export enum TransactionType {
  TRANSFER,
  CLAIM_CREDIT,
  CLAIM_TOKEN,
}

export interface ClaimTransaction {
  user: string;
  token: string;
  amount: number;
  type: TransactionType;
}

export interface veChainTransactionResponse {
  sender: string;
  recepient: string;
  amount: string;
  meta: {
    blockID: string;
    blockNumber: number;
    blockTimestamp: number;
    txID: string;
    txOrigin: string;
    clauseIndex: number;
  };
}

export interface solanaTransactionResponse {
  blockTime?: number | null;
  meta: ParsedTransactionMeta | null;
  slot: number;
  transaction: ParsedTransaction;
  version?: TransactionVersion;
}
export interface SolanaInstruction {
  programId: string;
  data: string; // Base58 encoded instruction data
  accounts: {
    pubkey: string;
    isSigner: boolean;
    isWritable: boolean;
  }[];
}

export interface TokenDashboardAsset {
  [key: string]: Token;
}

export interface Token {
  id: string;
  address: string;
  name: string;
  chain: string;
  amount: string;
  decimals?: number;
  symbol: string;
  usdValue: string;
  icon?: any;
}

export interface CreditDashboardAsset {
  [key: string]: Credit;
}

export interface Credit {
  id: string;
  name: string;
  tokenName: string;
  amount?: number;
  icon?: any;
}

export interface CreditAndToken {
  credit: Credit;
  token: Token;
}

export interface ChainToWallet {
  [key: string] : Wallet | Keypair;
}

export enum TransactionStatus {
  CONFIRMED = 'Confirmed',
  FAILED = 'Failed',
  PENDING = 'Pedning',
} 
