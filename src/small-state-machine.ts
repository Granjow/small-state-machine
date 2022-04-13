import { EventEmitter } from "events";
import { ILogger } from "./i-logger";

interface TransitionResult<States> {
    targetState : States;
    ignoreTransition : boolean;
}

export interface SmallStateMachineArgs {
    logger? : ILogger;
    ignoreUnconfiguredTriggers? : boolean;
}

export class SmallStateMachine<States extends ( string | number ), Triggers extends ( string | number )> {

    /**
     * Creates a new state which uses the provided state as initial state.
     * @param initialState Initial state
     * @param args Provide additional options for the state machine like a logger
     */
    constructor( initialState : States, args? : SmallStateMachineArgs ) {
        this._logger = args?.logger;
        this._initialState = initialState;
        this._currentState = initialState;
        this._ignoreUnconfiguredEvents = args?.ignoreUnconfiguredTriggers === true;
    }

    get currentState() : States {
        return this._currentState;
    }

    /**
     * Configure the given state, describing e.g. permitted transitions and callbacks
     *
     * @param state State to configure
     */
    configure( state : States ) : SmallStateDescription<States, Triggers> {
        const description = this._stateDescriptions.get( state ) ?? new SmallStateDescription( state, this._logger );
        this._stateDescriptions.set( state, description );
        return description;
    }

    /**
     * Fire a trigger (event) which causes the state machine to enter the next state.
     *
     * This method throws e.g.
     *
     * * if a `fire()` is already running
     * * if the state transition is not permitted
     *
     * @param trigger Event to trigger
     */
    fire( trigger : Triggers ) {
        this._logger?.trace( `Entering fire(${trigger}) in state ${this._currentState}` );
        if ( this._fireRunning !== undefined ) {
            throw new AsyncError( `Error in fire(${trigger}): fire(${this._fireRunning}) is already running! This probably means that a state change was triggered from an enter() or exit() callback. Use setImmediate() or setTimeout() for triggering inside a callback.` );
        }

        this._fireRunning = trigger;
        let error : any;
        try {
            this._handleFire( trigger );
        } catch ( err ) {
            error = err;
        }
        this._fireRunning = undefined;

        this._logger?.trace( `Exiting fire(${trigger}) in state ${this._currentState}. Throwing error: ${error !== undefined}` );

        if ( error ) throw error;
    }

    /**
     * Attaches a callback to state changes, i.e. when
     * @param cb
     */
    onStateChange( cb : ( newState : States ) => void ) : void {
        this._events.on( 'new-state', cb );
    }

    /**
     * Resets the state machine back to the initial state.
     */
    reset() : void {
        if ( this._currentState !== this._initialState ) {
            this._currentState = this._initialState;
            setImmediate( () => this._events.emit( 'new-state', this._initialState ) );
        }
    }


    private _handleFire( trigger : Triggers ) : void {

        const currentStateDescription = this._stateDescriptions.get( this._currentState );
        if ( !currentStateDescription ) {
            throw new Error( `State ${this._currentState} has not been configured.` );
        }

        const transitionResult = currentStateDescription.whenFired( trigger, this._ignoreUnconfiguredEvents );
        const targetState = transitionResult.targetState;
        if ( transitionResult.ignoreTransition ) {
            return;
        }

        const targetStateDescription = this._stateDescriptions.get( targetState );
        if ( !targetStateDescription ) {
            throw new Error( `Target state ${targetState} has not been configured.` );
        }

        currentStateDescription.exit();
        targetStateDescription.enter();

        if ( this._currentState !== targetState ) {
            setImmediate( () => this._events.emit( 'new-state', targetState ) );
        }

        this._currentState = targetState;
    }


    private _stateDescriptions : Map<States, SmallStateDescription<States, Triggers>> = new Map();
    private _currentState : States;

    private _fireRunning : string | number | undefined = undefined;

    private readonly _initialState : States;

    private readonly _events = new EventEmitter();
    private readonly _logger : ILogger | undefined;
    private readonly _ignoreUnconfiguredEvents : boolean;
}

export class SmallStateDescription<States, Triggers> {

    constructor( state : States, logger? : ILogger ) {
        this._state = state;
        this._logger = logger;
    }

    /**
     * Defines a callback that is called when entering this state.
     * Note that only one entry callback can be used, and it will not be called when the state machine is initialised
     * with its initial state.
     * @param f Callback
     */
    onEntry( f : () => void ) : SmallStateDescription<States, Triggers> {
        this._entryHandler = f;
        return this;
    }

    /**
     * Defines a callback that is called when leaving this state, before entering the next state.
     * See #onEntry
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
     * unless the trigger is ignored with #ignore.
     *
     * @param trigger Trigger to allow
     * @param targetState Target state for the given trigger
     */
    permit( trigger : Triggers, targetState : States ) : SmallStateDescription<States, Triggers> {
        if ( this._transitions.has( trigger ) ) {
            throw new Error( `Trigger ${trigger} is already defined for state ${this._state}.` );
        }
        this._transitions.set( trigger, targetState );
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

        const targetState = this._transitions.get( trigger );
        if ( targetState === undefined ) {
            if ( ignoreUnknown ) {
                return {
                    targetState: this._state,
                    ignoreTransition: true,
                };
            }
            throw new Error( `No target state for trigger ${trigger} from state ${this._state}` );
        }

        return {
            targetState,
            ignoreTransition: false
        };
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

    private _entryHandler : Function | undefined;
    private _exitHandler : Function | undefined;

    private readonly _state : States;
    private readonly _ignoredTriggers : Set<Triggers> = new Set();
    private readonly _transitions : Map<Triggers, States> = new Map();
    private readonly _logger : ILogger | undefined;
}

export class AsyncError extends Error {
}

export default SmallStateMachine;
