import {gWei2ETH} from "../../../../common/blockChainUtil"
import {getContractType} from "../../../../common/bitQueryUtil"
import {
    ReturnType,
    decodeResult
}  from "@chainlink/functions-toolkit" ;


const decideDataForPrompt=( data: any, outputIfNone:any  = 'N/A' )=>{
    const returnData =  (data == undefined || data == null )? outputIfNone : data;

    return returnData;
}


const getPrompt_transFraud = ( transaction_hash:string, txDetails: any,  bitQueryDtl:any, senderInfo: any, receiverInfo: any ) => {
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
    Assume you are an blockchain security expert in cryptocurrency fraud transaction detection and crypto scam phishing with access to multiple data sources including Etherscan, 
    blockchain analytics tools, and real-time market data. You are analyzing the Ethereum transaction with hash 
    ${transaction_hash}.

    Based on the information and real-time data from Etherscan which listed to you below:

    Transaction Hash: ${transaction_hash}
    From address: ${senderAddr} (Previous transactions: ${senderInfo.lastPageTrans.length})
    To address: ${receiver} (Previous transactions: ${receiverInfo.lastPageTrans.length})
    Transaction Value: ${  gWei2ETH(decodeResult( txDetails['value'],ReturnType.int256  ) ) } ETH
    Gas Used: ${ decodeResult(txDetails['gas'], ReturnType.int256 )}

    Time difference between the first and last transactions for the From address: ${senderTimeDiff} minutes
    Total Ether balance for the From address: ${senderBalance} ETH
    Minimum value received for the From address: ${senderMinValueReceived} ETH

    Time difference between the first and last transactions for the To address: ${receiverTimeDiff} minutes
    Total Ether balance for the To address: ${receiverBalance} ETH
    Minimum value received for the To address: ${receiverMinValueReceived} ETH

    Bitquery has provided the following additional data:
    From Address Contract Type: ${senderContractType}
    To Address Contract Type: ${receiverContractType}

    With the data provided, assess the potential fraud risk of this Ethereum transaction or the from address fall in to phishing scam.

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

const rptPattern_transFraud = {
    Likelihood_of_Fraud_Or_Scam_In_Percentage: /\*\*Likelihood of Fraud Or Scam In Percentage\*\*:\s*(\d+%)\s*/,
    Type_of_The_Possible_Fraud: /\*\*Type of The Possible Fraud\*\*:\s*([^\n]+)/,
    Ownership_of_From_Address: /\*\*Ownership of From Address\*\*:\s*([^\n]+)/,
    Ownership_of_To_Address: /\*\*Ownership of To Address\*\*:\s*([^\n]+)/,
    Behavior_of_the_From_and_To_Addresses: /\*\*Behavior of the From and To Addresses\*\*:\s*([\s\S]+?)(?=\*\*Peculiarities in the Transaction\*\*)/,
    Peculiarities_in_the_Transaction: /\*\*Peculiarities in the Transaction\*\*:\s*([\s\S]+?)(?=\*\*Market Context and Alerts\*\*)/,
    Market_Context_and_Alerts: /\*\*Market Context and Alerts\*\*:\s*([\s\S]+?)(?=\*\*Supporting Evidence for Assessment\*\*)/,
    Supporting_Evidence_for_Assessment: /\*\*Supporting Evidence for Assessment\*\*:\s*([\s\S]+?)(?=\*\*Recommended Actions\*\*)/,
    Recommended_Actions: /\*\*Recommended Actions\*\*:\s*([\s\S]+)/
};

export {getPrompt_transFraud, rptPattern_transFraud}