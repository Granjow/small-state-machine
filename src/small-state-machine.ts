import { EventEmitter } from "events";
import { ILogger } from "./i-logger";
import { SmallStateDescription, TransitionDescription } from "./small-state-description";

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

    get transitionMap() : Map<States, Map<Triggers, TransitionDescription<States>[]>> {
        const map : Map<States, Map<Triggers, TransitionDescription<States>[]>> = new Map();

        for ( const [ k, v ] of this._stateDescriptions ) {
            map.set( k, v.transitions );
        }

        return map;
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
            this.handleFire( trigger );
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
            this.transitionToState( this._initialState );
        }
    }

    private get currentStateDescription() : SmallStateDescription<States, Triggers> {
        const currentStateDescription = this._stateDescriptions.get( this._currentState );
        if ( !currentStateDescription ) {
            throw new Error( `State ${this._currentState} has not been configured.` );
        }
        return currentStateDescription;
    }

    private transitionToState( targetState : States ) : void {

        const targetStateDescription = this._stateDescriptions.get( targetState );
        if ( !targetStateDescription ) {
            throw new Error( `Target state ${targetState} has not been configured.` );
        }

        this.currentStateDescription.exit();
        targetStateDescription.enter();

        if ( this._currentState !== targetState ) {
            setImmediate( () => this._events.emit( 'new-state', targetState ) );
        }

        this._currentState = targetState;
    }

    private handleFire( trigger : Triggers ) : void {
        const transitionResult = this.currentStateDescription.whenFired( trigger, this._ignoreUnconfiguredEvents );
        const targetState = transitionResult.targetState;
        if ( transitionResult.ignoreTransition ) {
            return;
        }

        this.transitionToState( targetState );
    }


    private _stateDescriptions : Map<States, SmallStateDescription<States, Triggers>> = new Map();
    private _currentState : States;

    private _fireRunning : string | number | undefined = undefined;

    private readonly _initialState : States;

    private readonly _events = new EventEmitter();
    private readonly _logger : ILogger | undefined;
    private readonly _ignoreUnconfiguredEvents : boolean;
}

export class AsyncError extends Error {
}

export default SmallStateMachine;
