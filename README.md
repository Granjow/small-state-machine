# Small State Machine

State machine with simple syntax and usage.

TypeScript example:

```typescript
import SmallStateMachine from 'small-state-machine'

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

* **v2.0.0**
  * Breaking: Constructor now takes a parameters object as second parameter to
    provide additional options like logger.
  * Added: The state machine can be configured not to throw if a trigger has
    not been configured on a state.
  * Added: The `reset()` command resets the state machine to the initial state.
    This is useful when using the state machine e.g. in the context of a [state
    chart](https://statecharts.dev/).
* **v1.4.0**
  * Added: Option for using a logger like [pino](https://www.npmjs.com/package/pino)
  * Fixed: The `StateMachine.currentState` is now the target state in the `onStateChange` event.
* **v1.3.0**
  * Added default export for SmallStateMachine
  * Improved error message on nested fire() calls
* **v1.2.2** 
  * Added source code documentation.
* **v1.2.0** – 2021-04-13
  * Added `SmallStateMachine.onStateChange` to listen to state changes
  * Changed: Switch to `jest` for unit testing, remove non-dev dependencies
* **v1.1.0** – 2021-03-29
  * Changed: `whenFired` throws if the transition has no target state.
  * Changed: Dependencies updated, moved `@types/jasmine` to dev dependencies
