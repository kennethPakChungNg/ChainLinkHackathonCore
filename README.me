# Generative AI Blockchain Security Analysis System - Backend

This repository contains the backend implementation for the Generative AI Blockchain Security Analysis System, a project developed for the Chainlink Hackathon 2024. The system leverages artificial intelligence to analyze blockchain transactions and smart contracts for security vulnerabilities and potential fraud.

## Project Overview

The backend provides APIs that enable:

1. **Smart Contract Vulnerability Analysis** - Analyzes Solidity smart contracts for security vulnerabilities using OpenAI's LLM
2. **Blockchain Transaction Fraud Detection** - Examines transactions on Ethereum, Polygon, and Avalanche for signs of fraud
3. **Chain-Agnostic Implementation** - Supports multiple blockchain networks with a unified analysis approach
4. **IPFS Integration** - Stores analysis reports on IPFS via QuickNode for decentralized, permanent storage

## Technology Stack

- **Node.js & Express** - Core backend framework
- **TypeScript** - Type-safe JavaScript implementation
- **Chainlink Functions** - For secure on-chain data retrieval
- **OpenAI API** - For generative AI analysis
- **IPFS (via QuickNode)** - For decentralized storage of reports
- **BitQuery** - For additional blockchain data querying
- **Winston** - For structured logging

## Supported Blockchain Networks

- Ethereum
- Polygon
- Avalanche

## Core Features

### Smart Contract Vulnerability Analysis
- Retrieves contract source code from Etherscan
- Analyzes code for vulnerabilities using OpenAI
- Categorizes vulnerabilities by severity (High/Medium/Low/Informational)
- Stores analysis reports on IPFS

### Transaction Fraud Analysis
- Multi-chain transaction data gathering (Ethereum, Polygon, Avalanche)
- Wallet behavior analysis
- AI-powered fraud detection with confidence ratings
- Standardized fraud type classification

## Project Structure

- `/app` - Main application code
  - `/ethTxnsAnalysis` - Ethereum transaction analysis
  - `/ethSmartContractAnalysis` - Ethereum smart contract analysis
  - `/avaxAnalysis` - Avalanche transaction analysis
  - `/polygonAnalysis` - Polygon transaction analysis
- `/common` - Shared utilities
  - `/blockChainUtil` - Blockchain interaction utilities
  - `/chainlinkUtil` - Chainlink functions integration
  - `/ipfs` - IPFS storage utilities
  - `/openAiUtils` - OpenAI API integration
- `/contract` - Smart contract ABIs and definitions
- `/test` - Test scripts and utilities

## Setup and Installation

### Prerequisites

- Node.js (v14+)
- API keys for:
  - OpenAI
  - Etherscan
  - Polygonscan
  - BitQuery
  - QuickNode IPFS
- Chainlink subscription ID and router address
- Private key for contract owner wallet

### Environment Variables

Create a `.env` file with the following variables:

```
# API Keys
OPENAI_API_KEY=your_openai_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key
POLY_SCAN_APIKEY=your_polygonscan_api_key
BITQUERY_API_KEY=your_bitquery_api_key
QUICKNOTE_API_KEY=your_quicknode_api_key

# Contract Owner
ContractOwner_privateKey=your_wallet_private_key

# Ethereum
ETH_SEPOLIA_routerAddress=your_router_address
ETH_subscriptionId=your_subscription_id
ETH_linkTokenAddress=your_link_token_address
ETH_donId=your_don_id
ETH_CONSUMER_CONTRACT_ADDRESS=your_consumer_contract

# Avalanche
AVAX_RPC_URL=your_avax_rpc_url
AVAX_API_BASE_URL=your_avax_api_url
AVAX_CONSUMER_ADDRESS=your_avax_consumer_address
AVAX_CHAINLINK_FUNCTION_ROUTER=your_avax_router
AVAX_CHAINLINK_SUBID=your_avax_subscription_id
AVAX_LINK_TOKEN_ADDRESS=your_avax_link_token
AVAX_CHAINLINK_DONID=your_avax_don_id

# Polygon
POLY_PROVIDER_URL=your_polygon_rpc_url
POLY_CONTRACT_ADDRESS=your_polygon_contract
POLY_TXN_CONTRACT_ADDRESS=your_polygon_txn_contract
POLY_CHAINLINK_SUBID=your_polygon_subscription_id
POLY_CHAINLIN_FNC_ROUTER=your_polygon_router
POLY_CHAINLINK_TOKEN_ADDRESS=your_polygon_link_token
POLY_CHAINLINK_DONID=your_polygon_don_id

# IPFS
QUICKNOTE_BASE_URL=your_quicknode_ipfs_url

# Ava Cloud
AVACLOUD_APIKEY=your_avacloud_api_key
AVACLOUD_CHAINID=your_avacloud_chain_id
AVACLOUD_BASEURL=your_avacloud_base_url
```

### Installation

1. Clone the repository
```bash
git clone https://github.com/your-username/blockchain-security-analysis-backend.git
cd blockchain-security-analysis-backend
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run startdev
```

Or for production:
```bash
npm run start
```

## API Endpoints

### Smart Contract Analysis

- `POST /ethContract/detect_vulnerability`
  - Body: `{ "code": "solidity_code_here", "version": "solidity_version" }`
  - Returns vulnerability analysis with severity ratings

- `POST /ethContract/getSmartContractSourceCodeByAddress`
  - Body: `{ "contractAddr": "0x..." }`
  - Returns source code for the specified contract address

### Transaction Fraud Analysis

- `POST /ethTxns/detect_fraud`
  - Body: `{ "hash": "transaction_hash" }`
  - Returns fraud analysis for Ethereum transactions

- `POST /avax/detect_fraud`
  - Body: `{ "hash": "transaction_hash" }`
  - Returns fraud analysis for Avalanche transactions

- `POST /polygon/detect_fraud`
  - Body: `{ "hash": "transaction_hash" }`
  - Returns fraud analysis for Polygon transactions

## Testing

Run the test suite with:

```bash
npm test
```

For testing specific components:

```bash
# Ethereum transaction analysis
npx ts-node test/app/ethTxnsAnalysis/txnsAnalysisController.ts

# Avalanche transaction analysis
npx ts-node test/app/avax/02_chainlinkSimulate/txnsAnalysisController.ts

# IPFS upload testing
npx ts-node test/app/ipfs/quickNodeUploadFile.ts
```

## Contributors

- [Kenneth Ng (kennethPakChungNg)](https://github.com/kennethPakChungNg) - Full Stack Developer
- [Hugo Leung (web3hugo1225)](https://github.com/web3hugo1225) - Full Stack Developer
- [Horace Ng (horraceng)](https://github.com/horraceng) - Full Stack Developer

## Acknowledgements

This project was developed for the Chainlink Hackathon 2024. It uses Chainlink Functions to securely access on-chain data and OpenAI's GPT models for security analysis.

## License

[MIT](LICENSE)
