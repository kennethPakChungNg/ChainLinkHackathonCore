const query = `query MyQuery($txHash: String!) {
  ethereum(network: avalanche) {
    transactions(txHash: {is: $txHash}, txType: {}) {
      gasValue
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
      gasPrice
    }
  }
}
`

export {query}