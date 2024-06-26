import fs from "fs"
import path from "path"
import logger from "../../common/logger"
import {
    CL_SubscriptionManager, 
    CL_secretsManager, 
    CL_FunctionConsumer
} from "../../common/chainlinkUtil"

import {ContractIssuer, gWei2ETH} from "../../common/blockChainUtil"
import {txRequestPortion} from "../ethTxnsAnalysis/apiCall/txDetails/txDetails_config"
import axios,{AxiosResponse } from 'axios';

import {query as bitQuery} from "../ethTxnsAnalysis/apiCall/bitQuery/bitQuery"
import { ReturnType, decodeResult } from "@chainlink/functions-toolkit"
import {getPrompt_transFraud, rptPattern_transFraud} from "../ethTxnsAnalysis/apiCall/openAi/openAi_transFraud"
import {requestDirectQuestion as analysisByOpenAI} from "../../common/openAiUtils"
import { getTxnByHash } from "../../common/etherScanUtil"
import { BigNumber } from "@ethersproject/bignumber";


const explorerUrl = "https://sepolia.etherscan.io"

/**
 * 
 * @param transaction_hash Using Chainlink function to get txDetails from etherscan API
 * @returns 
 */
const getTxDetails_CL = async(transaction_hash: string)=>{
    try{
        const {ETH_SEPOLIA_routerAddress, ETH_subscriptionId, ETH_linkTokenAddress, ETH_donId, ETH_CONSUMER_CONTRACT_ADDRESS} = process.env
        //use chainlink to fetch data from etherscan
        const contractIssuer = new ContractIssuer(ETH_SEPOLIA_routerAddress);
        
        const rpcProvider = contractIssuer.getRpcProvider();
        const signer = contractIssuer.getSigner();

        const gasLimit = 300000;

        //secret id on chainlink
        const slotId = 0 ;

        //trans details
        const txDetails_script = fs
        .readFileSync(path.resolve(__dirname, "./apiCall/txDetails/txDetails.js"))
        .toString();
        const consumerAbi = require("../contract/ETH_FunctionsConsumer.json")
        const txDetails_secrets = {apiKey: process.env.ETHERSCAN_API_KEY }

        //////// ESTIMATE REQUEST COSTS ////////
        const cl_subManager = new CL_SubscriptionManager(signer, ETH_SEPOLIA_routerAddress, ETH_subscriptionId, ETH_linkTokenAddress, ETH_donId );
        await cl_subManager.init();

        // estimate costs in Juels
        await cl_subManager.estimateFunctionsRequestCost(gasLimit);
        
        //////// MAKE REQUEST ////////

        //secret manager
        const cl_secretsManager =  new CL_secretsManager(signer, ETH_SEPOLIA_routerAddress );
        await cl_secretsManager.init();

        const uploadResult = await cl_secretsManager.uploadSecretsToDON( txDetails_secrets, slotId , 15 ); 

        // fetch the reference of the encrypted secrets
        const donHostedSecretsVersion = uploadResult.version; 
        
        //Define contract
        const consumerContract = new CL_FunctionConsumer(signer, ETH_CONSUMER_CONTRACT_ADDRESS, consumerAbi, explorerUrl );

        //perform transaction to call etherscan api
        const txDetails_args =[transaction_hash]

        //Call txDetails partially
        let reponse_txn = {}

        for ( const [key, value] of  Object.entries(txRequestPortion)  ){
            //perform transaction
            const transaction = await consumerContract.sendRequest(
                txDetails_script,
                "0x",
                slotId,
                donHostedSecretsVersion,
                txDetails_args.concat(value) ,
                [],
                gasLimit,
                cl_subManager.getSubId(),
                cl_subManager.getDonId()
            );

            const response = await consumerContract.retrieveReponse(transaction.hash, rpcProvider, cl_subManager.getRouterAddress(), ReturnType.string );
            
            if (response == '' ){
                continue;
            }
            //to json
            const jsonResponse = JSON.parse(response.toString())
            reponse_txn = { ...reponse_txn , ...jsonResponse  }
        };
        
        return reponse_txn
    }catch(err){
        throw err;
    }
}



