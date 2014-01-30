;(function( _w, _d, undefined ) {
  // -- shortcuts -> faster lookup
  var
    _F = _w.Function;

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



})( this, this.document );