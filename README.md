# Small State Machine

State machine with simple syntax and usage.

TypeScript example:

```typescript
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

machine.onStateChange( ( state ) => console.log( `Now in state ${state}!` ) );

machine.fire( Triggers.makeClouds );
```

## Changelog

### v1.2.2 

* Added source code documentation.

### v1.2.0 – 2021-04-13

* Added `SmallStateMachine.onStateChange` to listen to state changes
* Changed: Switch to `jest` for unit testing, remove non-dev dependencies

### v1.1.0 – 2021-03-29

* Changed: `whenFired` throws if the transition has no target state.
* Changed: Dependencies updated, moved `@types/jasmine` to dev dependencies
