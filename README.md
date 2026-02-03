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

// Define transitions between sunshine and rain,
// and run actions when entering/exiting sunshine
machine.configure( States.Sunshine )
    .onEntry( () => console.log( 'Let there be light!' ) )
    .onExit( () => console.log( 'I will be back!' ) )
    .permit( Triggers.makeClouds, States.Rain );
machine.configure( States.Rain )
    .permit( Triggers.dispelClouds, States.Sunshine );

// Transition back to sunshine after one second
machine.addAutoTransition( States.Rain, States.Sunshine, Triggers.dispelClouds, 1000 );

// Do something when the state changes
machine.onStateChange( ( state ) => console.log( `Now in state ${state}!` ) );

// Trigger a state change
machine.fire( Triggers.makeClouds );
```

## Changelog

* **v4.2.0** (2026-02-03)
  * Added: `SmallStateDescription.describe('I am a state')` adds a text description to states
  * Changed: Dependencies updated
* **v4.1.0**
  * Added: `SmallStateMachine.addAutoTransition(from, to, trigger, timeout)` and
    `stopAllAutoTransitions()` to automatically continue to a new state after a timeout.
* **v4.0.0**
  * Added: Log level is now configurable
  * Breaking: `SmallStateDescription` requires a `Logger` object.
    This is only relevant when you extended this class.
* **v3.3.0**
  * Added: States can now have multiple `onEntry` and `onExit` callbacks
  * Added: Callbacks can have an optional name
* **v3.2.0** (2023-01-06)
  * Added: Initial state is now exposed on `StateMachine.initialState`
  * Changed: Code documentation improved
* **v3.1.0** (2022-09-27)
  * Added: Expose logger for subclasses extending SmallStateMachine
* **v3.0.0** (2022-07-06)
  * Breaking: `onEntry()` handlers now see the new (entered) state as current state.
    Prior to this version, `SmallStateMachine.currentState` was still set on the
    old state which hase been exited.
* **v2.2.0**
  * Added: Transitions can now have descriptions.
  * Added: `SmallStateMachine.transitionMap()` returns states with the corresponding
    transitions, allowing to get information about the state machine configuration.
* **v2.1.0**
  * Added: Transition can now have optional guard functions (conditions) which
    check if the transition should be taken. A state can have multiple
    transitions with the same trigger when all use guard functions.
  * Fixed: When `reset()`ting, the `onExit` of the old state and the `onEnter`
    of the initial state are now called.
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
