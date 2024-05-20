
//TODO, don't retrieve 'accessList' first as the lenght is unlimited.
const txRequestPortion = {
    partA: ['from', 'to']
}

/**
 * const txRequestPortion = {
    partA: ['blockHash', 'blockNumber','from', 'to'],
    partB: ['maxFeePerGas', 'maxPriorityFeePerGas', 'hash','nonce','transactionIndex','value','type','chainId','v','yParity'],
    partC: ['input'],
    partD: ['r','s','gas','gasPrice']
}
 */


export {txRequestPortion }