//import request from 'supertest';
import fs from "fs"

import path from "path"
import  {ipfsUploadFile} from "../../../common/ipfs/ipfsUtils"
import dotenv from 'dotenv';


before(function() {
    // Load environment variables from .env file
    dotenv.config();
});

describe('App', function() {

    it.skip( 'Test ipfs upload', async ()=>{
        const fileName = 'test.json'
        //load testing json file
        const sampleJson = fs.createReadStream(path.resolve(__dirname, `./${fileName}`))
        
        const returnUrl = await ipfsUploadFile( fileName, sampleJson, 'application/json')

        console.log( `Response from IPFS : ${JSON.stringify(returnUrl)}` )
        
    })
})