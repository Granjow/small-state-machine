import SmallStateMachine, { AsyncError } from '../src/small-state-machine';

describe( 'Small state machine', () => {

    enum States {
        A,
        B,
    }

    enum Triggers {
        a,
        b,
    }

    it( 'can be constructed', () => {
        expect( () => new SmallStateMachine( States.A ) ).not.toThrow();
    } );

    it( 'starts in the initial state', () => {
        const state = new SmallStateMachine( States.A );
        expect( state.currentState ).toBe( States.A );
    } );

    it( 'fires the exit condition', ( done ) => {
        const sm : SmallStateMachine<States, Triggers> = new SmallStateMachine( States.A );
        sm.configure( States.A )
            .onExit( done )
            .permit( Triggers.a, States.B );
        sm.configure( States.B );
        sm.fire( Triggers.a );
    } );

    it( 'fires the entry condition', ( done ) => {
        const sm : SmallStateMachine<States, Triggers> = new SmallStateMachine( States.A );
        sm.configure( States.A )
            .permit( Triggers.a, States.B );
        sm.configure( States.B )
            .onEntry( done );
        sm.fire( Triggers.a );
        expect( sm.currentState ).toBe( States.B );
    } );

    it( 'does not allow to define a trigger twice', () => {
        const sm : SmallStateMachine<States, Triggers> = new SmallStateMachine( States.A );
        expect( () => {
            sm.configure( States.A )
                .permit( Triggers.a, States.B )
                .permit( Triggers.a, States.B )
        } ).toThrow();
    } );

    it( 'can ignore triggers', () => {
        const sm : SmallStateMachine<States, Triggers> = new SmallStateMachine( States.A );
        sm.configure( States.A )
            .ignore( Triggers.a );

        expect( () => sm.fire( Triggers.a ) ).not.toThrow();
        expect( sm.currentState ).toBe( States.A );
    } );

    describe( 'Setup', () => {
        it( 'throws when ignoring a trigger twice', () => {
            const sm : SmallStateMachine<States, Triggers> = new SmallStateMachine( States.A );
            const definition = sm.configure( States.A ).ignore( Triggers.a );
            expect( () => definition.ignore( Triggers.a ) ).toThrow( 'already ignored' );
        } );
        it( 'throws when ignoring an existing trigger', () => {
            const sm : SmallStateMachine<States, Triggers> = new SmallStateMachine( States.A );
            const definition = sm.configure( States.A ).permit( Triggers.a, States.B );
            expect( () => definition.ignore( Triggers.a ) ).toThrow( 'already configured' );
        } );
    } );

    describe( 'Recursive fire()', () => {

        it( 'is disallowed and fires AsyncError', () => {
            const sm : SmallStateMachine<States, Triggers> = new SmallStateMachine( States.A );
            sm.configure( States.A )
                .permit( Triggers.a, States.B )
                .onExit( () => sm.fire( Triggers.b ) );
            sm.configure( States.B );

            expect( () => sm.fire( Triggers.a ) ).toThrow();
            try {
                sm.fire( Triggers.a )
            } catch ( err ) {
                expect( err instanceof AsyncError ).toBe( true );
            }

        } );

        it( 'detection is not triggered when using disallowed transition', () => {
            const sm : SmallStateMachine<States, Triggers> = new SmallStateMachine( States.A );
            sm.configure( States.A );

            expect( () => sm.fire( Triggers.a ) ).toThrow();

            try {
                sm.fire( Triggers.a )
            } catch ( err ) {
                expect( err instanceof AsyncError ).toBe( false );
            }

        } );

    } );

    describe( 'state change events', () => {
        it( 'emits event on state change', ( done ) => {
            const sm : SmallStateMachine<States, Triggers> = new SmallStateMachine( States.A );
            sm.configure( States.A )
                .permit( Triggers.a, States.B );
            sm.configure( States.B );

            sm.onStateChange( ( newState ) => {
                expect( newState ).toEqual( States.B );
                done();
            } );
            sm.fire( Triggers.a );
        } );

        it( 'does not emit event when staying in same state', ( done ) => {
            const sm : SmallStateMachine<States, Triggers> = new SmallStateMachine( States.A );
            sm.configure( States.A )
                .permit( Triggers.b, States.B );
            sm.configure( States.B )
                .permit( Triggers.a, States.A )
                .permit( Triggers.b, States.B );

            let stateChangeCount = 0;
            sm.onStateChange( ( newState ) => {
                if ( stateChangeCount === 0 ) {
                    stateChangeCount++;
                    expect( newState ).toEqual( States.B );
                } else {
                    expect( newState ).toEqual( States.A );
                    done();
                }
            } );
            sm.fire( Triggers.b );
            sm.fire( Triggers.b );
            sm.fire( Triggers.a );
        } );
    } );

    describe( 'Error handling', () => {
        it( 'throws if target state is not configured', () => {
            const sm : SmallStateMachine<States, Triggers> = new SmallStateMachine( States.A );
            sm.configure( States.A )
                .permit( Triggers.b, States.B );

            expect( () => sm.fire( Triggers.b ) ).toThrow( 'not been configured' );
        } );
        it( 'throws if trigger is not defined', () => {
            const sm : SmallStateMachine<States, Triggers> = new SmallStateMachine( States.A );
            sm.configure( States.A );

            expect( () => sm.fire( Triggers.b ) ).toThrow( 'No target state' );
        } );
        it( 'throws if initial state is not configured', () => {
            const sm : SmallStateMachine<States, Triggers> = new SmallStateMachine( States.A );

            expect( () => sm.fire( Triggers.a ) ).toThrow( 'State 0 has not been configured' );
        } );
    } );

} );


