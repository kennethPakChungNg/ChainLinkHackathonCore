// Arguments can be provided when a request is initated on-chain and used in the request source code as shown below
//const FormData = await import('npm:form-data@4.0.0');
//const axios = await import("npm:axios");

const contentType = args[0];
const fileContent = args[1];
const fileName = args[2];

if (!secrets.apiKey) {
  throw Error(
    "QUICKNOTE_API_KEY environment variable not set."
  );
}

// build HTTP request object
const apiKey = secrets.apiKey
//const blob = new Blob([fileContent], { type: contentType });

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

console.log("Start api call")

const ipfsUploadResponse = await Functions.makeHttpRequest({
  url: `https://api.quicknode.com/ipfs/rest/v1/s3/put-object`,
  method: "POST",
  headers: {
    'x-api-key':apiKey
  },
  data:formDataJson,
  formData:formDataJson
});

/*
const ipfsUploadResponse = await axios({
    url: 'https://api.quicknode.com/ipfs/rest/v1/s3/put-object', 
    data: formData , 
    headers: {
      'x-api-key': apiKey,
      'ContentType':contentType
    }
})
*/
// Make the HTTP request


if (ipfsUploadResponse.error) {
    console.log( `Request: ${JSON.stringify(formDataJson) }` )
    console.log(`Error: ${JSON.stringify(ipfsUploadResponse)}`)
  throw Error(`Request failed, status code: ${ipfsUploadResponse.response.status}`);
}

// fetch response
const response = ipfsUploadResponse.data
;
let filteredData  = {};
if ( response  != undefined && response != null ){
  const returnPin = response['pin'];

  return Functions.encodeString(JSON.stringify(returnPin))
}else{
    throw Error(`Cannot get return from Quicknote.`);
}



