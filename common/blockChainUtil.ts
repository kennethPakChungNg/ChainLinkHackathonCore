import {Wallet } from "@ethersproject/wallet"
import {JsonRpcProvider} from "@ethersproject/providers"
import {formatEther} from "@ethersproject/units";
import { BigNumberish } from "@ethersproject/bignumber";
import logger from "./logger"

class ContractIssuer {
    private privateKey: string = process.env.ContractOwner_privateKey;
    private rpcUrl: string = process.env.ETHEREUM_SEPOLIA_RPC_URL;

    private rpcProvider : JsonRpcProvider;
    private wallet : Wallet ;
    private signer : Wallet ;
    constructor (rpcUrl:string){
        logger.info( "Init info of contract issuer. " )
        this.rpcUrl = rpcUrl;

        if (!this.privateKey)
            throw new Error(
              "private key not provided - check your environment variables"
        );

        if (!this.rpcUrl){
            throw new Error(`rpcUrl not provided  - check your environment variables`);
        }

        this.rpcProvider = new JsonRpcProvider(this.rpcUrl);
        this.wallet = new Wallet(this.privateKey);
        this.signer = this.wallet.connect( this.rpcProvider);
    }

    public getEthersWallet = ()=>{
        return this.wallet
    }

    public getSigner = ()=>{
        // fetch default RPC URL of network: Sepolia 
        return this.signer;
    }

    public getRpcProvider = ()=>{
        // fetch default RPC URL of network: Sepolia 
        return this.rpcProvider;
    }
}


const gWei2ETH = (gWei: BigNumberish )=>{
    // = Number(gWei) / 10**18
    return  formatEther(gWei)  
}


export {ContractIssuer, gWei2ETH}