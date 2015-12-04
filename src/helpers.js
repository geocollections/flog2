/**
d3.js jsonp plugin.
*/
d3.jsonp = function (url, callback) {
  function rand() {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
      c = '', i = -1;
    while (++i < 15) c += chars.charAt(Math.floor(Math.random() * 52));
    return c;
  }

  function create(url) {
    var e = url.match(/callback=(\w+)/),//d3.jsonp.(\w+)/),
      c = e ? e[1] : rand();

     //d3.jsonp[c] = function(data) {
    this[c] = function(data) {
        callback(data);
        //delete d3.jsonp[c];
        delete c;
        script.remove();
    };
    //return 'd3.jsonp.' + c;
    return c;
  }

  var cb = create(url),
    script = d3.select('head')
    .append('script')
    .attr('type', 'text/javascript')
    .attr('src', url.replace(/(\{|%7B)callback(\}|%7D)/, cb));
};

/** 
Helper function to facilitate inheritance
*/
function extend(base, sub, prefix) {
    if(prefix) { // rename prototype properties
        for(var k in base.prototype) {
            Object.defineProperty(
                base.prototype,
                prefix+"_"+k,
                Object.getOwnPropertyDescriptor(base.prototype, k));
            delete base.prototype[k];
        }
    }
    var origProto = sub.prototype;
    sub.prototype = Object.create(base.prototype);
    for (var key in origProto) { sub.prototype[key] = origProto[key]; }
    sub.prototype.constructor = sub;
    Object.defineProperty(sub.prototype, "constructor", { 
        enumerable: false, value: sub });
}

function deepCopy(oldObj) {
    var newObj = oldObj;
    if (oldObj && typeof oldObj === 'object') {
        newObj = Object.prototype.toString.call(oldObj) === "[object Array]" ? [] : {};
        for (var i in oldObj) {
            newObj[i] = deepCopy(oldObj[i]);
        }
    }
    return newObj;
}
