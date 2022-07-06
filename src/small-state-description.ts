import { ILogger } from "./i-logger";

export interface TransitionDescription<States> {
    targetState : States;
    guard? : () => boolean;
    description? : string;
}

interface TransitionResult<States> {
    targetState : States;
    ignoreTransition : boolean;
}

export interface TransitionOptions {
    guard? : () => boolean;
    description? : string;
}

export class SmallStateDescription<States, Triggers> {

    private readonly _state : States;
    private readonly _ignoredTriggers : Set<Triggers> = new Set();
    private readonly _transitions : Map<Triggers, TransitionDescription<States>[]> = new Map();
    private readonly _logger : ILogger | undefined;

    private _entryHandler : Function | undefined;
    private _exitHandler : Function | undefined;

    constructor( state : States, logger? : ILogger ) {
        this._state = state;
        this._logger = logger;
    }

    get transitions() : Map<Triggers, TransitionDescription<States>[]> {
        return new Map( this._transitions );
    }

    /**
     * Defines a callback that is called when entering this state.
     * Note that only one entry callback can be used, and it will not be called when the state machine is initialised
     * with its initial state.
     *
     * The state machine will already expose the new state as current state.
     *
     * @see onExit
     * @param f Callback
     */
    onEntry( f : () => void ) : SmallStateDescription<States, Triggers> {
        this._entryHandler = f;
        return this;
    }

    /**
     * Defines a callback that is called when leaving this state, before entering the next state.
     * @see onEntry
     * @param f Callback
     */
    onExit( f : () => void ) : SmallStateDescription<States, Triggers> {
        this._exitHandler = f;
        return this;
    }

    /**
     * Adds a state transition to the target state when the trigger/event is fired.
     *
     * When firing a trigger which is not permitted for that state, an error is thrown
     * unless the trigger is ignored with #ignore or when the state machine is configured
     * to ignore unconfigured transitions.
     *
     * When multiple transitions apply for a trigger, e.g. because multiple guards evaluate to true,
     * the transitions are evaluated in the order they are defined, so the first matching transition applies.
     *
     * @param trigger Trigger to allow
     * @param targetState Target state for the given trigger
     * @param opts Additional options for this transition
     */
    permit( trigger : Triggers, targetState : States, opts? : TransitionOptions ) : SmallStateDescription<States, Triggers> {
        this.ensureTransitionIsNoDuplicate( trigger, targetState, opts );

        const transitions = this._transitions.get( trigger ) ?? [];
        transitions.push( {
            targetState: targetState,
            guard: opts?.guard,
            description: opts?.description,
        } );

        this._transitions.set( trigger, transitions );

        return this;
    }

    /**
     * Ignore this trigger so it will not throw an error.
     */
    ignore( trigger : Triggers ) : SmallStateDescription<States, Triggers> {
        if ( this._transitions.has( trigger ) ) throw new Error( `Trigger ${trigger} is already configured, cannot ignore it in state ${this._state}.` );
        if ( this._ignoredTriggers.has( trigger ) ) throw new Error( `Trigger ${trigger} is already ignored in state ${this._state}.` );
        this._ignoredTriggers.add( trigger );
        return this;
    }

    /**
     * Describes what would happen with this trigger, e.g. target state
     */
    whenFired( trigger : Triggers, ignoreUnknown : boolean ) : TransitionResult<States> {
        if ( this._ignoredTriggers.has( trigger ) ) {
            return {
                targetState: this._state,
                ignoreTransition: true
            };
        }

        const transitions = this._transitions.get( trigger );
        if ( transitions === undefined ) {
            if ( ignoreUnknown ) {
                return {
                    targetState: this._state,
                    ignoreTransition: true,
                };
            }
            throw new Error( `No target state for trigger ${trigger} from state ${this._state}` );
        }

        const applicableTransition = transitions.find( ( transition ) => {
            if ( transition.guard === undefined ) {
                return true;
            }
            return transition.guard();
        } );

        if ( applicableTransition !== undefined ) {
            return {
                targetState: applicableTransition.targetState,
                ignoreTransition: false
            };
        } else {
            return {
                targetState: this._state,
                ignoreTransition: true,
            };
        }
    }

    enter() {
        this._logger?.trace( `Entering state ${this._state} …` );
        if ( this._entryHandler ) {
            this._entryHandler();
        }
        this._logger?.trace( `Entered state ${this._state}` );
    }

    exit() {
        this._logger?.trace( `Exiting state ${this._state} …` );
        if ( this._exitHandler ) {
            this._exitHandler();
        }
        this._logger?.trace( `Exited state ${this._state}` );
    }

    /**
     * Check if the same transition already exists
     */
    private ensureTransitionIsNoDuplicate( trigger : Triggers, targetState : States, opts? : TransitionOptions ) : void {
        const transition = this._transitions.get( trigger );
        if ( transition !== undefined ) {
            const guard = opts?.guard;

            const transitionWithoutGuardExists = transition.some( el => el.guard === undefined );
            if ( transitionWithoutGuardExists ) {
                throw new Error( `State ${this._state} already has a transition without guard on trigger ${trigger} to state ${targetState}. A further condition would never execute.` );
            }

            const transitionsToSameState = transition.filter( el => el.targetState === targetState );
            const transitionWithSameGuardExists = transitionsToSameState.some( el => el.guard === guard );
            if ( transitionWithSameGuardExists ) {
                throw new Error( `State ${this._state}: Transition with trigger ${trigger} to state ${targetState} already exists with this guard.` );
            }
        }
    }
}
