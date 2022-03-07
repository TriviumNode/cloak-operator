import { NextFunction, Request, Response } from 'express';
import { CloakReleaseMessage } from '@interfaces/cloak.interface';
import secretJsService from '@services/secretjs.service';
import { StdFee } from 'secretjs/types/types';
import { AnyRecord } from 'dns';
import isValidAddress from 'utils/isValidAddress'

const textEncoding = require('text-encoding');
const TextDecoder = textEncoding.TextDecoder;

class CloakController {
  public secretjsService = new secretJsService();
  public contractAddress: string = process.env.CLOAK_ADDR;

  public cloakRelease = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      let txkey;
      let sender;

      //accept data via GET or POST
      if (req.query.txkey) {
        txkey = req.query.txkey?.toString().trim();
        sender = req.query.sender?.toString().trim();
      } else {
        //txkey = req.body;
      }

      //verify input
      if (!txkey || txkey.length !== 64) {
        throw({message:"Invalid TX Key"})
      }
      if (!sender || !isValidAddress(sender)) {
        throw({message:"Invalid Recipient Address"})
      }

     //query to make sure the key is valid so we dont waste gas 
      const query = {
        get_exists : {
          tx_key: txkey
        }
      }
      
      const queryResult = await this.secretjsService.runQuery(this.contractAddress, query);
      if (!queryResult.exists) {
        throw({message:'There are no pending transactions with this key.'})
      }

      //execute the finalize handle
      const handle: CloakReleaseMessage = {
        finalize_seed: {
          tx_key: txkey,
          sender: sender
        },
      };

      const handleResponse = await this.secretjsService.asyncExecute(this.contractAddress, handle);
      res.status(200).json(handleResponse);

    } catch (error) {
      console.log(error);
      next(error);
    }
  };
}

export default CloakController;
