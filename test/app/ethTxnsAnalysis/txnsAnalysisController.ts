require('dotenv')
import { chainlink_simulateScrpt  } from "../../../common/chainlinkUtil"
import fs from "fs"
import path from "path"
import {
  ReturnType,decodeResult
} from "@chainlink/functions-toolkit"
import dotenv from 'dotenv';
import {arrayify} from "@ethersproject/bytes"

const txDetails_location = "../../../app/ethTxnsAnalysis/apiCall/txDetails/txDetails.js"
import {txRequestPortion} from "../../../app/ethTxnsAnalysis/apiCall/txDetails/txDetails_config"

const analyze_fraud = async()=>{
    dotenv.config();
    const {ETHERSCAN_API_KEY} = process.env
    console.log( path.resolve(__dirname, txDetails_location) )
    //trans details
    const txDetails_script = fs
    .readFileSync(path.resolve(__dirname, txDetails_location))
    .toString();
    const txDetails_args =["0xac5b774d41b63b03d1a9efa419d0c2423e1de231f87768f525f782cf6a8da8ca" ]
    const txDetails_secrets = {apiKey: ETHERSCAN_API_KEY }

    console.log("Start simulation...");

    //Simulation
    let reponse_txn = {}

    for ( const [key, value] of  Object.entries(txRequestPortion)  ){

      const response = await chainlink_simulateScrpt( txDetails_script , txDetails_args.concat(value), [], txDetails_secrets );
      console.log("Simulation result", response);
      const errorString = response.errorString;
      if (errorString) {
        console.log(`❌ Error during simulation: `, errorString);
      } else {
        const returnType = ReturnType.string;
        const responseBytesHexstring = response.responseBytesHexstring;
    
        const lengthOfStr = arrayify(responseBytesHexstring).length
        if ( lengthOfStr > 0) {
          console.log( `Length of response : ${lengthOfStr}` )
          const decodedResponse = decodeResult(
            response.responseBytesHexstring,
            returnType
          );
          console.log(`✅ Decoded response to ${returnType}: `);

          const jsonResponse = JSON.parse(decodedResponse.toString())
          reponse_txn = { ...reponse_txn , ...jsonResponse  }
        }
      }
    }

    console.log( `Conbined result: ${JSON.stringify(reponse_txn) }` )
}


analyze_fraud();