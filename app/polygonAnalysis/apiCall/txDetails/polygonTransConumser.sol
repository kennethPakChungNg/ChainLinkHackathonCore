// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

contract PolygonDemoFunctionsConsumer is FunctionsClient, ConfirmedOwner {
    using FunctionsRequest for FunctionsRequest.Request;

    bytes32 public s_lastRequestId;
    bytes public s_lastResponse;
    bytes public s_lastError;

    error UnexpectedRequestID(bytes32 requestId);


    event Response(bytes32 indexed requestId, bytes response, bytes err);

    /**server setup of polygon amoy testnet
    https://docs.chain.link/chainlink-functions/supported-networks#polygon-amoy-testnet
    */
    address router = 0xC22a79eBA640940ABB6dF0f7982cc119578E11De;
    uint32 gasLimit = 300000;
    bytes32 donID =
        0x66756e2d706f6c79676f6e2d616d6f792d310000000000000000000000000000;

    constructor() FunctionsClient(router) ConfirmedOwner(msg.sender) {}

    string source =
        "if ( secrets.apiKey == undefined ){throw Error(`Please provide poly scan apiKey`);}const polyscanKey = secrets.apiKey;const txnsHash =args[0];const dataRequired = args.slice(1);const txnUrl = `https://api-amoy.polygonscan.com/api?module=proxy&action=eth_getTransactionByHash&txhash=${txnsHash}&apikey=${polyscanKey}`;const newRequest = Functions.makeHttpRequest({url: txnUrl});const newRespose = await newRequest;if ( newRespose.error){throw Error(`Error on get tran details`);}const data = newRespose.data;if ( data['result'] == undefined ){throw Error('Error on fetching txns return.');}const txnResult = data['result'];let returnData = {};for ( const key of dataRequired ){returnData[key] = txnResult[key];}return Functions.encodeString(JSON.stringify(returnData));";

    function sendRequest(
        uint8 donHostedSecretsSlotID,
        uint64 donHostedSecretsVersion,
        uint64 subscriptionId,
        string memory transHash,
        string[] memory args
    )external onlyOwner
        returns (bytes32 requestId)
    {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);

        string[] memory newArgs = new string[](args.length + 1);
        newArgs[0] = transHash  ;
        for (uint i = 0; i < args.length; i++) {
            newArgs[i + 1] = args[i];
        }
        req.setArgs(newArgs);

        if (donHostedSecretsVersion > 0) {
            req.addDONHostedSecrets(
                donHostedSecretsSlotID,
                donHostedSecretsVersion
            );
        }

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
    function sendRequestCBOR(bytes memory request, uint64 subscriptionId)
        external
        onlyOwner
        returns (bytes32 requestId)
    {
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
