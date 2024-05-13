import {
    SubscriptionManager,
    SecretsManager,
    simulateScript,
    ResponseListener,
    ReturnType,
    decodeResult,
    FulfillmentCode,
} from "@chainlink/functions-toolkit" ;
import { Signer } from "@ethersproject/abstract-signer"
import {Wallet } from "@ethersproject/wallet"
import {Contract} from "@ethersproject/contracts"
import {formatBytes32String} from "@ethersproject/strings"
import {JsonRpcProvider} from "@ethersproject/providers";

import {arrayify } from "@ethersproject/bytes";
import { gWei2ETH } from "./blockChainUtil"

import logger from "./logger"

const explorerUrl = "https://sepolia.etherscan.io";

const chainlink_simulateScrpt = async(
    script:string, 
    args: string[], 
    bytesArgs:string[] ,
    secrets: Record<string, string>
)=>{
    try{
        logger.info( "try to simulate script. " )
        return await simulateScript({
            source: script,
            secrets: secrets,
            args: args ,
            bytesArgs: bytesArgs , // bytesArgs - arguments can be encoded off-chain to bytes.

        });
    }catch(err){
        logger.error("An error occurred:", err);
        throw err;
    }
}

const handleSimulateResult = (response:any, returnType: ReturnType )=>{
    console.log("Simulation result", response);
    const errorString = response.errorString;
    if (errorString) {
      console.log(`❌ Error during simulation: `, errorString);
    } else {
      const responseBytesHexstring = response.responseBytesHexstring;
  
      const lengthOfStr = arrayify(responseBytesHexstring).length
      if ( lengthOfStr > 0) {
        console.log( `Length of response : ${lengthOfStr}` )
        const decodedResponse = decodeResult(
          response.responseBytesHexstring,
          returnType
        );

        
        return decodedResponse;
      }
    }
    return null;
}

class CL_SubscriptionManager{
    private subscriptionManager: SubscriptionManager;
    private signer: Wallet;
    private linkTokenAddress = process.env.linkTokenAddress;
    private routerAddress ;
    private subscriptionId: number = Number(process.env.subscriptionId);
    private donId: string = process.env.donId ;

    constructor( signer: Wallet, routerAddress: string ){
        if (!signer ){
            throw new Error("Must provide contract signer.");
        }
        this.signer = signer;
        this.routerAddress = routerAddress;
        this.subscriptionManager = new SubscriptionManager({
            signer: signer,
            linkTokenAddress: this.linkTokenAddress ,
            functionsRouterAddress: this.routerAddress,
        });
        
    }

    public init = async()=>{
        await this.subscriptionManager.initialize();
    }

    public estimateFunctionsRequestCost = async( gasLimit:number )=>{
        logger.info("Estimate request costs...");
        // get gasPrice in wei
        const gasPriceWei = await this.signer.getGasPrice();

        const estimatedCostInJuels = await this.subscriptionManager.estimateFunctionsRequestCost({
            donId: this.donId, // ID of the DON to which the Functions request will be sent
            subscriptionId: this.subscriptionId, // Subscription ID
            callbackGasLimit: gasLimit, // Total gas used by the consumer contract's callback
            gasPriceWei: BigInt(gasPriceWei.toBigInt()), // Gas price in gWei
          });
        
        logger.info(
            `Fulfillment cost estimated to ${ gWei2ETH(estimatedCostInJuels )} LINK`
        );

        return estimatedCostInJuels;
    }

    public getSubId = ()=>{
        return this.subscriptionId;
    }

    public getDonId = ()=>{
        return this.donId;
    }

    public getRouterAddress= ()=>{
        return this.routerAddress;
    }

}

class CL_secretsManager{
    private routerAddress ;
    private secretsManager: SecretsManager;
    private donId: string = process.env.donId ;
    private signer: Wallet ;

    //location of secret stored
    private gatewayUrls = [
        "https://01.functions-gateway.testnet.chain.link/",
        "https://02.functions-gateway.testnet.chain.link/",
    ];
    constructor( signer: Wallet, routerAddress:string ){
        this.signer = signer ;
        this.routerAddress = routerAddress;
        this.secretsManager =  new SecretsManager({
            signer: signer,
            functionsRouterAddress: this.routerAddress,
            donId: this.donId,
        });
    }

    public init = async()=>{
        await this.secretsManager.initialize();
    }

