class CountdownLatch {
    private count:number;
    private resolveFunc ;
    private promise:Promise<any>;
    private results:any;
    constructor(count) {
      this.count = count;
      this.resolveFunc = null;
      this.promise = new Promise((resolve) => {
        this.resolveFunc = resolve;
      });

      this.results = {};
    }
  
    countDown(result, functionName) {
        this.count--;
        this.results[functionName]= result;
        if (this.count === 0) {
            this.resolveFunc();
        }
    }
  
    wait() {
      return this.promise;
    }

    getResults() {
        return this.results;
    }
}

export { CountdownLatch }