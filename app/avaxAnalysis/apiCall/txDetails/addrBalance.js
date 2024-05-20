// Arguments can be provided when a request is initated on-chain and used in the request source code as shown below

const baseUrl = args[0];
const walletAddr = args[1];

// build HTTP request object
const etherRequest = Functions.makeHttpRequest({
    url: baseUrl,
    method: "POST",
    headers:{
      "Content-Type":"application/json"
  },
    data:{
      jsonrpc: "2.0",
      id:1,
      method: "eth_getBalance",
      params: [
        walletAddr,
        "latest"
      ]
    }
});

// Make the HTTP request
const etherResponse = await etherRequest;

if (etherResponse.error) {
  throw Error(`Request failed, status code: ${etherResponse.message}`);
}

// fetch response
const response = etherResponse.data
;

let balance = 0;
if ( response != undefined && response != null ){
    balance = response['result'];
}

return Functions.encodeUint256(Number(balance))
