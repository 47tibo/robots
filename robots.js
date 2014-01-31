;(function( _w, _d, undefined ) {
  // -- shortcuts -> faster lookup
  var
    _F = _w.Function,
    _O = _w.Object,

    // misc vars
    i, l;

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
  Observable.method( 'init', function init( options ) {
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


})( this, this.document );