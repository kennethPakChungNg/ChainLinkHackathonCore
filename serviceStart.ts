
import Startup from './app'



const serverObj = new Startup();

const PORT: Number = Number(process.env.PORT || 5000)

serverObj.setup();
serverObj.run( PORT );

console.log(" Server is running, listening on port "+ PORT)    

