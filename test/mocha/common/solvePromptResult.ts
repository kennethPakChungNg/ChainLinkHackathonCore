

const openAiResult = `
*Fraud or Phishing Risk Analysis*:
1. *Likelihood of Fraud Or Scam In Percentage*: 20%
2. *Type of The Possible Fraud*: Unknown

*Address Ownership*:
1. *Ownership of From Address*: Unknown
2. *Ownership of To Address*: Unknown

*Behavior of the From and To Addresses*:
Both the sender (From address) and the recipient (To address) have a relatively low number of transactions (10 each), indicating they are not heavily used or high-volume addresses. The significant time difference between the first and last transactions for both addresses suggests they have been active over an extended period but not frequently used.

*Peculiarities in the Transaction*:
- The transaction value of 7.53203338 ETH is substantial but not necessarily unusual for Ethereum transactions.
- The gas used (25000) is within a typical range for simple ETH transfers, indicating no complex contract interactions were involved.
- The total Ether balance for the From address after the transaction is relatively low compared to the transaction amount, suggesting this transaction significantly depleted its funds.
- Both addresses have received transactions of 0.0 ETH, which could indicate failed transactions or gas-only transactions for contract interactions, which is not uncommon.
*Market Context and Alerts*:
There are no specific market conditions or community alerts provided that directly relate to this transaction or the involved addresses. The transaction does not immediately appear to be linked with known fraudulent activities or market manipulation schemes based on the provided data alone.

*Supporting Evidence for Assessment*:
- Both addresses have a low transaction count.
- Large time gaps between the first and last transactions for both addresses.
- Significant transfer value compared to the remaining balance of the From address.
- No complex contract interactions were indicated by the gas used.
- No immediate peculiarities or red flags specific to known fraud or phishing schemes.

*Recommended Actions*:
- Monitor both addresses for further transactions that may indicate a pattern or link to known fraudulent activities.
- Cross-reference the addresses and transaction hash with known scam databases or alerts for any emerging information.
- Engage in community forums or platforms to see if there have been any reports or suspicions raised by others regarding these addresses.
- Since the fraud risk is not conclusively high but not entirely dismissible, maintaining a cautious observation is recommended rather than immediate drastic action.`


import { rptPattern_transFraud} from "../../../app/ethTxnsAnalysis/apiCall/openAi/openAi_transFraud"

describe('ETH', function() {
    it( 'Test resolving openAi return.', ()=>{
        let resultReport = {}

        for (const [key, pattern] of Object.entries(rptPattern_transFraud)) {
            const match = openAiResult.match(pattern);
            if (match) {
                resultReport[key] = match[1].trim();
            }
          }
        
        console.log( `OPEN AI result: ${JSON.stringify(resultReport)}` )
    })
})