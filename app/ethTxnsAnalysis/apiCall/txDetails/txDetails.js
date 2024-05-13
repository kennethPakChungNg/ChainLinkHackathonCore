// Arguments can be provided when a request is initated on-chain and used in the request source code as shown below
const transaction_hash = args[0];

if (!secrets.apiKey) {
  throw Error(
    "ETHERSCAN_API_KEY environment variable not set."
  );
}

// build HTTP request object

const etherTxDetailRequest = Functions.makeHttpRequest({
  url: `https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=${transaction_hash}&apikey=${secrets.apiKey}`,
  method: "GET"
});

// Make the HTTP request
const etherTxDetailResponse = await etherTxDetailRequest;

if (etherTxDetailResponse.error) {
  throw Error(`Request failed, status code: ${etherTxDetailResponse.response.status}`);
}

// fetch response
const response = etherTxDetailResponse.data
;
let filteredData  = {};
if ( response  != undefined && response != null ){
  const tx_details = response['result'];

  //filtering
  const requiredColumns = args.slice(1)
  filteredData = Object.fromEntries(requiredColumns.map(key => [key, tx_details[key]]));

  /*
  for (const key of requiredColumns){
    filteredData[key] = tx_details[key] 
  }
  */
}

return Functions.encodeString(JSON.stringify(filteredData))
