;(function( _w, _d, undefined ) {
  // -- shortcuts -> faster lookup
  var
    _F = _w.Function,
    _O = _w.Object,

    // misc vars
    i, j, l, lbis,

    // singletons, private
    __controlPanel, __mars;

  // -- extends Function for inheritance mechanisms
  // D. Crockford 'method' sugar
  _F.prototype.method = function method( name, fn ) {
    // hasOwnProperty necessary if we want to override uber methods
    if ( !this.prototype.hasOwnProperty( name ) ) {
      this.prototype[ name ] = fn;
    }

    return this;
  };

  _F.method( 'inherits', function inherits( uber ) {
    // proxy constructor pattern, Stoyan Stefanov
    // I add a little more to have a nice tree in DevTool
    // toString() will trim spaces if any
    var name = this.toString().match( /\s([^\(]+)/ )[ 1 ];
    _w.eval( 'var proxy = function ' + name + '(){}' );

    proxy.prototype = uber.prototype;
    this.prototype = new proxy();
    this.prototype.constructor = this;
    this.prototype.uber = uber.prototype;

    return this;
  });

  // -- Observable interface (abstract), both Observer & Subject
  // uber interface for Mars, Robot & ControlPanel
  function Observable() {}

  // I prefer put the initialization code in a specific 'init' method instead
  // in the constructor, here 'Observable' -> less coupling and separation of concerns
  Observable.method( 'init', function init() {
    _O.defineProperty( this, 'updates', {
      value: {}
    });
    _O.defineProperty( this, 'observables', {
      value: []
    });

    return this;
  });

  Observable.method( 'indexOf', function indexOf( observable ) {
    for ( i = 0, l = this.observables.length; i < l; i += 1 ) {
      if ( observable === this.observables[ i ] ) {
        return i;
      }
    }
    // mismatch
    return -1;
  });

  Observable.method( 'addObservable', function addObservable( observable ) {
    if ( observable instanceof Observable ) {
      this.observables.push( observable );
    }
    
    return this;
  });

  Observable.method( 'removeObservable', function removeObservable( observable ) {
    var index = this.indexOf( observable );
    if ( index > 0 ) {
      return this.observables.splice( index, 1 )[ 0 ];
    }
    // mismatch
    return null;
  });

  Observable.method( 'notify', function notify( message ) {
    for ( i = 0, l = this.observables.length; i < l; i += 1 ) {
      this.observables[ i ].update( message );
    }

    return this;
  });

  Observable.method( 'addUpdateFn', function addUpdateFn( name, fn ) {
    if ( !this.updates.hasOwnProperty( name ) ) {
      this.updates[ name ] = fn;
    }

    return this;
  });

  Observable.method( 'removeUpdateFn', function removeUpdateFn( name ) {
    if ( this.updates.hasOwnProperty( name ) ) {
      delete this.updates[ name ];
    }

    return this;
  });

  Observable.method( 'update', function update( message ) {
    var name, content;
    if ( message && typeof message.name === 'string' && message.content ) {
      name = message.name;
      content = message.content;
      if ( this.updates.hasOwnProperty( name ) ) {
        this.updates[ name ].call( this, content );
      }
    }
  });

  // -- all other interfaces inherits from Observable

  // ControlPanel interface, singleton
  function ControlPanel() {
    if ( !__controlPanel ) {
      // use call, otherwise create props in prototype of uber!
      this.uber.init.call( this );

      _O.defineProperty( this, 'output', {
        value: ''
      });
      _O.defineProperty( this, 'mars', {
        value: {}
      });
      _O.defineProperty( this, 'robots', {
        value: []
      });
      _O.defineProperty( this, 'robotsFieldSets', {
        value: []
      });

      this.start = function start(){
        var
          marsDim = _d.querySelector( '#mars-dimensions' ).value,
          robotsFieldSets = _d.querySelectorAll( '.robot' ),
          tmpFieldSet, tmpRobot;

        // init Mars -- TODO sanitize
        this.mars = new Mars( marsDim );

        // init Robots & send messages
        for ( i = 0, l = robotsFieldSets.length; i < l; i += 1 ) {
          tmpFieldSet = robotsFieldSets[ i ];
          // store ref to UI
          this.robotsFieldSets.push( tmpFieldSet );
          // init robots - TODO sanitize
          tmpRobot = new Robot();
          // store ref to robot - see reset()
          this.robots.push( tmpRobot );
          // TODO send message to Robot
          // tmpFieldSet.querySelector( '#robot-position' ).value
        }
      }

      __controlPanel = this;
    }
    return __controlPanel;
  }

  // -- Mars interface, singleton
  function Mars( dimensions ) {
    if ( !__mars ) {
      this.uber.init.call( this );
      this.init( dimensions );
      __mars = this;
    }
    return __mars;
  }

  function Robot() {
    this.uber.init.call( this );

    _O.defineProperty( this, 'position', {
      value: {
        x: 0,
        y: 0,
        orientation: 'N'
      }
    });
    _O.defineProperty( this, 'nextPosition', {
      value: {
        x: 0,
        y: 0,
        orientation: 'N'
      }
    });
    _O.defineProperty( this, 'lost', {
      value: false
    });

    // here observable code
  }

  // Robot static prop, only robots manage those tables, controlPanel dont have access
  _O.defineProperty( Robot, 'scentTable', {
    value: {}
  });
  _O.defineProperty( Robot, 'instructionsTable', {
    value: {}
  });
  Robot.addInstruction = function addInstruction( instruction, fn ) {
    if ( !Robot.instructionsTable.hasOwnProperty( instruction ) ) {
      Robot.instructionsTable[ instruction ] = fn;
    }
  };
  Robot.isInstruction = function isInstruction( instruction ) {
    return !!Robot.instructionsTable.hasOwnProperty( instruction );
  };
  Robot.isInScentTable = function isInScentTable( position ) {
    var
      x = position.x,
      y = position.y,
      orientation = position.orientation,
      pointer;

    if ( Robot.scentTable[ x ] ) {
      pointer = Robot.scentTable[ x ];
      if ( pointer[ y ] ) {
        pointer = pointer[ y ];
        if ( pointer[ orientation ] ) {
          pointer = pointer[ orientation ];
          if ( pointer[ instruction ] ) {
            return true;
          }
        }
      }
    }
    return false;
  };


  // prototype chains
  ControlPanel.inherits( Observable );
  Mars.inherits( Observable );
  Robot.inherits( Observable );


  // -- Robot interface
  Robot.method( 'move', function move( instructionSequence ) {
    var instruction, nextPosition;
    // possible that the instruction equals the whole instructionSequence
    for ( i = 0, l = instructionSequence.length; i < l; i += 1 ) {
      j = i + 1;
      lbis = l - i;
      for ( ; j < lbis; j += 1 ) {
        instruction = instructionSequence.slice( i, j );
        if ( Robot.isInstruction( instruction ) ) {
          // move robot following the instruction, detecting scents
          Robot.instructionsTable[ instruction ].call( this );
          // robot @ its new position (maybe lost?) -> send message to Mars

        } // else instruction ignored
        // get new instruction
        i = j;
        break;
      }
    }
  });

  // basic moves - compute next position
  // increment: 3, -6
  Robot.method( 'rotate', function rotate( increment ){
    return this;
  });

  // increment: 3, 6
  // direction 1 or -1 (forward / backward)
  Robot.method( 'translate', function translate( increment, direction ){
    // always keep orientation
    // default one step by one & forward (ie direction = 1)
    var
      increment = increment || 1,
      direction = direction || 1,
      nextPosition = this.nextPosition;

    if ( nextPosition.orientation === 'N' || nextPosition.orientation === 'S' ) {
      if ( nextPosition.orientation === 'N' ) {
        nextPosition.y += direction;
      } else {
        nextPosition.y -= direction;
      }
    } else {
      if ( nextPosition.orientation === 'E' ) {
        nextPosition.x += direction;
      } else {
        nextPosition.x -= direction;
      }
    }

    if ( Robot.isInScentTable( nextPosition ) ) {
      // go a move backward
      for ( i in this.position ) {
        nextPosition[ i ] = this.position[ i ];
      }
    } else {
      // valid move
      for ( i in this.position ) {
        this.position[ i ] = nextPosition[ i ];
      }
    }

    if ( typeof increment === 'number' && (increment -= 1) > 0 ) {
      forward( increment, direction );
    }

    // in any case return case for chaining
    return this;
  });

  // - Mars interface
  Mars.method( 'init', function init( dimensions ){

  });

  // DEBUG

  // now create instructions using moves; 'this' is a robot instance
  // constraint: must start with a different letter
  Robot.addInstruction( 'F', function forward1(){
    this.forward();
  });
  Robot.addInstruction( '3F', function forward3(){
    //this.forward( 3 );
  });


  _w.ControlPanel = ControlPanel;
  _w.Robot = Robot;

})( this, this.document );