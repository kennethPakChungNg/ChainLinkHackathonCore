import fs from "fs"
import path from "path"
import logger from "../../common/logger"
import {
    CL_SubscriptionManager, 
    CL_secretsManager, 
    CL_FunctionConsumer,
    getDonSecretVersion
} from "../../common/chainlinkUtil"

import {ContractIssuer, gWei2ETH} from "../../common/blockChainUtil"
import {txRequestPortion} from "./apiCall/txDetails/txDetails_config"
import axios,{AxiosResponse } from 'axios';
import {requestTxnListAvaCloud} from "./avax_utils"
import { 
    ReturnType,
    decodeResult
} from "@chainlink/functions-toolkit"

import {
    requestDirectQuestion as analysisByOpenAI,
    rptPattern_transFraud,
    getPrompt_transFraud

} from "../../common/openAiUtils"
import {query as bitQuerySql} from "./apiCall/bitQuery/bitQuery"
import {getBitQueryData} from "../../common/bitQueryUtil"
import { CL_FunctionConsumerAVAX } from "./avax_utils"

import {CountdownLatch} from '../../common/threadControl'

const explorerUrl = "https://testnet.avascan.info/blockchain/c"
/**
 * 
 * @param transaction_hash Using Chainlink function to get txDetails from etherscan API
 * @returns 
 */
const getTxDetails_CL = async(transaction_hash: string)=>{
    try{
        const {AVAX_CONSUMER_ADDRESS,AVAX_API_BASE_URL,  AVAX_CHAINLINK_FUNCTION_ROUTER,
            AVAX_LINK_TOKEN_ADDRESS, AVAX_CHAINLINK_SUBID, AVAX_CHAINLINK_DONID, AVAX_RPC_URL,AVAX_RPC_APIKEY } = process.env;

        //ABI to call contract
        const consumerAbi = require("./apiCall/txDetails/AVA_FunctionsConsumer.json")

        //to connect wallet of contract owner
        const contractIssuer = new ContractIssuer(AVAX_RPC_URL);
        
        const rpcProvider = contractIssuer.getRpcProvider();
        const signer = contractIssuer.getSigner();

        const gasLimit = 300000;

        //secret id on chainlink
        const slotId = 0 ;
        
        //trans credentials ( e.g. : Api Key)
        const txDetails_secrets = {}

        //Upload secret to chainlink
        //let donHostedSecretsVersion = await getDonSecretVersion( signer, AVAX_CHAINLINK_FUNCTION_ROUTER, AVAX_CHAINLINK_DONID, txDetails_secrets, slotId, 15 );

        //////// ESTIMATE REQUEST COSTS ////////
        const cl_subManager = new CL_SubscriptionManager(signer, AVAX_CHAINLINK_FUNCTION_ROUTER , AVAX_CHAINLINK_SUBID, AVAX_LINK_TOKEN_ADDRESS, AVAX_CHAINLINK_DONID );
        await cl_subManager.init();

        // estimate costs in Juels
        await cl_subManager.estimateFunctionsRequestCost(gasLimit);
        

        //////// MAKE REQUEST ////////        
        //Define contract
        const consumerContract = new CL_FunctionConsumerAVAX(signer, AVAX_CONSUMER_ADDRESS, consumerAbi,explorerUrl  );

        //perform transaction to call etherscan api
        const essentialFields = ['from', 'to', 'value', 'gas']

        //perform transaction
        const functionCallTrans = await consumerContract.getFunctionsConsumer().sendRequest(
            Number(AVAX_CHAINLINK_SUBID),
            transaction_hash,
            essentialFields 
        );
        
        const response = await consumerContract.retrieveReponse(functionCallTrans.hash, rpcProvider, cl_subManager.getRouterAddress(), ReturnType.string );
        
        //to json
        const jsonResponse = JSON.parse(response.toString())

        return jsonResponse
    }catch(err){
        throw err;
    }
}

/**
 * Web2 approach to get trans detail
 * @param transaction_hash 
 * @returns 
 */
const getTxDetails = async( transaction_hash: string )=>{
    const {AVAX_API_BASE_URL} = process.env

    //directly call etherscan
    logger.info(`Get tx details of txns ${transaction_hash}`)

    const url = `${AVAX_API_BASE_URL}`
    /*
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    */
    const headers = {
        'Content-Type': 'application/json'
    }

    const requestBody = {
        "jsonrpc": "2.0",
        "id":1,
        "method": "eth_getTransactionByHash",
        "params": [
            transaction_hash
        ]
    }

    const response:AxiosResponse  = await axios.post( url,requestBody, {headers} );
    logger.info(`Received trans details of  ${transaction_hash}`)
    if ( response.data  != undefined && response.data != null ){
        logger.info( "Get response." ) 
        return response.data['result']
    }else{
        logger.error( "Cannot get response." )
        return {}
    }
}

