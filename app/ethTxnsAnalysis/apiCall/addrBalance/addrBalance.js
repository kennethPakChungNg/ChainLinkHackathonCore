// Arguments can be provided when a request is initated on-chain and used in the request source code as shown below
const walletAddr = args[0];

if (!secrets.apiKey) {
  throw Error(
    "ETHERSCAN_API_KEY environment variable not set."
  );
}

// build HTTP request object
const etherRequest = Functions.makeHttpRequest({
  url: `https://api.etherscan.io/api?module=account&action=balance&address=${walletAddr}&tag=latest&apikey=${secrets.apiKey}`,
  method: "GET"
});

// Make the HTTP request
const etherResponse = await etherRequest;

if (etherResponse.error) {
  throw Error(`Request failed, status code: ${etherResponse.response.status}`);
}

// fetch response
const response = etherResponse.data
;

let balance = 0;
if ( response != undefined && response != null ){
    balance = response['result'];
}

return Functions.encodeUint256(Number(balance))
