import {Wallet } from "@ethersproject/wallet"
import {Contract} from "@ethersproject/contracts"
const NewArchiveAPI = require( "./apiCall/sample/sampleConsumer.json")
import {JsonRpcProvider} from "@ethersproject/providers"
import {getBitQueryData} from "../../common/bitQueryUtil"
import  {
    ContractIssuer, gWei2ETH, getWalletAnalysis
} from "../../common/blockChainUtil"
import { 
    getDonSecretVersion, 
    CL_SubscriptionManager,
    CL_FunctionConsumer
} from "../../common/chainlinkUtil"
import {query as bitQuerySql} from "./apiCall/bitQuery/bitQuery"
import logger from "../../common/logger"
import { ReturnType, decodeResult } from "@chainlink/functions-toolkit"
import axios,{AxiosResponse } from 'axios';
import {
    requestDirectQuestion as analysisByOpenAI,
    rptPattern_transFraud,
    getPrompt_transFraud
} from "../../common/openAiUtils"
import { BigNumber } from "@ethersproject/bignumber";
const explorerUrl = 'https://amoy.polygonscan.com/tx'


const sampleCall = async()=>{
    const {POLY_PROVIDER_URL, POLY_CONTRACT_ADDRESS} = process.env
    const providerUrl = POLY_PROVIDER_URL
    const contractAddress = POLY_CONTRACT_ADDRESS

    const provider = new JsonRpcProvider(providerUrl)
    const newArchieveContract = new Contract(
        contractAddress,
        NewArchiveAPI,
        provider
    )

    const result = await getAllArticles(newArchieveContract);
    return result;
}

async function getAllArticles(newArchieveContract){
    try{
        const articles = await newArchieveContract.getAllArticles();

        return articles;
    }catch (error){
        console.error("Error fetching articles:", error);
        return [];
    }
}

async function sampleCallWrite(){
    const {ContractOwner_privateKey, POLY_CHAINLINK_SUBID, POLY_PROVIDER_URL, POLY_CONTRACT_ADDRESS} = process.env
    const providerUrl = POLY_PROVIDER_URL
    const contractAddress = POLY_CONTRACT_ADDRESS

    const provider = new JsonRpcProvider(providerUrl)
    const wallet = new Wallet(ContractOwner_privateKey);
    const signer = wallet.connect( provider )
    const newArchieveContract = new Contract(
        contractAddress,
        NewArchiveAPI,
        signer
    )

    const transaction = await newArchieveContract.sendRequest(POLY_CHAINLINK_SUBID);

    return transaction
}

const getWalletBalance_CL = async( walletAddr: string ) =>{
    //TODO
}
    

const getWalletBalance = async( walletAddr: string, useChainlink: boolean ) =>{
    if ( useChainlink ){
        return await getWalletBalance_CL
    }
    
    const {POLY_SCAN_APIKEY} = process.env

    //directly call etherscan
    logger.info(`Get balance of address ${walletAddr}`)
    const url = `https://api.polygonscan.com/api?module=account&action=balance&address=${walletAddr}&apikey=${POLY_SCAN_APIKEY}`

    const response = await axios.get(url);
    let balance = null;
    if ( response.status == 200 ){

        const decodedBalance = BigNumber.from(response.data['result']);

        balance = gWei2ETH( decodedBalance )
        console.log("getWalletBalance Balance: ", balance)  
        
    }

    logger.info(`Received balance of address ${walletAddr}`)
    return {balance:balance};
}

const getWalletDtls = async( walletAddr:string, useChainlink: boolean, role: string ) =>{
    const {POLY_SCAN_APIKEY} = process.env

    const url = `https://api.polygonscan.com/api?module=account&action=txlist&address=${walletAddr}&startblock=0&endblock=latest&sort=asc&apikey=${POLY_SCAN_APIKEY}`

    const response = await axios.get(url);
    if ( response.status == 200 ){
        const addressDetail = response.data['result']

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

async function getTxDetails(txnHash: string){
    txnHash = txnHash.trim();
    const { POLY_CHAINLINK_SUBID, POLY_CHAINLINK_DONID, POLY_PROVIDER_URL, POLY_TXN_CONTRACT_ADDRESS,POLY_CHAINLIN_FNC_ROUTER, POLY_CHAINLINK_TOKEN_ADDRESS} = process.env
    const contractIssuer = new ContractIssuer(POLY_PROVIDER_URL);
    const rpcProvider = contractIssuer.getRpcProvider();
    const signer = contractIssuer.getSigner();

    const consumerAbi = require("./apiCall/txDetails/polygonTransConsumer.json")

    const api_secrets = {apiKey: process.env.POLY_SCAN_APIKEY }

    const gasLimit = 300000;
    
    //upload secret to chainlink DON
    let donHostedSecretsVersion = 0;
    const slotId = 0;
    if ( Object.keys(api_secrets).length != 0 ){
        const expiration = 15 ;   //15mins
        donHostedSecretsVersion = await getDonSecretVersion( signer, POLY_CHAINLIN_FNC_ROUTER, POLY_CHAINLINK_DONID, api_secrets, slotId, expiration );
    }

    //////// ESTIMATE REQUEST COSTS ////////
    const cl_subManager = new CL_SubscriptionManager(signer, POLY_CHAINLIN_FNC_ROUTER, POLY_CHAINLINK_SUBID, POLY_CHAINLINK_TOKEN_ADDRESS, POLY_CHAINLINK_DONID );
    await cl_subManager.init();

    // estimate costs in Juels
    await cl_subManager.estimateFunctionsRequestCost(gasLimit);

    //send contract
    const consumer = new CL_FunctionConsumer(signer, POLY_TXN_CONTRACT_ADDRESS, consumerAbi, explorerUrl );

    const essentialFields = ['from', 'to', 'value', 'gas']
    const transaction = await consumer.getFunctionsConsumer().sendRequest(
        slotId,
        donHostedSecretsVersion,
        POLY_CHAINLINK_SUBID,
        txnHash,
        essentialFields
    )

    const response = await consumer.retrieveReponse(transaction.hash, rpcProvider, cl_subManager.getRouterAddress(), ReturnType.string );
    
    const jsonResponse = JSON.parse(response.toString())
    
    return jsonResponse;
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
        "MATIC",
        "Polygon"
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


const analyze_fraud = async(transaction_hash)=>{
    try{
        const bitQueryDtl =  await getBitQueryData( bitQuerySql, transaction_hash )


        const txDetails = await getTxDetails(transaction_hash);     
        const senderAddr = txDetails['from'];
        const receiverAddr = txDetails['to'];
        
        const useChainlinkService = false;

        const senderInfo = await getWalletDtls( senderAddr, useChainlinkService, "sender")   

        const receiverInfo = await getWalletDtls( receiverAddr, useChainlinkService, "to" )   //overflow problem

        //openai analysis
        const analysisResult = await openAi_analysisTransFraud(transaction_hash, txDetails, bitQueryDtl, senderInfo, receiverInfo);


        return analysisResult;

    }catch (error){
        logger.error( error.message);
        throw error;
    }
}
export  { sampleCall, sampleCallWrite, analyze_fraud 
    ,getWalletDtls
}