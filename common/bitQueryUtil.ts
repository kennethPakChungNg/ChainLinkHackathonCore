import logger from "./logger";
import axios,{AxiosResponse } from 'axios';
/**
 * 
 * @param bitQueryDtl from ethTxnsAnalysis/bitQuery/bitQuery.ts
 */
const getContractType = ( bitQueryDtl:any, role: string ) =>{
    logger.info("Role info :")
    logger.info( bitQueryDtl[role])
    if (  bitQueryDtl[role] == undefined ){
        return undefined;
    }
    const smartContract = bitQueryDtl[role]['smartContract']

    const contractType = smartContract['contractType'] ;
    return contractType;
}

const getBitQueryData = async( bitQuery:string, tx_hash: string ) =>{
    logger.info(" Get trans details from bitquery. ")
    const {BITQUERY_API_URL, BITQUERY_API_KEY} = process.env
    const headers = {
        'Content-Type': 'application/json',
        'X-API-KEY': BITQUERY_API_KEY
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
        response = await axios.post( BITQUERY_API_URL,requestBody, {headers} );
    }catch( error ){
        //return default
        return bitQueryDtl;
    }

    if ( response.status == 200 ){
        if ( response.data['errors'] != undefined ){
            logger.error( `Bitquery error: ${JSON.stringify(response.data['errors'])}`);
            return bitQueryDtl;
        }

        //normal way
        logger.info(" Successfully get trans details from bitquery. ");
        const data = response.data['data']['ethereum']['transactions'];
        bitQueryDtl =  Array.isArray(data)? data[0]: {} ;
    }else{
        logger.error(`No data found for transaction hash: ${tx_hash}. Response: ${response.data}`) ;
    }
    return  bitQueryDtl;
}

export { getContractType, getBitQueryData }