const getBitQueryData = async( tx_hash: string ) =>{
    logger.info(" Get trans details from bitquery. ")
    const headers = {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.BITQUERY_API_KEY
    }
    const requestBody = {
        'query': bitQuery, 
        'variables': {
            "txHash": tx_hash
        }
    }

    let response :AxiosResponse = null;
    let bitQueryDtl = {}
    try{
        response = await axios.post(process.env.BITQUERY_API_URL,requestBody, {headers} );
    }catch( error ){
        //return default
        return bitQueryDtl
    }

    if ( response.status == 200 ){
        if ( response.data['errors'] != undefined ){
            logger.error( `Bitquery error: ${JSON.stringify(response.data['errors'])}`);
            return bitQueryDtl;
        }

        //normal way
        logger.info(" Successfully get trans details from bitquery. ")
        const data = response.data['data']['ethereum']['transactions']
        bitQueryDtl =  Array.isArray(data)? data[0]: {}
    }else{
        logger.error(`No data found for transaction hash: {tx_hash}. Response: ${response.data}`)
    }
    return  bitQueryDtl
}

const getTxDetails_ETH = async (transaction_hash: string)=>{
    logger.info(" Get trans details from etherscan. ")
    
    const tx_details= await getTxnByHash(transaction_hash)
    if (Object.keys(tx_details).length === 0){
        return {}
    }

    return  tx_details 
}

const getWalletAnalysis_ETH = ( addressDetail: any ) =>{
    let time_diff_mins = null
    let min_value_received = null

    if ( addressDetail.length > 1 ){
        const first_tx_time = Number( addressDetail[0]['timeStamp'] )
        const last_tx_time = Number( addressDetail[addressDetail.length-1]['timeStamp'] )

        time_diff_mins = (last_tx_time-first_tx_time)/60
    }

    //overflow problem location
    if (addressDetail.length >  0 ){
        min_value_received =  addressDetail.reduce((min, current) => {
            const currentValue = parseFloat(current.value);
            return currentValue < min ? currentValue : min;
        }, Infinity);
        
        
        //from Wei to ETH
        min_value_received = gWei2ETH(min_value_received) //overflow problem location
        
    }

    return {
        time_diff_mins:time_diff_mins,
        min_value_received:min_value_received
    }
}


/*
############Deprecated##############Deprecated###########Deprecated############
const getWalletAnalysis_ETH = async( walletAddr:string ) =>{
    logger.info( `Retrieve time difference, min value received from addrss ${walletAddr} ` )

    const apiKey = process.env.ETHERSCAN_API_KEY
    const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${walletAddr}&startblock=0&endblock=99999999&sort=asc&apikey=${apiKey}`

    const response = await axios.get(url);
    let time_diff_mins = null
    let min_value_received = null
    if ( response.status == 200 ){
        const txList=  response.data['result']


        if ( txList.length > 1 ){
            const first_tx_time = Number( txList[0]['timeStamp'] )
            const last_tx_time = Number( txList[txList.length-1]['timeStamp'] )

            time_diff_mins = (last_tx_time-first_tx_time)/60
        }

        if (txList.length >  0 ){
            min_value_received =  txList.reduce((min, current) => {
                const currentValue = parseFloat(current.value);
                return currentValue < min ? currentValue : min;
            }, Infinity);
            
            //from Wei to ETH
            min_value_received = gWei2ETH(min_value_received)
        }
    }
    //default
    return { [walletAddr]:{time_diff_mins:time_diff_mins, min_value_received:min_value_received}}
}
############Deprecated##############Deprecated###########Deprecated############
*/

