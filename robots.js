;(function( _w, _d, undefined ) {
  // -- shortcuts -> faster lookup
  var
    _F = _w.Function,
    _O = _w.Object,

    // misc vars
    i, l,

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
    var name = this.toString().match( /\s([^\(]+)/ )[ 1 ],
      proxy = _w.eval( 'function ' + name + '(){}' ),
      thisProto = this.prototype,
      uberProto = uber.prototype;
    proxy.prototype = uberProto;
    thisProto = new proxy();
    thisProto.constructor = this;
    thisProto.uber = uberProto;

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

  // singleton
  function ControlPanel() {
    if ( !__controlPanel ) {
      // use call, otherwise create props in prototype of uber!
      this.uber.init.call( this );
      this.init();
      __controlPanel = this;
    }
    return __controlPanel;
  }

  // singleton
  function Mars() {
    if ( !__mars ) {
      this.uber.init.call( this );
      this.init();
      __mars = this;
    }
    return __mars;
  }

  function Robot() {
    this.uber.init.call( this );
    this.init();
  }

  ControlPanel.inherits( Observable );
  Mars.inherits( Observable );
  Robot.inherits( Observable );

  // -- ControlPanel interface
  ControlPanel.method( 'init', function init() {
    _O.defineProperty( this, 'output', {
      value: ''
    });
    _O.defineProperty( this, 'mars', {});
    _O.defineProperty( this, 'robots', {
      value: []
    });
    _O.defineProperty( this, 'robotsFieldSets', {
      value: []
    });
  });

  ControlPanel.method( 'start', function start(){
    var
      marsDim = _w.querySelector( '#mars-dimensions' ).value,
      robotsFieldSets = _w.querySelectorAll( '.robot' ),
      tmpFieldSet, tmpRobot;

    // init Mars -- TODO sanitize
    this.mars = new Mars( marsDim );

    // init Robots
    for ( i = 0, l = robotsFieldSets.length; i < l; i += 1 ) {
      tmpFieldSet = robotsFieldSets[ i ];
      // store ref to UI
      this.robotsFieldSets.push( tmpFieldSet );
      // init robots - TODO sanitize
      tmpRobot = new Robot( tmpFieldSet.querySelector( '#robot-position' ).value );
      // store ref to robot - see reset()
      this.robots.push( tmpRobot );
    }
  });

})( this, this.document );