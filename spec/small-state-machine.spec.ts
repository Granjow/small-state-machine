import { SmallStateMachine } from '../src/small-state-machine';

describe( 'Small state machine', () => {

    enum States {
        A,
        B,
    }

    enum Triggers {
        a, b,
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