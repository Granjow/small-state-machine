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

machine.fire( Triggers.makeClouds );
```

## Changelog

### v1.1.0 – 2021-03-29

* Changed: `whenFired` throws if the transition has no target state.
* Changed: Dependencies updated, moved `@types/jasmine` to dev dependencies
