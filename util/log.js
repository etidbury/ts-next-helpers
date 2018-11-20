const {
    DISABLE_LOGS,
    LOG_LEVEL,
    LOG_TIMESTAMP,
    DEBUG
} = process.env

const isDebugging = DEBUG && DEBUG.length

// Disable console logs
if (DISABLE_LOGS) {
    const noOp = function() {} // no-op function

    const names = [
        'log',
        'debug',
        'info',
        'warn',
        'error',
        'assert',
        'dir',
        'dirxml',
        'group',
        'groupEnd',
        'time',
        'timeEnd',
        'count',
        'trace',
        'profile',
        'profileEnd'
    ]

    if (typeof window !== 'undefined') {
        names.forEach(name => {
            window.console[name] = noOp
        })
    }

    if (typeof global.console !== 'undefined') {
        names.forEach(name => {
            global.console[name] = noOp
        })
    }
}else{
    
    const pino = require('pino')

    const prettyPrintOptions = {
        colorize: true
    }
    if (LOG_TIMESTAMP){
        prettyPrintOptions.translateTime = 'SYS:standard'
    }

    // Use pino and override default console methods
    const log = pino({ 
        prettyPrint: prettyPrintOptions,
        timestamp: LOG_TIMESTAMP || false,
        base: {},
        level: LOG_LEVEL || (isDebugging && 'debug') || 'info' // @ref: http://getpino.io/#/docs/api?id=level-string
    })

    const _originalConsole = console
    ;[
        // 'log',
        // 'trace',
        'error',
        'info',
        'warn',
        'debug'
    ].forEach((n)=>{
        // eslint-disable-next-line no-console
        console[n] = function(){
            if (log[n])
                log[n].apply(log,arguments)
            else
                _originalConsole.log.apply(_originalConsole,arguments)
        }
    })

    console.info('> Prettifying console with Pino')

}