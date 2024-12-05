import { ILogger } from "./i-logger";

export type TLogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

export interface IInternalLogger {

    readonly logger : ILogger | undefined;
    logLevel : TLogLevel;

    log( message : string ) : void;
}
