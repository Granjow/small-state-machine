import { ILogger } from "../src/i-logger";
import { Logger } from "../src/logger";

describe( 'Logger', () => {

    it( 'trace logs by default', () => {

        // Arrange
        // @ts-ignore
        const logger : ILogger = {
            trace: jest.fn(),
        };
        const log = new Logger( logger );

        // Act
        log.log( 'Test' );

        // Assert
        expect( log.logLevel ).toBe( 'trace' );
        expect( logger.trace ).toHaveBeenCalledTimes( 1 );
    } );

    it( 'debug logs when configured', () => {

        // Arrange
        // @ts-ignore
        const logger : ILogger = {
            debug: jest.fn(),
        };
        const log = new Logger( logger, 'debug' );

        // Act
        log.log( 'Test' );

        // Assert
        expect( logger.debug ).toHaveBeenCalledTimes( 1 );
    } );

    it( 'changes log level', () => {

        // Arrange
        // @ts-ignore
        const logger : ILogger = {
            debug: jest.fn(),
        };
        const log = new Logger( logger );

        // Act
        log.logLevel = 'debug';
        log.log( 'Test' );

        // Assert
        expect( logger.debug ).toHaveBeenCalledTimes( 1 );
    } );
} );
