
import {Common} from "@avalabs/avalanchejs"
import logger from "../../common/logger"
import {JsonRpcProvider} from "@ethersproject/providers"
import {Wallet } from "@ethersproject/wallet"
import { CL_FunctionConsumer } from "../../common/chainlinkUtil"
import {formatBytes32String} from "@ethersproject/strings"
import {
    ReturnType,
    decodeResult
} from "@chainlink/functions-toolkit" ;
import axios from "axios"

class CL_FunctionConsumerAVAX extends CL_FunctionConsumer{
    public async sendAxaxTxnRequest(
        encryptedSecretsUrls:string,
        secretSlotId: number,
        donHostedSecretsVersion:number,
        apiRequestBody:string[],
        gasLimit:number,
        chainlinkSubId:number,
        chainlinkDonId:string
    ){
        logger.info("Make chalinlink function API call...")

        const decodeSomething1 = decodeResult("0x1f6a65b6", ReturnType.uint256);
        const decodeSomething2 = decodeResult("0x1f6a65b6", ReturnType.string);
        const decodeSomething4 = decodeResult("0x1f6a65b6", ReturnType.uint);
        const decodeSomething3 = decodeResult("0x1f6a65b6", ReturnType.bytes);
        try{
            const donIdByte32 =  formatBytes32String(chainlinkDonId)
            const consumer = this.getFunctionsConsumer();

            logger.info(`Owner of the consumer: ${await consumer.owner()}`)
            const transaction = await consumer.sendRequest(
                encryptedSecretsUrls, 
                secretSlotId,
                donHostedSecretsVersion,
                chainlinkSubId
            );
            /*
            const transaction = await consumer.sendRequest(
                encryptedSecretsUrls, 
                secretSlotId,
                donHostedSecretsVersion,
                apiRequestBody,
                chainlinkSubId, 
                gasLimit,
                donIdByte32
            );
            */

            // Log transaction details
            logger.info( `\n✅ Functions request sent! Transaction hash ${transaction.hash}. Waiting for a response...` );

            logger.info( `See your request in the explorer ${ this.getExplorerUrl()}/tx/${transaction.hash}` );

            return transaction
        }catch(error){
            throw error;
        }
    }
    
}


const getRpcProvider = async (rpcUrl:string) =>{
    const rpcProvider = new JsonRpcProvider(rpcUrl);
    return rpcProvider;
}

const getWallet = async (privateKey: string)=>{
    return new Wallet(privateKey);
}

const getSigner = async (wallet:Wallet , rpcProvider: JsonRpcProvider)=>{
    return wallet.connect( rpcProvider);
}


const requestTxnListAvaCloud = async( address: string )=>{
    const {AVACLOUD_APIKEY, AVACLOUD_CHAINID, AVACLOUD_BASEURL } = process.env

    const headers = {
        'x-glacier-api-key': AVACLOUD_APIKEY,
        "Content-Type": "Application/json"
    }

    const requestUrl = `${AVACLOUD_BASEURL}/${AVACLOUD_CHAINID}/addresses/${address}/transactions?pageSize=100&sortOrder=asc` ;

    logger.info( "Start retriving txns list of wallet.")
    const response = await axios.get( requestUrl, {headers} )

    //check status
    let returnData = {}
    if( response.status == 200 ){
        return response.data.transactions
    }else{
        logger.error("Cannot retrieve trans list of address from avacloud.")
    }

    logger.info( "Finished retriving txns list of wallet.")
    return returnData
}

export {CL_FunctionConsumerAVAX, getRpcProvider, getWallet, getSigner, requestTxnListAvaCloud}
