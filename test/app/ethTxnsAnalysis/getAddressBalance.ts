import dotenv from 'dotenv';
import { chainlink_simulateScrpt  } from "../../../common/chainlinkUtil"
import fs from "fs"
import path from "path"
import {
  ReturnType,decodeResult
} from "@chainlink/functions-toolkit"
import logger from "../../../common/logger"
import {arrayify} from "@ethersproject/bytes"
import { gWei2ETH } from "../../../common/blockChainUtil"

const txDetails_location = "../../../app/ethTxnsAnalysis/apiCall/addrBalance/addrBalance.js"



const analyze_fraud = async()=>{
    dotenv.config();

    const {ETHERSCAN_API_KEY} = process.env
    logger.info( path.resolve(__dirname, txDetails_location) )
    //trans details
    const txDetails_script = fs
    .readFileSync(path.resolve(__dirname, txDetails_location))
    .toString();
    const txDetails_args =["0x016ae8d297f7c3f164c891ac180e60fa1b109f08" ]
    const txDetails_secrets = {apiKey: ETHERSCAN_API_KEY }
    const returnType = ReturnType.uint256;
    logger.info("Start simulation...");

    //Simulation
    let reponse_txn = null

    const response = await chainlink_simulateScrpt( txDetails_script , txDetails_args, [], txDetails_secrets );
    logger.info(`Simulation result ${JSON.stringify(response) }`);
    const errorString = response.errorString;
    if (errorString) {
        logger.error(`❌ Error during simulation: `, errorString);
    } else {

        const responseBytesHexstring = response.responseBytesHexstring;

        const lengthOfStr = arrayify(responseBytesHexstring).length
        if ( lengthOfStr > 0) {
            logger.info( `Length of response : ${lengthOfStr}` )
            reponse_txn = decodeResult(
            response.responseBytesHexstring,
            returnType
            );
            logger.info(`Decoded response to ${returnType} `);

            //to eth
            reponse_txn =  gWei2ETH(reponse_txn);
        }   
    }
    logger.info( `Result: ${reponse_txn }` )
}


analyze_fraud();