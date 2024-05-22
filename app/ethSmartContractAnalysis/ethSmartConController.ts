import logger from "../../common/logger"
import {requestDirectQuestion as analysisByOpenAI} from "../../common/openAiUtils"

import {getPrompt_contractAna} from "../ethSmartContractAnalysis/apiCall/openAi/openAi_smartCon"
import { ipfsUploadFile } from '../../common/ipfs/ipfsUtils';
import { getContractSourceCodeByAddress } from "../../common/etherScanUtil"


const getSmartContractSourceCodeByAddress = async(contractAddr: string) => {
  logger.info( ` Retrieve source code for smart contract [addr=${contractAddr}] from Etherscan.` )

  const responseBody = await getContractSourceCodeByAddress(contractAddr)

  // console.log("###############################")
  // console.log(responseBody[0].hasOwnProperty("SourceCode") )
  // console.log(responseBody[0].SourceCode)
  // console.log(responseBody[0]["SourceCode"])
  // console.log(responseBody[0])
  // console.log(responseBody)
  // console.log("###############################")
  // if (Object.keys(responseBody).length === 0 ){
  //     return {}
  // }
  

  return responseBody
}


const analyze_smart_contract = async( contractCode:string, solidityVersion:string ) =>{
    logger.info( " Generate prompt for vulnerability analysis of smart contract  . " )

    const prompt_vulnerability = getPrompt_contractAna( contractCode, solidityVersion )

    logger.info(`Prompt: \n${prompt_vulnerability}`)

    const requestBody = {
        'model': 'gpt-4-0125-preview',
        'messages': [
            {"role": "system", "content": prompt_vulnerability},
            {"role": "user", "content": "Analyze the smart contract"}
        ],
        'max_tokens': 1000,
        'temperature': 0.5 
    }

    const analysisResult = await analysisByOpenAI(  prompt_vulnerability, requestBody )
    const requiredContent = analysisResult['choices'][0]['message']['content']
    //logger.info( `Analysis result: ${JSON.stringify(analysisResult)}` )

    const sections = requiredContent.split('- **Vulnerability Security Level**:').slice(1);
    const structured_data = {
      Vulnerabilities: []
    };
    
    for (let section of sections) {
      section = '- **Vulnerability Security Level**:' + section;
      const vulnerability_data = {};
      console.log('vulnerability data section: ', section);
    
      const patterns = {
        Level: /- \*\*Vulnerability Security Level\*\*:\s*(.*?)\n/,
        Location: /\*\*Vulnerability Location\*\*:\s*(.*?)\n/,
        Type: /\*\*Vulnerability Type\*\*:\s*(.*?)\n/,
        Consequences: /\*\*Consequences\*\*:\s*(.*?)\n/,
        Recommendation: /\*\*Recommendation\*\*:\s*(.*?)\n/,
        Explanation: /\*\*Explanation\*\*:\s*([\s\S]*?)(?=\n-\s*\*\*|$)/,
      };
    
      for (let [key, regex] of Object.entries(patterns)) {
        const match = section.match(regex);
        if (match) {
          vulnerability_data[key] = match[1].trim();
        }
      }
    
      structured_data.Vulnerabilities.push(vulnerability_data);
      
    }

    console.log('Return structured data:', structured_data);

    return {"result":structured_data};

}

const uploadContractResult = async( promptResult:any )=>{
  const now = new Date()
  const dateFormated = now.toISOString().replace(/[-:.T]/g, '').slice(0, 14);
  const fileName  = `${dateFormated}.json`
  const ipfs = await ipfsUploadFile( fileName, JSON.stringify(promptResult) , 'application/json' )
  return ipfs
}


export {analyze_smart_contract, uploadContractResult, getSmartContractSourceCodeByAddress}