import { AsyncError, SmallStateMachine } from '../src/small-state-machine';

describe( 'Small state machine', () => {

    enum States {
        A,
        B,
    }

    enum Triggers {
        a,
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
            expect( e instanceof AsyncError ).toBe( true, 'Expecting an AsyncError' );
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
            expect( e instanceof AsyncError ).toBe( true, 'Expecting an AsyncError' );
        }

    } );

} );
