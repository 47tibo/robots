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
      _O.defineProperty( this, 'outputTxt', {
        writable: true
      });
      _O.defineProperty( this, 'statusCount', {
        writable: true
      });
      _O.defineProperty( this, 'sane', {
        writable: true
      });

      // UI
      this.marsTxt = _d.querySelector( '#mars-dimensions' );
      // cast into array
      this.robotsFieldSets = [].slice.call( _d.querySelectorAll( '.robot' ), 0),
      this.newRobotBtn = _d.querySelector( '#new-robot' );
      this.startBtn = _d.querySelector( '#start' );
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

      // sanitization
      this.sanitizeMarsDim = function sanitizeMarsDim( txtField ) {
        var marsDim = txtField.value.trim(),
          check = marsDim.split(' ');
        for ( var i = 0; i < 2; i += 1 ) {
            if ( isNaN( +check[ i ] ) ) {
              this.sane = false;
            } else if ( +check[ i ] < 0 || +check[ i ] > 50 ) {
              this.sane = false;
            }
        }

        if ( !this.sane ) {
          txtField.style.backgroundColor = 'red';
          marsDim = '50 50'; // for next checks, max values
        } else {
          txtField.style.backgroundColor = '';
        }

        return marsDim;
      };

      this.sanitizePosition = function sanitizePosition( fieldSet ) {
        var elem = fieldSet.querySelector( '#robot-position' ),
          position = elem.value.trim(),
          check = position.split(' ');
        if ( isNaN( +check[ 0 ] ) || isNaN( +check[ 1 ] ) ) {
          this.sane = false;
        } else {
          if ( +check[ 0 ] > Robot.marsDimensions[ 0 ] || +check[ 0 ] < 0 ) {
            this.sane = false;
          }
          if ( +check[ 1 ] > Robot.marsDimensions[ 1 ] || +check[ 1 ] < 0 ) {
            this.sane = false;
          }
        }
        if ( 'NESW'.indexOf( check[ 2 ] ) < 0 ) {
          this.sane = false;
        }

        if ( !this.sane ) {
          elem.style.backgroundColor = 'red';
        } else {
          elem.style.backgroundColor = '';
        }

        return position;
      };

      this.sanitizeInstructions = function sanitizeInstructions( elem ) {
        var instructions = elem.value.trim();

        if ( instructions.length > 100 ) {
          this.sane = false;
        }

        for ( var i = 0; i < instructions.length ; i += 1 ) {
          // one instruction is limited to 2 char in length, eg 'F' or '3F' but not 'FORWARD'
          // ALWAYS put number BEFORE letter
          for ( var j = i + 1, l = i + 3; j < l; j += 1 ) {
            if ( !Robot.isInstruction( instructions.slice( i, j ) ) ) {
              if ( isNaN( +instructions.slice( i, j ) ) ) {
                this.sane = false;
                break
              } // else, on a number, lets see the 2nd char
            } else {
              i = j;
              break;
            }
          }
          if ( !this.sane ) {
            break;
          }
        }

        if ( !this.sane ) {
          elem.style.backgroundColor = 'red';
        } else {
          elem.style.backgroundColor = '';
        }

        return instructions;
      };

      // click on start
      this.start = function start(){
        var
          tmpFieldSet, tmpRobot, tmpPosition;

        // reset
        this.sane = true;
        this.output = '';
        this.statusCount = 0;
        Robot.initScentTable();

        // inform robots of Mars' dimensions
        Robot.marsDimensions = this.sanitizeMarsDim( this.marsTxt );

        // init robots
        for ( var i = 0, l = this.robotsFieldSets.length; i < l; i += 1 ) {
          tmpFieldSet = this.robotsFieldSets[ i ];
          tmpPosition = this.sanitizePosition( tmpFieldSet );
          if ( this.sane ) {
            if ( this.robots[ i ] ) {
              // already loaded -> reset robot
              this.robots[ i ].reset( tmpPosition );
            } else { // create brand new
              tmpRobot = new Robot( tmpPosition, i );
              // store ref to robot
              this.robots.push( tmpRobot );
              // control panel observes this robot for 'status'
              tmpRobot.addObservable( this );
              // this robot observes CP for 'instructions'
              this.addObservable( tmpRobot );
            }
          }
        }

        // check sane of each instructions for each bot
        var elemnt;
        if ( this.sane ) {
          for ( var i = 0, l = this.robotsFieldSets.length; i < l; i += 1 ) {
            elemnt = this.robotsFieldSets[ i ].querySelector( '#robot-instruction' );
            this.robotsFieldSets[ i ].querySelector( '#robot-instruction' ).value = this.sanitizeInstructions( elemnt );
          }
        }

        // @ this point we're sure of sanity
        if ( this.sane ) {
          // launch instructions
          for ( var i = 0, l = this.robotsFieldSets.length; i < l; i += 1 ) {
            tmpFieldSet = this.robotsFieldSets[ i ];
            this.notify({
              name: 'instructions',
              content: { val: tmpFieldSet.querySelector( '#robot-instruction' ).value, id: i }
            });
          }
        }
      }; // start

      // listen to any robot's status (one time)
      this.addUpdateFn( 'status', function updateOutput( status ){
        // all messages are received synchronously
        this.output += status + '\n';
        this.statusCount += 1;
        if ( this.statusCount === this.robots.length ) {
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
    });
    _O.defineProperty( this, 'rotateWheel', {
      value: [ 'N', 'E', 'S', 'W' ]
    });

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
    },
    get: function() {
      return [ this.marsX, this.marsY ];
    }
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
  Robot.initScentTable = function initScentTable() {
    this.scentTable = {};
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
    var orientation = this.rotateWheel.indexOf( this.position.orientation );

    // orientation is rotateWheel's index
    increment = increment % 4;
    orientation += increment;

    if ( orientation > 3 ) {
      // orientation == 4,5,6 -> loop @ the beginning
      orientation -= 4;
    }
    if ( orientation < 0 ) {
      // orientation == -1, -2, -3 -> loop @ the end
      orientation += 4;
    }

    // orientation is a letter
    orientation = this.rotateWheel[ orientation ];
    this.position.orientation = orientation;
    // translate is done with nextPosition -> update too
    this.nextPosition.orientation = orientation;

    return this;
  });

  // increment: 3, 6
  // direction 1 or -1 (forward / backward)
  // default forward & 1
  Robot.method( 'translate', function translate( options ){
    // always keep orientation
    // default one step by one & forward (ie direction = 1)
    var
      direction = (options && options.direction) || 1,
      // here nextPosition === position
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
      if ( !Robot.isInScentTable( this.position) ) { // robot dont recongnize scent -> lost
        if ( !this.scent ) { // a robot can ONLY lost himself 1 time = could happen on instructions like '3B'
          this.scent = this.position;
          Robot.storeScent( this.position ); // update scents
        } //aleady lost
      } else {
        // robot recognize scent -> reverse nextPosition for next move if any
        for ( var i in this.position ) {
          nextPosition[ i ] = this.position[ i ];
        }
      }
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
          // switch to next instruction in the seq
          i = j;
          break;
        } // enlarge window
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

  Robot.method( 'reset', function reset( position ) {
    var position = position.split(' ');
    this.position.x = +position[ 0 ];
    this.position.y = +position[ 1 ];
    this.position.orientation = position[ 2 ];

    this.nextPosition.x = +position[ 0 ];
    this.nextPosition.y = +position[ 1 ];
    this.nextPosition.orientation = position[ 2 ];

    // reset scent if robot was lost previously
    this.scent = undefined;
  });


  // DEBUG
  // now create instructions using moves; 'this' is a robot instance
  // constraint: must start with a different letter
  Robot.addInstruction( 'F', function forward1(){
    this.translate();
  });
  Robot.addInstruction( 'B', function backward1(){
    this.translate( { direction: -1 } );
  });
  Robot.addInstruction( '3B', function backward3(){
    this.translate( { increment: 3, direction: -1 } );
  });
  Robot.addInstruction( 'L', function left1(){
    this.rotate( -1 );
  });
  Robot.addInstruction( '3R', function right3(){
    this.rotate( 3 );
  });
  Robot.addInstruction( 'R', function right1(){
    this.rotate( 1 );
  });


  _w.ControlPanel = ControlPanel;
  _w.Robot = Robot;

  _d.addEventListener( 'DOMContentLoaded', function(){
    new ControlPanel();
  });

})( this, this.document );