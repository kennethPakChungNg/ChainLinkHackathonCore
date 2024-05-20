import logger from './logger';

import axios,{AxiosResponse } from 'axios';
import {gWei2ETH} from "./blockChainUtil"
import {
    ReturnType,
    decodeResult
}  from "@chainlink/functions-toolkit" ;
import {getContractType} from "./bitQueryUtil"

const OPENAI_API_BASE_URL = 'https://api.openai.com'

const decideDataForPrompt=( data: any, outputIfNone:any  = 'N/A' )=>{
    const returnData =  (data == undefined || data == null )? outputIfNone : data;

    return returnData;
}

const requestDirectQuestion = async(prompt: string, requestBody: any)=>{
    logger.info("Request openAi analysis.")
    const apiKey = process.env.OPENAI_API_KEY
    const url = `${OPENAI_API_BASE_URL}/v1/chat/completions`
    const data = requestBody  

    const headers = {'Authorization': `Bearer ${apiKey}`}

    const response:AxiosResponse  = await axios.post(url,data, {headers} );
    if ( response.status == 200 ){
        logger.info( "Successfully return result from OpenAI." )
        return response.data;
    }else{
        logger.error( `Error when OpenAI call to ${url}: ${response.data }`)
        throw new Error( `Error during API call: ${response.status}`  )
    }
    
}

const rptPattern_transFraud = {
    Likelihood_of_Fraud_Or_Scam_In_Percentage: /\*\*Likelihood of Fraud Or Scam In Percentage\*\*:\s*(\d+%)\s*/,
    Type_of_The_Possible_Fraud: /\*\*Type of The Possible Fraud\*\*:\s*([^\n]+)/,
    Ownership_of_From_Address: /\*\*Ownership of From Address\*\*:\s*(\S+)/,
    Ownership_of_To_Address: /\*\*Ownership of To Address\*\*:\s*(.+?)(?=\*\*Behavior of the From and To Addresses\*\*)/,
    Behavior_of_the_From_and_To_Addresses: /\*\*Behavior of the From and To Addresses\*\*:\s*(.+?)(?=\*\*Peculiarities in the Transaction\*\*)/,
    Peculiarities_in_the_Transaction: /\*\*Peculiarities in the Transaction\*\*:\s*(.+?)(?=\*\*Market Context and Alerts\*\*)/,
    Market_Context_and_Alerts: /\*\*Market Context and Alerts\*\*:\s*(.+?)(?=\*\*Supporting Evidence for Assessment\*\*)/,
    Supporting_Evidence_for_Assessment: /\*\*Supporting Evidence for Assessment\*\*:\s*(.+?)(?=\*\*Recommended Actions\*\*)/,
    Recommended_Actions: /\*\*Recommended Actions\*\*:\s*(.+)/
}

const getPrompt_transFraud = ( transaction_hash:string, txDetails: any,  bitQueryDtl:any, senderInfo: any, receiverInfo: any, currency: string , chainName: string ) => {
    const senderAddr = senderInfo['walletAddr']
    const receiver = receiverInfo['walletAddr']

    const senderTimeDiff = decideDataForPrompt(senderInfo.walletAnaData.time_diff_mins)
    const senderBalance = decideDataForPrompt(senderInfo.balance)
    const senderMinValueReceived = decideDataForPrompt(senderInfo.walletAnaData.min_value_received)
    const senderContractType = decideDataForPrompt( getContractType(bitQueryDtl, senderInfo['role'] ) )

    const receiverTimeDiff = decideDataForPrompt(receiverInfo.walletAnaData.time_diff_mins)
    const receiverBalance = decideDataForPrompt(receiverInfo.balance)
    const receiverMinValueReceived = decideDataForPrompt(receiverInfo.walletAnaData.min_value_received)
    const receiverContractType = decideDataForPrompt( getContractType(bitQueryDtl, receiverInfo['role'] ) )

    const prompt = `
    Assume you are an blockchain security expert in cryptocurrency fraud transaction detection and crypto scam phishing with access to multiple data sources including ${chainName}, 
    blockchain analytics tools, and real-time market data. You are analyzing the ${chainName} transaction with hash 
    ${transaction_hash}.

    Based on the information and real-time data from ${chainName} which listed to you below:

    Transaction Hash: ${transaction_hash}
    From address: ${senderAddr} (Previous transactions: ${senderInfo.lastPageTrans.length})
    To address: ${receiver} (Previous transactions: ${receiverInfo.lastPageTrans.length})
    Transaction Value: ${  gWei2ETH(decodeResult( txDetails['value'],ReturnType.int256  ) ) } ${currency}
    Gas Used: ${ decodeResult(txDetails['gas'], ReturnType.int256 )}

    Time difference between the first and last transactions for the From address: ${senderTimeDiff} minutes
    Total ${currency} balance for the From address: ${senderBalance} ${currency}
    Minimum value received for the From address: ${senderMinValueReceived} ${currency}

    Time difference between the first and last transactions for the To address: ${receiverTimeDiff} minutes
    Total ${currency} balance for the To address: ${receiverBalance} ${currency}
    Minimum value received for the To address: ${receiverMinValueReceived} ${currency}

    Bitquery has provided the following additional data:
    From Address Contract Type: ${senderContractType}
    To Address Contract Type: ${receiverContractType}

    With the data provided, assess the potential fraud risk of this ${chainName} transaction or the from address fall in to phishing scam.

    The analysis should be structured strictly as follows, with each section's title in bold and followed by the analysis content:

    **Fraud or Phishing Risk Analysis**:
    1. **Likelihood of Fraud Or Scam In Percentage**: Only Provide a percentage estimate without explanation in this part.
    2. **Type of The Possible Fraud**: Identify and Standardize the Label of The Highest Possibility type of the fraud in these 10 listed types.
    'Financial Crimes', 'Scam Initial Coin Offerings', 'Pump and Dump Schemes', 'Market Manipulation', 'Ponzi Schemes', 'Traditional Theft', 'Broker Or Dealer Fraud', 
    'Unscrupulous Promotors', 'Unknown' or 'Other'. If the type is 'Other', please also specific the professional identification label in parentheses.

    **Address Ownership**:
    1. **Ownership of From Address**: Identify and set this as the identified name of organization, DAO, individual, group, company or if unknown. No need to provide any explanation or description.
    2. **Ownership of To Address**: Same criteria as the 'From Address'.

    **Behavior of the From and To Addresses**:
    Detail the transaction patterns and behaviors observed for both the sender and recipient addresses.

    **Peculiarities in the Transaction**:
    List and explain any peculiarities observed in the transaction, such as value anomalies or unusual gas usage.

    **Market Context and Alerts**:
    Describe the transaction's context within current market conditions and note any relevant community alerts or warnings.

    **Supporting Evidence for Assessment**:
    Provide a bullet-point list of key reasons that support your risk assessment, including any relevant patterns or indicators of fraudulent activity.

    **Recommended Actions**:
    Based on the assessment, suggest next steps or actions that could be taken.


    Keep the response within 400 words, and ensure that each section and its content are clearly distinguishable. 
    Use bold formatting for titles and normal text for content.
    Please note that the transaction can be considered as not fraud after analysis, if it is this case then the likelihood is 0% and Type of The Possible Fraud would be "No Fraud".
    `

    return prompt;
}

export { requestDirectQuestion, rptPattern_transFraud, getPrompt_transFraud, decideDataForPrompt }