const getWalletBalance_CL = async( walletAddr: string ) =>{
    try{
        const {ETH_SEPOLIA_routerAddress, ETH_subscriptionId, ETH_linkTokenAddress, ETH_donId, ETH_CONSUMER_CONTRACT_ADDRESS } = process.env

        logger.info( `Getting balance of address ${walletAddr} through chainlink service` )
        //use chainlink to fetch data from etherscan
        const contractIssuer = new ContractIssuer(ETH_SEPOLIA_routerAddress);
    
        const rpcProvider = contractIssuer.getRpcProvider();
        const signer = contractIssuer.getSigner();
    
        const gasLimit = 300000;
    
        //secret id on chainlink
        const slotId = 0 ;
    
        //trans details
        const txDetails_script = fs
        .readFileSync(path.resolve(__dirname, "./apiCall/addrBalance/addrBalance.js"))
        .toString();

        const consumerAbi = require("../contract/ETH_FunctionsConsumer.json")
    
        const txDetails_secrets = {apiKey: process.env.ETHERSCAN_API_KEY }
    
        //////// ESTIMATE REQUEST COSTS ////////
        const cl_subManager = new CL_SubscriptionManager(signer, ETH_SEPOLIA_routerAddress, ETH_subscriptionId, ETH_linkTokenAddress, ETH_donId );
        await cl_subManager.init();
    
        // estimate costs in Juels
        await cl_subManager.estimateFunctionsRequestCost(gasLimit);
        
        //////// MAKE REQUEST ////////
    
        //secret manager
        const cl_secretsManager =  new CL_secretsManager(signer, ETH_SEPOLIA_routerAddress);
        await cl_secretsManager.init();
    
        const uploadResult = await cl_secretsManager.uploadSecretsToDON( txDetails_secrets, slotId , 15 ); 
    
        // fetch the reference of the encrypted secrets
        const donHostedSecretsVersion = uploadResult.version; 
        
        //Define contract
        const consumerContract = new CL_FunctionConsumer(signer,ETH_CONSUMER_CONTRACT_ADDRESS, consumerAbi, explorerUrl);
    
        //perform transaction to call etherscan api
        const txDetails_args =[walletAddr]
    
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



const getWalletBalance_ETH = async( walletAddr: string, useChainlink: boolean ) =>{
    if ( useChainlink ){
        return await getWalletBalance_CL(walletAddr)
    }
    
    //directly call etherscan
    logger.info(`Get balance of address ${walletAddr}`)
    const apiKey = process.env.ETHERSCAN_API_KEY
    const url = `https://api.etherscan.io/api?module=account&action=balance&address=${walletAddr}&tag=latest&apikey=${apiKey}`

    const response = await axios.get(url);
    let balance = null;
    if ( response.status == 200 ){
        //const balanceWei = BigInt(response.data['result']);
        //balance = (balanceWei / WeiPerEther).toString(); // Convert Wei to Ether


        const decodedBalance = BigNumber.from(response.data['result']);

        balance = gWei2ETH( decodedBalance )  

    }
    console.log('Balance:', balance);

    logger.info(`Received balance of address ${walletAddr}`)
    return {balance:balance};
}

const getWalletDtls = async( walletAddr:string, useChainlink: boolean, role: string ) =>{
    const apiKey = process.env.ETHERSCAN_API_KEY
    const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${walletAddr}&startblock=0&endblock=99999999&sort=asc&apikey=${apiKey}`

    const response = await axios.get(url);
    if ( response.status == 200 ){
        const addressDetail = response.data['result'];
        console.log(`Address details for ${role} (${walletAddr}):`, addressDetail);

        const lastPageTrans = addressDetail.slice(-10 );

        const walletAnaData = getWalletAnalysis_ETH( addressDetail ); // bignumber overflow problem in here

        const walletBalance = await getWalletBalance_ETH( walletAddr, useChainlink );

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
        receiverInfo
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
    console.log("requiredContent: ", requiredContent)
    for (const [key, pattern] of Object.entries(rptPattern_transFraud)) {
        const match = requiredContent.match(pattern);
        if (match) {
            resultReport[key] = match[1].trim();
        }
      }

    return resultReport
}

const analyze_fraud = async(transaction_hash: string) => {
    try {
        //Return format:   tx_details 
        const txDetails = await getTxDetails_ETH(transaction_hash);
        console.log("get transaction detail result is: ", txDetails);
        //const txDetails = await getTxDetails_CL(transaction_hash);
        const bitQueryDtl =  await getBitQueryData( transaction_hash )
        
        const senderAddr = txDetails['from']
        const receiverAddr = txDetails['to']

        const useChainlinkService = false;
        //latest page trans, balance,last page transTime diff, min value received, format: {time_diff_mins:time_diff_mins, min_value_received:min_value_received}
        const senderInfo = await getWalletDtls( senderAddr, useChainlinkService, "sender") 
        const receiverInfo = await getWalletDtls( receiverAddr, useChainlinkService, "to" )

        // openai analysis
        const analysisResult = await openAi_analysisTransFraud(transaction_hash,txDetails, bitQueryDtl, senderInfo, receiverInfo);
        return analysisResult;
    }
    catch (error) {
        logger.error( error.message);
        throw error;
    }
}

export { analyze_fraud }