const baseUrl = args[0]
const txns_hash = args[1]
const requiredColumns = args.slice(2)

/*
if (!secrets.apiKey) {
    throw Error(
      "AVAX_RPC_APIKEY environment variable not set."
    );
}


const apiKey = secrets.apiKey
*/

// Make the HTTP request
// url: `${baseUrl}/${apiKey}/ext/bc/C/rpc`,
const avaxTxDetailResponse = await Functions.makeHttpRequest({
    url: baseUrl,
    method: "POST",
    headers:{
        "Content-Type":"application/json"
    },
    data:{
        "jsonrpc": "2.0",
        "id":1,
        "method": "eth_getTransactionByHash",
        "params": [
            txns_hash
        ]
    }
});

console.log( `KEYS: ${Object.keys(avaxTxDetailResponse)}` )

if (avaxTxDetailResponse.error) {
    //throw Error(`Request failed, status code: ${avaxTxDetailResponse.response.status}`);
    throw Error(`Request failed, message: ${avaxTxDetailResponse.message}`);
}

// fetch response
const response = avaxTxDetailResponse.data;
let filteredData  = {};
if ( response  != undefined && response != null ){
    const tx_details = response['result'];

    //filtering
    
    filteredData = Object.fromEntries(requiredColumns.map(key => [key, tx_details[key]]));
}

return Functions.encodeString(JSON.stringify(filteredData))