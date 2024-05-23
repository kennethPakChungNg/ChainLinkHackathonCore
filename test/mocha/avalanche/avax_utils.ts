import dotenv from 'dotenv';
import { notStrictEqual } from "assert";
import {
    getRpcProvider, getWallet, getSigner, requestTxnListAvaCloud
} from "../../../app/avaxAnalysis/avax_utils"
import  {getWalletDtls} from "../../../app/avaxAnalysis/txnsAnalysisController"

var ContractOwner_privateKey =null;
var AVAX_RPC_URL = null;

before(function() {
    // Load environment variables from .env file
    dotenv.config();
    ContractOwner_privateKey=  process.env.ContractOwner_privateKey;
    AVAX_RPC_URL= process.env.AVAX_RPC_URL
});


describe('Avalanche trans', function() {
    this.timeout(10000)
    it.skip( 'Connect RPC provider', async ()=>{
        const rpcProvider = await getRpcProvider(AVAX_RPC_URL);

        const wallet = await getWallet(ContractOwner_privateKey)

        const signer = getSigner(wallet, rpcProvider);
    })

    it.skip(' Get wallet details ', async()=>{
        try{
            const address = "0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae"
            const receiverInfo = await getWalletDtls( address, false, "to")    

            //console.log( JSON.stringify(receiverInfo) )

            notStrictEqual(receiverInfo['balance'], null, 'Value should not be null');
            notStrictEqual(receiverInfo['lastPageTrans'], null, 'Value should not be null');
            notStrictEqual(receiverInfo['min_value_received'], null, 'Value should not be null');
            notStrictEqual(receiverInfo['walletAnaData'].time_diff_mins, null, 'Value should not be null');
    
        }catch (error){
            console.log(error.message)
            throw error
        }
    })

    it.skip('Get wallet txs list from avacloud ', async ()=>{
        try{
            const address = "0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae"
        
            const response = await requestTxnListAvaCloud(address)
    
            //console.log( `${JSON.stringify(Object.keys(response))}` )
            console.log( `${JSON.stringify(response.length)}` )
        }catch (error){
            console.log(error.message)
            throw error
        }

    })
})