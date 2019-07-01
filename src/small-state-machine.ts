interface TransitionResult<States> {
    targetState : States;
    ignoreTransition : boolean;
}

export class SmallStateMachine<States, Triggers> {

    constructor( initialState : States ) {
        this._initialState = initialState;
        this._currentState = initialState;
    }

    get currentState() : States {
        return this._currentState;
    }

    configure( state : States ) {
        if ( !this._stateDescriptions.has( state ) ) {
            this._stateDescriptions.set( state, new SmallStateDescription<States, Triggers>( state ) );
        }
        return this._stateDescriptions.get( state );
    }


    fire( trigger : Triggers ) {
        const currentStateDescription = this._stateDescriptions.get( this._currentState );
        if ( !currentStateDescription ) throw new Error( `State ${this._currentState} has not been configured.` );

        const transitionResult : TransitionResult<States> = currentStateDescription.whenFired( trigger );

        const targetState = transitionResult.targetState;
        if ( transitionResult.ignoreTransition ) {
            return;
        }
        if ( !targetState ) throw new Error( `Trigger ${trigger} is not permitted on state ${this._currentState}.` );


        const targetStateDescription = this._stateDescriptions.get( targetState );
        if ( !targetStateDescription ) throw new Error( `Target state ${targetState} has not been configured.` );

        currentStateDescription.exit();
        targetStateDescription.enter();

        this._currentState = targetState;
    }


    private _stateDescriptions : Map<States, SmallStateDescription<States, Triggers>> = new Map();
    private _currentState : States;
    private readonly _initialState : States;

}

export class SmallStateDescription<States, Triggers> {

    constructor( state : States ) {
        this._state = state;
    }

    onEntry( f : () => void ) : SmallStateDescription<States, Triggers> {
        this._entryHandler = f;
        return this;
    }

    onExit( f : () => void ) : SmallStateDescription<States, Triggers> {
        this._exitHandler = f;
        return this;
    }

    permit( trigger : Triggers, targetState : States ) : SmallStateDescription<States, Triggers> {
        if ( this._transitions.has( trigger ) ) {
            throw new Error( `Trigger ${trigger} is already defined for state ${this._state}.` );
        }
        this._transitions.set( trigger, targetState );
        return this;
    }

    ignore( trigger : Triggers ) : SmallStateDescription<States, Triggers> {
        if ( this._transitions.has( trigger ) ) throw new Error( `Trigger ${trigger} is already configured, cannot ignore it.` );
        if ( this._ignoredTriggers.has( trigger ) ) throw new Error( `Trigger ${trigger} is already ignored.` );
        this._ignoredTriggers.add( trigger );
        return this;
    }

    whenFired( trigger : Triggers ) : TransitionResult<States> {
        if ( this._ignoredTriggers.has( trigger ) ) return { targetState: this._state, ignoreTransition: true };
        return { targetState: this._transitions.get( trigger ), ignoreTransition: false };
    }

    enter() {
        if ( this._entryHandler ) {
            this._entryHandler();
        }
    }

    exit() {
        if ( this._exitHandler ) {
            this._exitHandler();
        }
    }

    private _entryHandler : Function;
    private _exitHandler : Function;
    private readonly _state : States;
    private readonly _ignoredTriggers : Set<Triggers> = new Set();
    private readonly _transitions : Map<Triggers, States> = new Map();

}