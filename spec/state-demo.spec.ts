import { SmallStateMachine } from '../src/small-state-machine';

enum States {
    Sunshine = 'Sunshine',
    Rain = 'Rain',
}

enum Triggers {
    makeClouds = 'make clouds',
    dispelClouds = 'dispel clouds',
}

const machine = new SmallStateMachine<States, Triggers>( States.Sunshine );

machine.configure( States.Sunshine )
    .onEntry( () => console.log( 'Let there be light!' ) )
    .onExit( () => console.log( 'I will be back!' ) )
    .permit( Triggers.makeClouds, States.Rain );
machine.configure( States.Rain )
    .permit( Triggers.dispelClouds, States.Sunshine );

machine.fire( Triggers.makeClouds );

describe( 'Demo state machine', () => {
    it( 'returns to sunny', ( done ) => {
        machine.configure( States.Sunshine )
            .onEntry( () => {
                expect( true ).toBe( true );
                done();
            } );
        machine.fire( Triggers.dispelClouds );
    } );
} );
