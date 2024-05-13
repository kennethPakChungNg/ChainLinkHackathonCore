
import logger from "../logger"
import fs from 'fs'
import { NFTStorage, File } from "nft.storage";
import { create as ipfsHttpClient } from "ipfs-http-client";
import axios from "axios"
import  FormData from 'form-data';
const request = require('request-promise');
/**
 * Using chainlink function
 * @param fileName 
 * @param fileData 
 * @returns 
 */
const ipfsUploadFile = async (fileName, fileContent, contentType ) =>{
    try{
        const {QUICKNOTE_API_KEY, QUICKNOTE_BASE_URL} = process.env

        const url =  'https://api.quicknode.com/ipfs/rest/v1/s3/put-object'

        const formDataJson = {
            Body:{
                value: fileContent,
                options: {
                    filename: fileName,
                    contentType: contentType
                }
            },
            Key: fileName,
            'ContentType': contentType
        }

        const options = {
            method: 'POST',
            url: url,
            headers: {
              'x-api-key': `${QUICKNOTE_API_KEY}`
            },
            formData: formDataJson
        }

        logger.info("Try to upload file to IPFS server via quicknode api." )

        //form.append('authorization', auth );
        const response = await request(options);
        
        //retrive stauts 
        const responseJson = JSON.parse( response )

        let ipfsLink = ''
        if ( responseJson.status == 'pinned'){
            const pin = responseJson.pin
            const cid = pin.cid

            ipfsLink = `${QUICKNOTE_BASE_URL}/${cid}`
        }else{
            throw new Error("Cannot upload file to IPFS server.") 
        }

        logger.info("Return IPFS link of the uploaded file.")
        return {ipfsLink:ipfsLink};
        //return await ipfsUploadFileWithClient(client,fileName, fileData )
    }catch(err){
        logger.error(err)
        throw err;
    }
}

const ipfsUploadFileWithClient = async ( client:any, fileName, fileData )=>{
    if (client == null){
        throw new Error("Please provide valid web3 IPFS client.")
    }
    logger.info( `Start to upload file to IPFS.` )

    /*
    //Buffer to File Type
    const file =  new File([fileData], fileName)
    fs.createReadStream()
    */

    const metaData = await client.add(fileData, {duplex:true});

    const response = {
        'metadataUrl': metaData.url
    }

    return response
}


export { ipfsUploadFile, ipfsUploadFileWithClient  }