
import { chainlink_simulateScrpt  } from "../../../../common/chainlinkUtil"
import fs from "fs"
import path from "path"
import {
  ReturnType,decodeResult
} from "@chainlink/functions-toolkit"
import dotenv from 'dotenv';
import {arrayify} from "@ethersproject/bytes"

const txDetails_location = "../../../../app/avaxAnalysis/apiCall/txDetails/txDetails.js"
import {txRequestPortion} from "../../../../app/avaxAnalysis/apiCall/txDetails/txDetails_config"

const analyze_fraud = async()=>{
    dotenv.config();
    const {AVAX_RPC_URL, AVAX_RPC_APIKEY} = process.env
    console.log( path.resolve(__dirname, txDetails_location) )
    //trans details
    const txDetails_script = fs
    .readFileSync(path.resolve(__dirname, txDetails_location))
    .toString();
    const txDetails_args =[ "0x7d5fda43e4a74c127f3aeb89caf6f7dfefc337d4fd0133d3b393545440b88710" ]

    //no key needed
    //const txDetails_secrets = {apiKey:AVAX_RPC_APIKEY}
    const txDetails_secrets = {}

    console.log("Start simulation...");

    //Simulation
    let reponse_txn = {}

    for ( const [key, value] of  Object.entries(txRequestPortion)  ){

      //base parameters + data want to retrieve
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