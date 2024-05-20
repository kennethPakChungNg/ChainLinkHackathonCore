import dotenv from 'dotenv';
import { chainlink_simulateScrpt  } from "../../../../common/chainlinkUtil"
import fs from "fs"
import path from "path"
import {
  ReturnType,decodeResult
} from "@chainlink/functions-toolkit"
import logger from "../../../../common/logger"
import {arrayify} from "@ethersproject/bytes"
import { gWei2ETH } from "../../../../common/blockChainUtil"

const txDetails_location = "../../../../app/avaxAnalysis/apiCall/txDetails/addrBalance.js"

const analyze_fraud = async()=>{
    dotenv.config();

    const {AVAX_API_BASE_URL} = process.env
    logger.info(`AVAX URL: ${AVAX_API_BASE_URL}`)
    logger.info( path.resolve(__dirname, txDetails_location) )
    //trans details
    const txDetails_script = fs
    .readFileSync(path.resolve(__dirname, txDetails_location))
    .toString();
    const txDetails_args =[AVAX_API_BASE_URL,"0x72e278E2220CecA0Ff95185Aa5E095A4E32e8E05" ]
    const txDetails_secrets = {}
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