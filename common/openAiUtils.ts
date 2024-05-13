import logger from './logger';

import axios,{AxiosResponse } from 'axios';

const OPENAI_API_BASE_URL = 'https://api.openai.com'

const requestDirectQuestion = async(prompt: string, requestBody: any)=>{
    logger.info("Request openAi analysis.")
    const apiKey = process.env.OPENAI_API_KEY
    const url = `${OPENAI_API_BASE_URL}/v1/chat/completions`
    const data = requestBody  

    const headers = {'Authorization': `Bearer ${apiKey}`}

    const response:AxiosResponse  = await axios.post(url,data, {headers} );
    if ( response.status == 200 ){
        logger.info( "Successfully return result from OpenAI." )
        return response.data;
    }else{
        logger.error( `Error when OpenAI call to ${url}: ${response.data }`)
        throw new Error( `Error during API call: ${response.status}`  )
    }
    
}



export { requestDirectQuestion }