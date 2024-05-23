


import path from "path"
import  {getWalletDtls} from "../../../app/polygonAnalysis/txnsAnalysisController"
import dotenv from 'dotenv';
import { send } from "process";
import { notStrictEqual } from "assert";


before(function() {
    // Load environment variables from .env file
    dotenv.config();
});

describe('Polygon App', async function() {
    this.timeout(5000);
    it.skip( 'Test getting walletDtls', async ()=>{
        const address = "0x0f3284bFEbc5f55B849c8CF792D39cC0f729e0BC"
        const receiverInfo = await getWalletDtls( address, false, "to")    

        //console.log( JSON.stringify(receiverInfo) )

        notStrictEqual(receiverInfo['balance'], null, 'Value should not be null');
        notStrictEqual(receiverInfo['lastPageTrans'], null, 'Value should not be null');
        notStrictEqual(receiverInfo['min_value_received'], null, 'Value should not be null');
        notStrictEqual(receiverInfo['walletAnaData'].time_diff_mins, null, 'Value should not be null');
    })
})