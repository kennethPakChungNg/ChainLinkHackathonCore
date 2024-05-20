// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {FunctionsClient} from "@chainlink/contracts@1.1.0/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts@1.1.0/src/v0.8/shared/access/ConfirmedOwner.sol";
import {FunctionsRequest} from "@chainlink/contracts@1.1.0/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

/**
 * THIS IS AN EXAMPLE CONTRACT THAT USES HARDCODED VALUES FOR CLARITY.
 * THIS IS AN EXAMPLE CONTRACT THAT USES UN-AUDITED CODE.
 * DO NOT USE THIS CODE IN PRODUCTION.
 */
contract AvaxFunctionsConsumer is FunctionsClient, ConfirmedOwner {
    using FunctionsRequest for FunctionsRequest.Request;

    bytes32 public s_lastRequestId;
    bytes public s_lastResponse;
    bytes public s_lastError;

    address router = 0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0;
    error UnexpectedRequestID(bytes32 requestId);

    event Response(bytes32 indexed requestId, bytes response, bytes err);

    constructor(
        
    ) FunctionsClient(router) ConfirmedOwner(msg.sender) {}

    bytes32 donID = 0x66756e2d6176616c616e6368652d66756a692d31000000000000000000000000;
    uint32 gasLimit= 300000;
    string[] args = ["0x7d5fda43e4a74c127f3aeb89caf6f7dfefc337d4fd0133d3b393545440b88710","from","to"] ;
    string source = "const txns_hash = args[0] ;"
    "const requiredColumns = args.slice(1);"
    "const avaxTxDetailResponse = await Functions.makeHttpRequest({"
    " url: 'https://api.avax.network/ext/bc/C/rpc',"
    "method: 'POST',"
    "headers:{'Content-Type':'application/json'},"
    "data:{"
    "    'jsonrpc': '2.0', "
    "    'id':1, "
    "    'method': 'eth_getTransactionByHash',"
    "    'params': [ txns_hash]"
    "    }"
    "});"
    "if (avaxTxDetailResponse.error) {"
        "throw Error(`Request failed with message: ${avaxTxDetailResponse.message}`);"
    "}"
    "const response = avaxTxDetailResponse.data;"
    "let filteredData  = {} ;"
    "if ( response  != undefined && response != null ){"
        "const tx_details = response['result'] ; "
        "filteredData = Object.fromEntries(requiredColumns.map(key => [key, tx_details[key]]));"
    "}"
    "return Functions.encodeString(JSON.stringify(filteredData));" ;

    /**
     * @notice Send a simple request
     * @param encryptedSecretsUrls Encrypted URLs where to fetch user secrets
     * @param donHostedSecretsSlotID Don hosted secrets slotId
     * @param donHostedSecretsVersion Don hosted secrets version
     * @param subscriptionId Billing ID
     */
    function sendRequest(
        bytes memory encryptedSecretsUrls,
        uint8 donHostedSecretsSlotID,
        uint64 donHostedSecretsVersion,
        uint64 subscriptionId
    ) external onlyOwner returns (bytes32 requestId) {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);
        if (encryptedSecretsUrls.length > 0)
            req.addSecretsReference(encryptedSecretsUrls);
        else if (donHostedSecretsVersion > 0) {
            req.addDONHostedSecrets(
                donHostedSecretsSlotID,
                donHostedSecretsVersion
            );
        }
        if (args.length > 0) req.setArgs(args);
        s_lastRequestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            gasLimit,
            donID
        );
        return s_lastRequestId;
    }

    /**
     * @notice Send a pre-encoded CBOR request
     * @param request CBOR-encoded request data
     * @param subscriptionId Billing ID
     * @return requestId The ID of the sent request
     */
    function sendRequestCBOR(
        bytes memory request,
        uint64 subscriptionId
    ) external onlyOwner returns (bytes32 requestId) {
        s_lastRequestId = _sendRequest(
            request,
            subscriptionId,
            gasLimit,
            donID
        );
        return s_lastRequestId;
    }

    /**
     * @notice Store latest result/error
     * @param requestId The request ID, returned by sendRequest()
     * @param response Aggregated response from the user code
     * @param err Aggregated error from the user code or from the execution pipeline
     * Either response or error parameter will be set, but never both
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        if (s_lastRequestId != requestId) {
            revert UnexpectedRequestID(requestId);
        }
        s_lastResponse = response;
        s_lastError = err;
        emit Response(requestId, s_lastResponse, s_lastError);
    }
}
