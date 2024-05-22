import fs from "fs"
import path from "path"
import dotenv from 'dotenv';
const uploadCall_location = "../../../common/ipfs/contractCall/quickNoteUploadFile.js"
import { chainlink_simulateScrpt, handleSimulateResult  } from "../../../common/chainlinkUtil"
import { ReturnType } from "@chainlink/functions-toolkit";

const uploadToIPFS = async()=>{
    dotenv.config();
    const {QUICKNOTE_API_KEY} = process.env
    const uploadApi_script = fs
    .readFileSync(path.resolve(__dirname, uploadCall_location))
    .toString();

    const secrets = {apiKey: QUICKNOTE_API_KEY}

    // set parameters
    const contentType = 'application/json'

    const fileName = "test.json"
    const fileContent = fs.readFileSync(path.resolve(__dirname, `./${fileName}`) 
    , 'utf-8')

    //console.log(`FILE CONTENT!!: ${fileContent}`)

    const parameter = [ contentType, fileContent, fileName ]

    const response = await chainlink_simulateScrpt( 
        uploadApi_script , parameter, [], secrets );

    const returnType = ReturnType.string;
    const decodeResult = handleSimulateResult(response, ReturnType.string);
    if (decodeResult == null){
        console.log("Failed" )
    }else{
        console.log(`✅ Decoded response to ${returnType}: `);
        const jsonResponse = JSON.parse(decodeResult.toString())
        console.log(`✅ Return result ${jsonResponse}: `);
    }


}


uploadToIPFS()