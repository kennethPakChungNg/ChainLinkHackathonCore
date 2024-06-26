import * as express from 'express'
const router = express.Router();

import {analyze_smart_contract, uploadContractResult, getSmartContractSourceCodeByAddress } from "./ethSmartConController"

router.post( '/getSmartContractSourceCodeByAddress', async(req: express.Request, res: express.Response)=>{   
    try
    {
        const requestBody = req.body ;
        const contractAddr: string = requestBody.contractAddr
        const resultJson = await getSmartContractSourceCodeByAddress(contractAddr);
        res.json(resultJson);
    }
    catch(err)
    {
        console.error(err.message)
        res.status(500)
        res.send( { error: err })
    }
});

router.post( '/detect_vulnerability' ,  async(req: express.Request,res: express.Response)=>{   
    try
    {
        const data = req.body ;
        const contractCode: string = data.code
        const solidity_version:string = data.version 
        const result = await analyze_smart_contract(contractCode, solidity_version);
        
        const uploadUrl = await uploadContractResult( result )

        res.send({
            ...uploadUrl,
            result
        });
    }
    catch(err)
    {
        console.error(err.message)
        res.status(500)
        res.send( { error: err })
    }
});

export default router;
