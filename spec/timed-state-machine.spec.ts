import SmallStateMachine from "../src/small-state-machine";

describe( 'Timed State Machine', () => {

    enum S {
        A = 'A',
        B = 'B',
    }

    enum E {
        go = 'go',
        back = 'back',
    }

    const delayMillis = ( millis : number ) : Promise<void> => new Promise( ( resolve ) => setTimeout( resolve, millis ) );


    it( 'auto-transitions', async () => {
        const sm = new SmallStateMachine<S, E>( S.A );

        sm.configure( S.A )
            .permit( E.go, S.B )
        ;
        sm.configure( S.B )
            .permit( E.back, S.A )
        ;

        sm.addAutoTransition( S.B, S.A, E.back, 10 );

        sm.fire( E.go );
        expect( sm.currentState ).toBe( S.B );
        await delayMillis( 50 );
        expect( sm.currentState ).toBe( S.A );
    } );

    it( 'does not auto-transition when aborted', async () => {
        const sm = new SmallStateMachine<S, E>( S.A );

        sm.configure( S.A )
            .permit( E.go, S.B )
        ;
        sm.configure( S.B )
            .permit( E.back, S.A )
        ;

        sm.addAutoTransition( S.B, S.A, E.back, 10 );

        sm.fire( E.go );
        expect( sm.currentState ).toBe( S.B );
        sm.stopAllAutoTransitions();
        await delayMillis( 50 );
        expect( sm.currentState ).toBe( S.B );
    } );
} );