const getWalletAnalysis = ( addressDetail: any ) =>{
    let time_diff_mins = null
    let min_value_received = null

    if ( addressDetail.length > 1 ){
        const first_tx_time = Number( addressDetail[0]['nativeTransaction']['blockTimestamp'] )
        const last_tx_time = Number( addressDetail[addressDetail.length-1]['nativeTransaction']['blockTimestamp'] )

        time_diff_mins = (last_tx_time-first_tx_time)/60
    }

    if (addressDetail.length >  0 ){
        min_value_received =  addressDetail.reduce((min, current) => {
            const currentValue = parseFloat(current['nativeTransaction']['value']);
            return currentValue < min ? currentValue : min;
        }, Infinity);
        
        //from Wei to ETH
        min_value_received = gWei2ETH(min_value_received)
    }

    return {
        time_diff_mins:time_diff_mins,
        min_value_received:min_value_received
    }
}

const getWalletBalance_CL = async( walletAddr: string ) =>{
    try{
        const {AVAX_CONSUMER_ADDRESS,AVAX_API_BASE_URL, AVAX_ROUTER_ADDRESS, AVAX_RPC_URL,
            AVAX_LINK_TOKEN_ADDRESS, AVAX_CHAINLINK_SUBID, AVAX_CHAINLINK_DONID, AVAX_CHAINLINK_FUNCTION_ROUTER } = process.env;
        
        const consumerAbi = require("../avaxAnalysis/apiCall/txDetails/AVA_FunctionsConsumer.json")

        logger.info( `Getting balance of address ${walletAddr} through chainlink service` )
        //use chainlink to fetch data from etherscan
        const contractIssuer = new ContractIssuer(AVAX_RPC_URL);
    
        const rpcProvider = contractIssuer.getRpcProvider();
        const signer = contractIssuer.getSigner();
    
        const gasLimit = 300000;
    
        //secret id on chainlink
        const slotId = 0 ;
    
        //trans details
        const txDetails_script = fs
        .readFileSync(path.resolve(__dirname, "./apiCall/txDetails/addrBalance.js"))
        .toString();
    
        const txDetails_secrets = {  }
            
        let donHostedSecretsVersion = 0 ;
        if ( Object.keys( txDetails_secrets ).length != 0 ){
            //secret manager
            const cl_secretsManager =  new CL_secretsManager(signer, AVAX_CHAINLINK_FUNCTION_ROUTER);
            await cl_secretsManager.init();
        
            const uploadResult = await cl_secretsManager.uploadSecretsToDON( txDetails_secrets, slotId , 15 ); 
        
            // fetch the reference of the encrypted secrets
            donHostedSecretsVersion = uploadResult.version; 
        }

        //////// ESTIMATE REQUEST COSTS ////////
        const cl_subManager = new CL_SubscriptionManager(signer, AVAX_CHAINLINK_FUNCTION_ROUTER,AVAX_CHAINLINK_SUBID, AVAX_LINK_TOKEN_ADDRESS, AVAX_CHAINLINK_DONID);
        await cl_subManager.init();
    
        // estimate costs in Juels
        await cl_subManager.estimateFunctionsRequestCost(gasLimit);
        
        //////// MAKE REQUEST ////////
        //Define contract
        const consumerContract = new CL_FunctionConsumer(signer, AVAX_CONSUMER_ADDRESS, consumerAbi,  explorerUrl );
    
        //perform transaction to call etherscan api
        const txDetails_args =[ AVAX_API_BASE_URL, walletAddr]
    
        const transaction = await consumerContract.sendRequest(
            txDetails_script,
            "0x",
            slotId,
            donHostedSecretsVersion,
            txDetails_args ,
            [],
            gasLimit,
            cl_subManager.getSubId(),
            cl_subManager.getDonId()
        );
        let response = await consumerContract.retrieveReponse(transaction.hash, rpcProvider, cl_subManager.getRouterAddress(), ReturnType.uint256 );
                
        //from wei to ETH
        const responseNum = gWei2ETH(Number(response))
    
        logger.info(`Received balance of address ${walletAddr}`)
        return {balance: responseNum } ; 
    }catch (error){
        logger.error( error.message )
        throw error;
    }
 
}



const getWalletBalance = async( walletAddr: string, useChainlink: boolean ) =>{
    if ( useChainlink ){
        logger.info(`Get balance of address ${walletAddr} using Chainlink function. `)
        return await getWalletBalance_CL(walletAddr)
    }
    const { AVAX_RPC_URL } = process.env

    const url = `${AVAX_RPC_URL}`
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    const requestBody = {
        "jsonrpc": "2.0",
        "id":1,
        "method": "eth_getBalance",
        "params": [
            walletAddr,
            "latest"
        ]
    }


    //directly call etherscan
    logger.info(`Get balance of address ${walletAddr}`)
    const response = await axios.post(url, requestBody, {headers});
    let balance = null;
    if ( response.status == 200 ){
        const decodedBalance= decodeResult(response.data['result'], ReturnType.uint256)
        balance = gWei2ETH( decodedBalance ) 
    }

    logger.info(`Received balance of address ${walletAddr}`)
    return {balance:balance};
}

