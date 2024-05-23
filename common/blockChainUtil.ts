import {Wallet } from "@ethersproject/wallet"
import {JsonRpcProvider} from "@ethersproject/providers"
import {formatEther} from "@ethersproject/units";
import { BigNumberish } from "@ethersproject/bignumber";
import logger from "./logger"
import { decodeResult } from "@chainlink/functions-toolkit";
//import { ethers } from "ethers";
//import { utils, BigNumber } from "ethers";

class ContractIssuer {
    private privateKey: string = process.env.ContractOwner_privateKey;
    private rpcUrl: string;

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

//overflow problem occur in here
const gWei2ETH = (gWei: BigNumberish )=>{
    // = Number(gWei) / 10**18

    return  formatEther(gWei)
}

const getWalletAnalysis = ( addressDetail: any ) =>{
    let time_diff_mins = null
    let min_value_received = null

    if ( addressDetail.length > 1 ){
        const first_tx_time = Number( addressDetail[0]['timeStamp'] )
        const last_tx_time = Number( addressDetail[addressDetail.length-1]['timeStamp'] )

        time_diff_mins = (last_tx_time-first_tx_time)/60
    }

    if (addressDetail.length >  0 ){
        min_value_received =  addressDetail.reduce((min, current) => {
            const currentValue = parseFloat(current.value);
            return currentValue < min ? currentValue : min;
        }, Infinity);
        
        //from Wei to ETH
        min_value_received = gWei2ETH(min_value_received)
    }

    return {
        time_diff_mins:time_diff_mins,
        min_value_received:min_value_received
    }
}

export {ContractIssuer, gWei2ETH ,getWalletAnalysis}