describe( 'Number enums', () => {

    enum States {
        Dough,
        Pasta,
    }

    enum Triggers {
        bake,
        shredder,
    }

    it( 'works', () => {
        const sm : SmallStateMachine<States, Triggers> = new SmallStateMachine( States.Dough );

        sm.configure( States.Dough )
            .permit( Triggers.bake, States.Pasta );

        sm.configure( States.Pasta )
            .permit( Triggers.shredder, States.Dough );

        expect( () => sm.fire( Triggers.bake ) ).not.toThrow();
        expect( () => sm.fire( Triggers.shredder ) ).not.toThrow();
    } );

} );

describe( 'Async behaviour', () => {

    enum States {
        Dough = 'Dough',
        Pasta = 'Pasta',
    }

    enum Triggers {
        bake = 'bake',
        shredder = 'shredder',
    }

    it( 'throws an error when changing the state inside an exit callback', () => {
        const sm : SmallStateMachine<States, Triggers> = new SmallStateMachine( States.Dough );

        sm.configure( States.Dough )
            .permit( Triggers.bake, States.Pasta );

        sm.configure( States.Pasta )
            .onExit( () => sm.fire( Triggers.shredder ) )
            .permit( Triggers.shredder, States.Dough );

        expect( () => sm.fire( Triggers.bake ) ).not.toThrow();
        expect( () => sm.fire( Triggers.shredder ) ).toThrow();

        try {
            sm.fire( Triggers.shredder );
            expect( 'trigger' ).toBe( 'throwing an error' );
        } catch ( e ) {
            expect( e instanceof AsyncError ).toBe( true );
        }

    } );

    it( 'throws an error when changing the state inside an enter callback', () => {
        const sm : SmallStateMachine<States, Triggers> = new SmallStateMachine( States.Dough );

        sm.configure( States.Dough )
            .permit( Triggers.bake, States.Pasta )
            .onEntry( () => sm.fire( Triggers.shredder ) );

        sm.configure( States.Pasta )
            .permit( Triggers.shredder, States.Dough );

        expect( () => sm.fire( Triggers.bake ) ).not.toThrow();
        expect( () => sm.fire( Triggers.shredder ) ).toThrow();

        try {
            sm.fire( Triggers.shredder );
            expect( 'trigger' ).toBe( 'throwing an error' );
        } catch ( e ) {
            expect( e instanceof AsyncError ).toBe( true );
        }

    } );

} );