    public async uploadSecretsToDON( secrets: Record<string, string>, slotId: number, expirationTimeMinutes: number ){
        logger.info(" Upload api secret to DON. ")
        // Encrypt secrets and upload to DON
        const encryptedSecretsObj = await this.secretsManager.encryptSecrets(secrets);

        logger.info(
            `Upload encrypted secret to gateways ${this.gatewayUrls}. slotId ${slotId}. Expiration in minutes: ${expirationTimeMinutes}`
        );

          // Upload secrets
        const uploadResult = await this.secretsManager.uploadEncryptedSecretsToDON({
            encryptedSecretsHexstring: encryptedSecretsObj.encryptedSecrets,
            gatewayUrls: this.gatewayUrls,
            slotId: slotId,
            minutesUntilExpiration: expirationTimeMinutes,
        });

        if (!uploadResult.success){
            throw new Error(`Encrypted secrets not uploaded to ${this.gatewayUrls}`);
        }

        
        logger.info(
            `\n✅ Secrets uploaded properly to gateways ${this.gatewayUrls}! Gateways response: `,
            uploadResult
        );

        return uploadResult ;
    }
}

class CL_FunctionConsumer{
    private functionsConsumer:Contract ;
    private consumerAddress:string = process.env.CONSUMER_CONTRACT_ADDRESS;
    private consumerAbi = require("../contract/FunctionsConsumer.json");

    constructor(signer:  Wallet){
        logger.info( "Initialize Contract. " )
        this.functionsConsumer = new Contract(
            this.consumerAddress,
            this.consumerAbi,
            signer
        )
    }

    /**
     * To call off-chain api data
     * @param apiScript 
     * @param encryptedSecretsUrls 
     * @param secretSlotId 
     * @param donHostedSecretsVersion 
     * @param apiRequestBody 
     * @param byteArgs |  bytesArgs - arguments can be encoded off-chain to bytes.
     * @returns 
     */
    public async sendRequest( 
        apiScript:string,
        encryptedSecretsUrls:string,
        secretSlotId: number,
        donHostedSecretsVersion:number,
        apiRequestBody:string[],
        byteArgs:string[],
        gasLimit:number,
        chainlinkSubId:number,
        chainlinkDonId:string
    ){
        logger.info("Make chalinlink function API call...")
        const transaction = await this.functionsConsumer.sendRequest(
            apiScript,encryptedSecretsUrls, 
            secretSlotId,donHostedSecretsVersion,
            apiRequestBody, byteArgs, 
            chainlinkSubId, gasLimit,
            formatBytes32String(chainlinkDonId)
        );

        // Log transaction details
        logger.info( `\n✅ Functions request sent! Transaction hash ${transaction.hash}. Waiting for a response...` );

        logger.info( `See your request in the explorer ${explorerUrl}/tx/${transaction.hash}` );

        return transaction
    }

    public async retrieveReponse( trans_hash:string, rpcProvider:JsonRpcProvider, routerAddress:string,decodeMethod: ReturnType){
        const responseListener = new ResponseListener({
            provider: rpcProvider,
            functionsRouterAddress: routerAddress,
        });

        const response = await responseListener.listenForResponseFromTransaction(trans_hash);

        logger.info( 'Recevied response' );

        this.fulfillmentErrorHanlding( response.fulfillmentCode , response);

        if (response.errorString) {
            logger.error(`Error during the execution:  ${response.errorString}`);
            return ""
        } 
        const responseBytesHexstring = response.responseBytesHexstring;
        const sizeOfString = arrayify(responseBytesHexstring).length;

        if ( sizeOfString > 0) {
            const decodedResponse = decodeResult(
                responseBytesHexstring, decodeMethod
            );
            logger.info(`\n✅ Decoded response to ${decodeMethod}, length : ${sizeOfString} bytes`);
            return decodedResponse;
        }

        //default returns empty;
        return ""
    }

    private fulfillmentErrorHanlding( fulfillmentCode:number, response:any ){

        let returnMsg = ''
        if (fulfillmentCode === FulfillmentCode.FULFILLED) {
          returnMsg += `\n✅ Request ${response.requestId} successfully fulfilled.\n`
        } else if (fulfillmentCode === FulfillmentCode.USER_CALLBACK_ERROR) {
          returnMsg += `\n⚠️ Request ${response.requestId} fulfilled. However, the consumer contract callback failed.`
        } else {
          returnMsg += `\n❌ Request ${response.requestId} not fulfilled.\n Code: ${fulfillmentCode}.`
        }
    
        returnMsg += `Cost is ${gWei2ETH(response.totalCostInJuels)} LINK. \n`
    
        //returnMsg += `Complete reponse: ${response}\n`
        logger.info(returnMsg)
    }
}

export { CL_SubscriptionManager, CL_secretsManager, 
    CL_FunctionConsumer, chainlink_simulateScrpt , handleSimulateResult}