import axios,{AxiosResponse } from 'axios';
import logger from './logger';

const getTxnByHash = async (tx_hash: string )=>{
    const apiKey = process.env.ETHERSCAN_API_KEY
    const url = `https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=${tx_hash}&apikey=${apiKey}`

    const response = await axios.get(url);

    if ( response.data  != undefined && response.data != null ){
        logger.info( "Get response." ) 
        return response.data['result']
    }else{
        logger.error( "Cannot get response." )
        return {}
    }
}




export {getTxnByHash}