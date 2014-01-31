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
  // uber interface for Robot & ControlPanel
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

        // inform robots of Mars' dimensions - TODO sanitize
        Robots.marsDimensions = marsDim;

        // init Robots & send messages
        for ( i = 0, l = robotsFieldSets.length; i < l; i += 1 ) {
          tmpFieldSet = robotsFieldSets[ i ];
          // store ref to UI
          this.robotsFieldSets.push( tmpFieldSet );
          // init robots
          tmpRobot = new Robot();
          // store ref to robot - see reset()
          this.robots.push( tmpRobot );
          // TODO sanitize
          tmpRobot.move( tmpFieldSet.querySelector( '#robot-position' ).value );
        }
      }

      __controlPanel = this;
    }
    return __controlPanel;
  }

  function Robot() {
    this.uber.init.call( this );

    _O.defineProperty( this, 'position', {
      value: {
        x: 0,
        y: 0,
        orientation: 'N',
        instruction: ''
      }
    });
    _O.defineProperty( this, 'nextPosition', {
      value: {
        x: 0,
        y: 0,
        orientation: 'N',
        instruction: ''
      }
    });
    _O.defineProperty( this, 'scent', {
      value: {}
    });

    // here observable code
  }

  // Robot static prop, only robots manage those tables, controlPanel dont have access
  _O.defineProperty( Robot, 'marsDimensions', {
    set: function( dimensions ) {
      var dimensions = dimensions.split[' '];
      this.marsX = dimensions[ 0 ];
      this.marsY = dimensions[ 1 ];
    }
  });
  _O.defineProperty( Robot, 'scentTable', {
    value: {}
  });
  _O.defineProperty( Robot, 'instructionsTable', {
    value: {}
  });
  Robot.addInstruction = function addInstruction( instruction, fn ) {
    if ( !this.instructionsTable.hasOwnProperty( instruction ) ) {
      this.instructionsTable[ instruction ] = fn;
    }
  };
  Robot.isInstruction = function isInstruction( instruction ) {
    return !!this.instructionsTable.hasOwnProperty( instruction );
  };
  Robot.isInScentTable = function isInScentTable( position ) {
    var
      x = position.x,
      y = position.y,
      orientation = position.orientation,
      pointer;

    if ( this.scentTable[ x ] ) {
      pointer = this.scentTable[ x ];
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
  Robot.storeScent = function storeScent( position ) {
    var
      x = position.x,
      y = position.y,
      orientation = position.orientation
      pointer;

    if ( !this.scentTable[ x ] ) {
      this.scentTable[ x ] = {};
    }
    pointer = this.scentTable[ x ];

    if ( !pointer[ y ] ) {
      pointer[ y ] = {};
    }
    pointer = pointer[ y ];

    if ( !pointer[ orientation ] ) {
      pointer[ orientation ] = {};
    }
    pointer = pointer[ orientation ];

    if ( !pointer[ instruction ] ) {
      pointer[ instruction ] = {};
    }
  };
  Robot.isLost = function isLost( position ) {
    var
      x = position.x,
      y = position.y;

    return !!( x < 0 || x > this.marsX || y < 0 || y > this.marsY );
  };


  // prototype chains
  ControlPanel.inherits( Observable );
  Robot.inherits( Observable );


  // -- Robot interface
  // basic moves - compute next position
  // increment: 3, -6
  Robot.method( 'rotate', function rotate( increment ){
    // TODO
    return this;
  });

  // increment: 3, 6
  // direction 1 or -1 (forward / backward)
  // default forward/1
  Robot.method( 'translate', function translate( options ){
    // always keep orientation
    // default one step by one & forward (ie direction = 1)
    var
      increment = options.increment || 1,
      direction = options.direction || 1,
      dirChar = direction === 1 ? 'F' : 'B',
      nextPosition = this.nextPosition,
      // before moving, store scentPosition, just in case
      scentPosition = {};

    for ( i in this.position ) {
      scentPosition[ i ] = this.position[ i ];
    }

    nextPosition.instruction = dirChar;

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
      // valid, move
      for ( i in this.position ) {
        this.position[ i ] = nextPosition[ i ];
      }
      // maybe lost for the first time? if so, store scent
      if ( !this.scent && Robot.isLost( this.position ) ) {
        Robot.storeScent( scentPosition );
        this.scent = scentPosition;
        // then we left the robot continues its move
      }
    }

    if ( typeof increment === 'number' && (increment -= 1) > 0 ) {
      forward( increment, direction );
    }

    // in any case return case for chaining
    return this;
  });

  Robot.method( 'move', function move( instructionSequence ) {
    var instruction, nextPosition;
    // store in case of lost
    this.instructionSequence = instructionSequence;

    // possible that the instruction equals the whole instructionSequence
    for ( i = 0, l = instructionSequence.length; i < l; i += 1 ) {
      j = i + 1;
      lbis = l - i;
      for ( ; j < lbis; j += 1 ) {
        instruction = instructionSequence.slice( i, j );
        if ( Robot.isInstruction( instruction ) ) {
          // move robot following the instruction => robot @ its new position (maybe lost?)
          Robot.instructionsTable[ instruction ].call( this );
          // find another instruction in the seq
          i = j;
          break;
        } // else, enlarge search window
      }
      // if scent, no need to continue further in seq
      if ( this.scent ) {
        break;
      }
    }

    if ( this.scent ) {
      // send message to ControlPanel with this.scent
    } else {
      // send message with this.position
    }
  });


  // DEBUG
  // now create instructions using moves; 'this' is a robot instance
  // constraint: must start with a different letter
  Robot.addInstruction( 'F', function forward1(){
    this.translate();
  });
  Robot.addInstruction( '3B', function backward3(){
    //this.translate( { increment: 3, direction: -1 } );
  });


  _w.ControlPanel = ControlPanel;
  _w.Robot = Robot;

})( this, this.document );