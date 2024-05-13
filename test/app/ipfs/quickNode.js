const fs = require('fs');
const axios = require('axios');
const request = require('request-promise');
const dotenv = require("dotenv")

const main = async()=>{
    dotenv.config();
    const {QUICKNOTE_API_KEY, QUICKNOTE_BASE_URL} = process.env


    const fileName = "test.json"
    const fileContent = fs.readFileSync("./test.json", 'utf-8');
    const contentType = "application/json"
    const blob = new Blob([fileContent], { type: contentType });
    
    const apiKey = QUICKNOTE_API_KEY
    
    var formData = new FormData();
    formData.append("Body", blob  );
    formData.append("Key", fileName);
    //formdata.append("ContentType", contentType );
    

    //test , build json
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

    options = {
        method: 'POST',
        url: 'https://api.quicknode.com/ipfs/rest/v1/s3/put-object',
        headers: {
          'x-api-key': `${apiKey}`
        },
        formData: formDataJson
    }
    
    const response = await request(options);
    //const response = await axios(options)
    /*
    const response = await axios.post('https://api.quicknode.com/ipfs/rest/v1/s3/put-object', formData , {
      headers: {
        'x-api-key': apiKey,
        'ContentType':contentType
      }
    })    
    */
    const responseJson = JSON.parse( response )
    console.log(responseJson)
    console.log("KEY================================")
    console.log( Object.keys(responseJson) )
    let ipfsLink = ''
    if ( responseJson.status == 'pinned'){
        const pin = responseJson.pin
        const cid = pin.cid

        ipfsLink = `${QUICKNOTE_BASE_URL}/${cid}`
    }else{
        throw new Error("Cannot upload file to IPFS server.") 
    }
        
    console.log(`LINK!!!!: ${ipfsLink}`)
}

main()