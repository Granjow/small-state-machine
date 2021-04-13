import { SmallStateMachine } from '../src/small-state-machine';


describe( 'Demo state machine', () => {
    enum States {
        Sunshine = 'Sunshine',
        Rain = 'Rain',
    }

    enum Triggers {
        makeClouds = 'make clouds',
        dispelClouds = 'dispel clouds',
    }

    let machine : SmallStateMachine<States, Triggers>;


    beforeEach( () => {
        machine = new SmallStateMachine<States, Triggers>( States.Sunshine );
        machine.configure( States.Sunshine )
            .permit( Triggers.makeClouds, States.Rain );
        machine.configure( States.Rain )
            .permit( Triggers.dispelClouds, States.Sunshine );

    } );

    it( 'returns to sunny', ( done ) => {
        machine.fire( Triggers.makeClouds );
        machine.configure( States.Sunshine )
            .onEntry( () => {
                expect( true ).toBe( true );
                done();
            } );
        machine.fire( Triggers.dispelClouds );
    } );
} );
