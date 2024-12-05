import { SmallStateDescription } from "../src/small-state-description";
import { Logger } from "../src/logger";

describe( 'Small state description', () => {

    const log = new Logger();

    enum States {
        A = 'A',
        B = 'B',
        C = 'C',
    }

    enum Events {
        b = 'b',
        c = 'c',
    }

    describe( 'Guards', () => {

        it( 'supports default case', () => {
            const desc : SmallStateDescription<States, Events> = new SmallStateDescription( States.A, log );
            desc.permit( Events.b, States.B );
            const result = desc.whenFired( Events.b, false );
            expect( result.ignoreTransition ).toBe( false );
            expect( result.targetState ).toBe( States.B );
        } );

        it( 'throws error when adding second transition without guard', () => {
            const desc : SmallStateDescription<States, Events> = new SmallStateDescription( States.A, log );
            desc.permit( Events.b, States.B );
            expect( () => desc.permit( Events.b, States.C ) ).toThrow();
        } );

        it( 'throws when adding guard and default case exists', () => {
            const desc : SmallStateDescription<States, Events> = new SmallStateDescription( States.A, log );
            desc.permit( Events.b, States.B );
            expect( () => desc.permit( Events.b, States.B, { guard: () => true } ) ).toThrow();
        } );

        it( 'throws error when transition with the same guard already exists', () => {
            const desc : SmallStateDescription<States, Events> = new SmallStateDescription( States.A, log );
            const guard = () => true;
            desc.permit( Events.b, States.B, { guard } );
            expect( () => desc.permit( Events.b, States.B, { guard } ) ).toThrow();
        } );

        it( 'allows multiple guarded transitions', () => {
            const desc : SmallStateDescription<States, Events> = new SmallStateDescription( States.A, log );
            desc.permit( Events.b, States.B, { guard: () => false } );
            expect( () => desc.permit( Events.b, States.B, { guard: () => false } ) ).not.toThrow();
        } );

        it( 'evaluates guards (1)', () => {
            const desc : SmallStateDescription<States, Events> = new SmallStateDescription( States.A, log );
            desc.permit( Events.b, States.B, { guard: () => true } );
            desc.permit( Events.b, States.C, { guard: () => false } );

            const result = desc.whenFired( Events.b, false );
            expect( result.ignoreTransition ).toBe( false );
            expect( result.targetState ).toBe( States.B );
        } );

        it( 'evaluates guards (2)', () => {
            const desc : SmallStateDescription<States, Events> = new SmallStateDescription( States.A, log );
            desc.permit( Events.b, States.B, { guard: () => false } );
            desc.permit( Events.b, States.C, { guard: () => true } );

            const result = desc.whenFired( Events.b, false );
            expect( result.ignoreTransition ).toBe( false );
            expect( result.targetState ).toBe( States.C );
        } );

        it( 'returns unchanged when no guarded transition applies', () => {
            const desc : SmallStateDescription<States, Events> = new SmallStateDescription( States.A, log );
            desc.permit( Events.b, States.B, { guard: () => false } );
            desc.permit( Events.b, States.C, { guard: () => false } );

            const result = desc.whenFired( Events.b, false );
            expect( result.ignoreTransition ).toBe( true );
            expect( result.targetState ).toBe( States.A );
        } )
    } );

    describe( 'Logging', () => {

        it( 'logs on enter()', () => {
            // @ts-ignore
            const logger : Logger = {
                log: jest.fn(),
            };
            const desc : SmallStateDescription<States, Events> = new SmallStateDescription( States.A, logger );
            desc.enter();

            expect( logger.log ).toHaveBeenCalledTimes( 2 );
        } );

        it( 'logs on exit()', () => {
            // @ts-ignore
            const logger : Logger = {
                log: jest.fn(),
            };
            const desc : SmallStateDescription<States, Events> = new SmallStateDescription( States.A, logger );
            desc.exit();

            expect( logger.log ).toHaveBeenCalledTimes( 2 );
        } );
    } )
} );
