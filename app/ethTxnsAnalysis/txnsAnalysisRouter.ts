import * as express from 'express'
const router = express.Router();

import {analyze_fraud} from "./txnsAnalysisController"


// POST users listing. 
router.post( '/detect_fraud' , async(req: express.Request,res: express.Response)=>{   
    try
    {   
        //const , let , var
        const data = req.body ;
        const transaction_hash: string = data.hash
        if ( transaction_hash == undefined){
            throw new Error("Please input transaction hash.")
        }        
        const result = await analyze_fraud(transaction_hash);

        res.send(result);
    }catch(err)
    {
        console.error(err.message)
        res.status(500)
        res.send( { error: err })
    }
});


export default router;

