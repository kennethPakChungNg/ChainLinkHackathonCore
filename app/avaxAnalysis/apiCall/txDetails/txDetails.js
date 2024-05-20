const txns_hash = args[0]
const requiredColumns = args.slice(1)
const avaxTxDetailResponse = await Functions.makeHttpRequest({
    url: 'https://api.avax.network/ext/bc/C/rpc',
    method: 'POST',
    headers:{'Content-Type':'application/json'},
    data:{
        'jsonrpc': '2.0', 
        'id':1, 
        'method': 'eth_getTransactionByHash',
        'params': [ txns_hash]
    }
})
if (avaxTxDetailResponse.error) {throw Error(`Request failed with message: ${avaxTxDetailResponse.message}`)}
const response = avaxTxDetailResponse.data;let filteredData  = {}
if ( response  != undefined && response != null ){
    const tx_details = response['result']
    filteredData = Object.fromEntries(requiredColumns.map(key => [key, tx_details[key]]))
}
return Functions.encodeString(JSON.stringify(filteredData))