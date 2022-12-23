import { SigningCosmWasmClient } from 'secretjs';
import { StdFee } from 'secretjs/types/types';
import retry from 'async-await-retry';

import { URL } from 'url';

const { EnigmaUtils, Secp256k1Pen, pubkeyToAddress, encodeSecp256k1Pubkey, BroadcastMode } = require('secretjs');
const textEncoding = require('text-encoding');

const sleep = duration => new Promise(res => setTimeout(res, duration));

class secretJsService {
  public chainId: string = process.env.CHAIN_ID || 'secret-3';
  public restUrl: URL = new URL(process.env.SECRET_REST_URL);
  public mnemonic: string = process.env.MNEMONIC;
  public gasLimit: number = parseInt(process.env.GAS_LIMIT);
  public gasPrice: number = parseFloat(process.env.GAS_PRICE) || 0.25;
  public signingClient: SigningCosmWasmClient;
  public accAddress: string;
  public txEncryptionSeed = this.getTxEncryptionSeed();
  public customFees = {
    exec: {
      amount: [{ amount: (this.gasLimit * this.gasPrice).toString(), denom: 'uscrt' }],
      gas: this.gasLimit.toString(),
    },
  };

  constructor() {
    this.openClient();
  }

  public getTxEncryptionSeed() {
    if (process.env.EXEC_SEED) {
      return new TextEncoder().encode(process.env.EXEC_SEED);
    } else {
      EnigmaUtils.GenerateNewSeed();
    }
  }

  public async openClient(): Promise<void> {
    const signingPen = await Secp256k1Pen.fromMnemonic(this.mnemonic);
    const pubkey = encodeSecp256k1Pubkey(signingPen.pubkey);
    this.accAddress = pubkeyToAddress(pubkey, 'secret');

    const client = new SigningCosmWasmClient(
      this.restUrl.toString(),
      this.accAddress,
      signBytes => signingPen.sign(signBytes),
      this.txEncryptionSeed,
      this.customFees,
      BroadcastMode.Sync,
    );
    this.signingClient = client;
    console.log('Mnemonic Address: ' + this.accAddress);
  }

  public async runQuery(address: string, query: object) {
    try {
      return this.signingClient.queryContractSmart(address, query);
    } catch (error) {
      console.log(error);
    }
  }

  public async queryBalance(address = this.accAddress) {
    try {
      console.log(address);
      return await this.signingClient.getAccount(address);
    } catch (error) {
      console.log(error);
    }
  }

  public async executeContract(address: string, handleMsg: object, customFee: StdFee = undefined) {
    try {
      return this.signingClient.execute(address, handleMsg, '', [], customFee);
    } catch (error) {
      console.log(error);
      //throw new Error("Network Error");
    }
  }

  public async asyncExecute(address: string, handleMsg: object, customFee: StdFee = undefined) {
    let post;
    const key = Object.keys(handleMsg)[0];

    try {
      post = await this.signingClient.execute(address, handleMsg, '', [], customFee);
    } catch (e) {
      console.error(`failed to broadcast tx: ${e}`);
      throw `Failed to broadcast transaction ${e}`;
    }

    try {
      await sleep(5000);
      const res = await retry(
        () => {
          return this.signingClient.restClient.txById(post.transactionHash);
        },
        null,
        { retriesMax: 10, interval: 5000 },
      );

      return {
        ...res,
        transactionHash: post.transactionHash,
      };
    } catch (e) {
      const error = `Timed out while waiting for transaction ${e}`;
      throw error;
    }
  }

  public async txByID(hash: string): Promise<any> {
    try {
      return this.signingClient.restClient.txById(hash, true);
    } catch (error) {
      console.log(error);
    }
  }

  public async txsQuery(query: string): Promise<any> {
    try {
      const queryString = `${query}&limit=1&page=1`;
      const TRX_PER_PAGE = 5;

      return this.signingClient.restClient.txsQuery(queryString).then(response => {
        const totalTrxCount = parseInt(response.total_count);
        const pageNum = Math.ceil(totalTrxCount / TRX_PER_PAGE);
        // console.log('Found ' + totalTrxCount + ' trx, lastPage: ' + pageNum);

        return this.signingClient.restClient.txsQuery(`${query}&limit=${TRX_PER_PAGE}&page=${pageNum}`);
      });
    } catch (error) {
      console.log(error);
    }
  }
}

export default secretJsService;
