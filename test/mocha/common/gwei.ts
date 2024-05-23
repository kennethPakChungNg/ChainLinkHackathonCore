import { gWei2ETH} from "../../../common/blockChainUtil"
import { BigNumber } from "@ethersproject/bignumber";

describe('ETH', function() {

    it( 'Test overflow', ()=>{
        const amount = '1150012720001484000'
        //load testing json file
        console.log( `Number of digit: ${amount.length}. ` )
        
        const x = BigNumber.from(amount)
        console.log( `Balance: ${x}` )

        console.log( `gWei: ${gWei2ETH(x)}`)
    })
})