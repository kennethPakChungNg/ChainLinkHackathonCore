import express from 'express';
import createError from 'http-errors';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import ethTxnsAnalysisRouter from './app/ethTxnsAnalysis/txnsAnalysisRouter';
import ethSmartConRouter from './app/ethSmartContractAnalysis/ethSmartConRouter';
import avax_analysisRouter from './app/avaxAnalysis/avax_analysisRouter'
import polygonAnalysisRouter from './app/polygonAnalysis/polygonAnalysisRouter'

export default class Startup {
    app: any
    wb3StorageClient: any ;
    
    constructor(){
        this.app = express();
    }

    // Registers all middleware
    public async setup(){
        require('dotenv').config()

        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: false }));
        this.app.use(cookieParser());

        // register controller routes
        this.app.use('/ethTxns', ethTxnsAnalysisRouter);
        this.app.use('/ethContract', ethSmartConRouter);

        // Avalanche (AVAX)
        this.app.use('/avax', avax_analysisRouter);
        this.app.use('/polygon', polygonAnalysisRouter);
        
        this.app.use(function(req, res, next) {
            next(createError(404));
        });

        // error handler
        this.app.use(function(err, req, res, next) {
            // set locals, only providing error in development
            res.locals.message = err.message;
            res.locals.error = req.app.get('env') === 'development' ? err : {};
            
            // render the error page
            res.status(err.status || 500);
            res.render('error');
        });
    }

    //run the app on port
    public run(port: Number){
        //starting app on server
        this.app.listen(port, ()=>{
        console.log('Server Started...')
        })
    }

    public getWb3StorageClient(){
        return this.wb3StorageClient;
    }
}
  