import logger from "./logger";

/**
 * 
 * @param bitQueryDtl from ethTxnsAnalysis/bitQuery/bitQuery.ts
 */
const getContractType = ( bitQueryDtl:any, role: string ) =>{
    logger.info("Role info :")
    logger.info( bitQueryDtl[role])
    const smartContract = bitQueryDtl[role]['smartContract']

    const contractType = smartContract['contractType'] ;
    return contractType;
}

export { getContractType }