const getWalletDtls = async( walletAddr:string, useChainlink: boolean, role: string ) =>{

    const addressDetail = await requestTxnListAvaCloud(walletAddr);
    if ( Object.keys(addressDetail).length != 0 ){

        const lastPageTrans = addressDetail.slice(-10 )

        const walletAnaData = getWalletAnalysis( addressDetail )
        const walletBalance = await getWalletBalance( walletAddr, useChainlink )

        const values = { 
            ...{
                "walletAddr": walletAddr,
                "walletAnaData":walletAnaData, 
                "lastPageTrans": lastPageTrans,
                "role": role
            } , 
            ...walletBalance   
        }

        return values
        
    }

    //default
    return {}

}

const openAi_analysisTransFraud = async(transaction_hash:string, txDetails:any,bitQueryDtl:any, senderInfo:any, receiverInfo:any ) =>{
    logger.info( " Generate prompt for trans fraud analysis. " )
    //get prompt
    const prompt_transFraud = getPrompt_transFraud(
        transaction_hash, 
        txDetails,
        bitQueryDtl,
        senderInfo,
        receiverInfo,
        "AVAX",
        "Avalanche"
    )

    const requestBody = {
        'model': 'gpt-4o',
        'messages': [
            {"role": "system", "content": prompt_transFraud},
            {"role": "user", "content": "Analyze the transaction"}
        ],
        'max_tokens': 600,
        'temperature': 0.5
    }

    //logger.info(`Prompt: ${prompt_transFraud} `)

    //call openAI API
    const analysisResult = await analysisByOpenAI(  prompt_transFraud, requestBody )

    let resultReport = {}
    const requiredContent = analysisResult['choices'][0]['message']['content']
    for (const [key, pattern] of Object.entries(rptPattern_transFraud)) {
        const match = requiredContent.match(pattern);
        if (match) {
            resultReport[key] = match[1].trim();
        }
      }

    return resultReport
}

const analyze_fraud = async(transaction_hash: string)=>{
    try{
        //Return format:   tx_details 
        const bitQueryDtl = await getBitQueryData( bitQuerySql, transaction_hash )

        const txDetails = await getTxDetails_CL(transaction_hash);
        
        const senderAddr = txDetails['from']
        const receiverAddr = txDetails['to']

        const useChainlinkService = false;
        const senderInfo = await getWalletDtls( senderAddr, useChainlinkService, "sender")    
        const receiverInfo = await getWalletDtls( receiverAddr, useChainlinkService, "to" )    


        //openai analysis
        const analysisResult = await openAi_analysisTransFraud(transaction_hash,txDetails, bitQueryDtl, senderInfo, receiverInfo);

        return analysisResult;

    }catch (error){
        logger.error( error.message);
        throw error;
    }

}

const getBitQueryDataCD = async(bitQuerySql, transaction_hash, countDownLatch:CountdownLatch ) =>{

    const data =  await getBitQueryData(bitQuerySql, transaction_hash )
    countDownLatch.countDown(data, 'bitQuery');
}

const getWalletDtlsCD = async( walletAddr, useChainlinkService, role, countDownLatch:CountdownLatch)=>{
    const data = await getWalletDtls( walletAddr, useChainlinkService, role);


    countDownLatch.countDown(data, role);
}    

const getTxnsCD = async( transaction_hash:string, countDownLatch: CountdownLatch, functionName )=>{
    const data = await getTxDetails_CL(transaction_hash);
    countDownLatch.countDown(data, functionName);
}

const analyzeFraudPerm = async(transaction_hash: string)=>{
    const totalJobs = 3;
    const latch = new CountdownLatch(totalJobs);

    const bitQueryDtl = await getBitQueryData( bitQuerySql, transaction_hash )
    const senderAddr =  bitQueryDtl['sender']['address']
    const receiverAddr = bitQueryDtl['to']['address']

    const useChainlinkService = false;
    getWalletDtlsCD( senderAddr, useChainlinkService, "sender", latch)    
    getWalletDtlsCD( receiverAddr, useChainlinkService, "to", latch)    
    getTxnsCD(transaction_hash, latch, 'txDetails'  );
    logger.info("waiting for results from mutiple data source.")
    await latch.wait();

    logger.info("Collected all data.")
    const countDownResults = latch.getResults();

    const txDetails= countDownResults['txDetails'];
    const senderInfo = countDownResults['sender']
    const receiverInfo = countDownResults['to']

    const analysisResult = await openAi_analysisTransFraud(transaction_hash,txDetails, bitQueryDtl, senderInfo, receiverInfo);

    return analysisResult;
}

export { analyze_fraud, getWalletDtls, analyzeFraudPerm }