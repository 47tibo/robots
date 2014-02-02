;(function( _w, _d, undefined ) {
  // -- shortcuts -> faster lookup
  var
    _F = _w.Function,
    _O = _w.Object,

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
    for ( var i = 0, l = this.observables.length; i < l; i += 1 ) {
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
    for ( var i = 0, l = this.observables.length; i < l; i += 1 ) {
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

  // abstract
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
        value: '',
        writable: true
      });
      _O.defineProperty( this, 'robots', {
        value: []
      });
      _O.defineProperty( this, 'robotsFieldSets', {
        writable: true
      });
      _O.defineProperty( this, 'marsTxt', {
        writable: true
      });
      _O.defineProperty( this, 'newRobotBtn', {
        writable: true
      });
      _O.defineProperty( this, 'startBtn', {
        writable: true
      });
      _O.defineProperty( this, 'resetBtn', {
        writable: true
      });
      _O.defineProperty( this, 'outputTxt', {
        writable: true
      });

      // UI
      this.marsTxt = _d.querySelector( '#mars-dimensions' );
      // cast into array
      this.robotsFieldSets = [].slice.call( _d.querySelectorAll( '.robot' ), 0),
      this.newRobotBtn = _d.querySelector( '#new-robot' );
      this.startBtn = _d.querySelector( '#start' );
      this.resetBtn = _d.querySelector( '#reset' );
      this.outputTxt = _d.querySelector( '#output' );

      // events
      this.startBtn.addEventListener( 'click', function startRobots( e ){
        e.preventDefault();
        this.start();
      }.bind( this ));

      this.newRobotBtn.addEventListener( 'click', function startRobots( e ){
        e.preventDefault();
        var newIndex = this.robotsFieldSets.length,
          latestFieldSet = this.robotsFieldSets[ newIndex - 1 ],
          newFieldSet = latestFieldSet.cloneNode( true );

        newFieldSet.id = 'robot-' + newIndex;
        // legend
        newFieldSet.querySelector('legend').textContent = 'Robot' + newIndex;

        // update array & append to DOM
        this.robotsFieldSets.push( newFieldSet );
        latestFieldSet.parentNode.insertBefore( newFieldSet, this.newRobotBtn );
      }.bind( this ));

      this.start = function start(){
        var
          marsDim = this.marsTxt.value,
          tmpFieldSet, tmpRobot;

        // inform robots of Mars' dimensions - TODO sanitize
        Robot.marsDimensions = marsDim;

        // init robots
        for ( var i = 0, l = this.robotsFieldSets.length; i < l; i += 1 ) {
          tmpFieldSet = this.robotsFieldSets[ i ];
          tmpRobot = new Robot( tmpFieldSet.querySelector( '#robot-position' ).value, i );
          // store ref to robot - see reset()
          this.robots.push( tmpRobot );
          // control panel observes robot subjects for 'status'
          tmpRobot.addObservable( this );
          // each robot observes CP for 'instructions'
          this.addObservable( tmpRobot );
        }

        for ( var i = 0, l = this.robotsFieldSets.length; i < l; i += 1 ) {
          tmpFieldSet = this.robotsFieldSets[ i ];
          this.notify({
            name: 'instructions',
            content: { val: tmpFieldSet.querySelector( '#robot-instruction' ).value, id: i }
          });
        }

      }

      var statusCount = 0;
      // listen to any robot's status
      this.addUpdateFn( 'status', function updateOutput( status ){
        // all messages are received synchronously
        this.output += status + '\n';
        statusCount += 1;
        if ( statusCount === this.robots.length ) {
          this.outputTxt.value = this.output;
        }
      });


      __controlPanel = this;
    }
    return __controlPanel;
  }

  function Robot( position, id ) {
    var position = position.split(' ');

    this.uber.init.call( this );

    _O.defineProperty( this, 'id', {
      value: id
    });
    _O.defineProperty( this, 'position', {
      value: {
        x: +position[ 0 ],
        y: +position[ 1 ],
        orientation: position[ 2 ],
        instruction: ''
      }
    });
    _O.defineProperty( this, 'nextPosition', {
      value: {
        x: +position[ 0 ],
        y: +position[ 1 ],
        orientation: position[ 2 ],
        instruction: ''
      }
    });
    _O.defineProperty( this, 'scent', {
      writable: true
    }); //undef

    // listen to any 'instructions'
    this.addUpdateFn( 'instructions', function moveOnInstructions( instructions ){
      if ( instructions.id === this.id ) {
        this.move( instructions.val );
      }
    });
  }

  // Robot static prop, only robots manage those tables, controlPanel dont have access
  _O.defineProperty( Robot, 'marsDimensions', {
    set: function( dimensions ) {
      dimensions = dimensions.split(' ');
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
      pointer;

    if ( this.scentTable[ x ] ) {
      pointer = this.scentTable[ x ];
      if ( pointer[ y ] ) {
        return true;
      }
    }
    return false;
  };
  Robot.storeScent = function storeScent( position ) {
    var
      x = position.x,
      y = position.y,
      pointer;

    if ( !this.scentTable[ x ] ) {
      this.scentTable[ x ] = {};
    }
    pointer = this.scentTable[ x ];

    if ( !pointer[ y ] ) {
      pointer[ y ] = {};
    }
  };
  Robot.isLost = function isLost( position ) {
    var
      x = position.x,
      y = position.y;

    return !!( x < 0 || x > this.marsX || y < 0 || y > this.marsY );
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
      direction = (options && options.direction) || 1,
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

    if ( Robot.isLost( nextPosition ) ) {
      if ( !Robot.isInScentTable( this.position ) ) {
        this.scent = this.position; // robot lost himself, but "don't move"
        Robot.storeScent( this.position ); // update scents
      } // else, dont move
    } else {
      // valid, move
      for ( var i in this.position ) {
        this.position[ i ] = nextPosition[ i ];
      }
    }

    if ( options && (options.increment -= 1) > 0 ) {
      this.translate( options );
    }

    // in any case return case for chaining
    return this;
  });

  Robot.method( 'move', function move( instructions ) {
    var instruction, status, scent, position, j;

    // possible that the instruction equals the whole instructions
    for ( var i = 0, l = instructions.length; i < l; ) {
      for ( j = i + 1; j < l + 1; j += 1 ) {
        instruction = instructions.slice( i, j );
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

    // status doesnt not contain instruction
    if ( this.scent ) {
      scent = this.scent;
      status = scent.x + ' ' + scent.y + ' ' + scent.orientation + ' LOST';
    } else {
      position = this.position;
      status = position.x + ' ' + position.y + ' ' + position.orientation;
    }
    this.notify({
      name: 'status',
      content: status
    });

  });


  // DEBUG
  // now create instructions using moves; 'this' is a robot instance
  // constraint: must start with a different letter
  Robot.addInstruction( 'F', function forward1(){
    this.translate();
  });
  Robot.addInstruction( '3B', function backward3(){
    this.translate( { increment: 3, direction: -1 } );
  });


  _w.ControlPanel = ControlPanel;
  _w.Robot = Robot;

  _d.addEventListener( 'DOMContentLoaded', function(){
    new ControlPanel();
  });

})( this, this.document );