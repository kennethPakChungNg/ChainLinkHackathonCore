const query = `query MyQuery($txHash: String!) {
    ethereum(network: matic) {
      transactions(txHash: {is: $txHash}) {
        gasValue
        gasPrice
        to {
          address
          annotation
          smartContract {
            contractType
            currency {
              symbol
            }
            protocolType
          }
        }
        txType
        sender {
          address
          annotation
          smartContract {
            contractType
            protocolType
            currency {
              name
              symbol
              tokenType
              decimals
            }
          }
        }
        hash
        index
        maximum(of: date)
        minimum(of: date)
        nonce
      }
    }
  }
`

export {query}