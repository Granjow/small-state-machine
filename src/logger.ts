import { ILogger } from "./i-logger";
import { IInternalLogger, TLogLevel } from "./i-internal-logger";

export class Logger implements IInternalLogger{

    private _logLevel : TLogLevel;

    constructor( private readonly _logger? : ILogger, logLevel ? : TLogLevel ) {
        this._logLevel = logLevel ?? 'trace';
    }

    get logger() : ILogger | undefined {
        return this._logger;
    }

    get logLevel() : TLogLevel {
        return this._logLevel;
    }

    set logLevel( level : TLogLevel ) {
        this._logLevel = level;
    }

    log( message : string ) : void {
        if ( this._logger !== undefined ) {
            this._logger[ this._logLevel ]( message );
        }
    }
}
