import { createLogger, transports, format } from 'winston';

var logColors = {
    trace: 37,//'white',
    debug: 32,//'green',
    info: 32,//'green',
    warn: 33,//'yellow',
    crit: 31,//'red',
    fatal: 31, //'red',
    error: 31
  };

const logger = createLogger({
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
        format.printf(info => {
          const color = logColors[info.level] || '37';

          return `\x1b[36m${info.timestamp} \x1b[${color}m${info.level}\x1b[0m: ${info.message}`
        })
      ),
      transports: [
        new transports.File({
          filename: './logs/error.log',
          level: 'error',
          maxsize: 5242880, 
          maxFiles: 5, 
          format: format.json()
        }),
        new transports.File({
          filename: './logs/info.log',
          format: format.json(),
          maxsize: 5242880,
          maxFiles: 5
        }),

        new transports.Console(),
    ]
})


export default logger