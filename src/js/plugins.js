/* jshint browser:true, jquery:true */

// Avoid `console` errors in browsers that lack a console.
(function () {
  var method;
  var noop = function () {};
  var methods = [
    'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
    'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
    'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
    'timeStamp', 'trace', 'warn'
  ];
  var length = methods.length;
  var console = (window.console = window.console || {});

  while (length--) {
    method = methods[length];

    // Only stub undefined methods.
    if (!console[method]) {
      console[method] = noop;
    }
  }
}());

// Place any jQuery/helper plugins in here.

// BBQ checks this deprecated jQuery feature
$.browser = {
  // Check for IE thanks to https://gist.github.com/527683
  msie: (function(d) {

    var undef, v = 3, div = d.createElement('div');

    // the while loop is used without an associated block: {}
    // so, only the condition within the () is executed.

    // semicolons arent allowed within the condition,
    //   so a comma is used to stand in for one
    // basically allowing the two separate statements
    //   to be evaluated sequentially.

    /*jshint -W116*/
    while (
      div.innerHTML = '<!--[if gt IE '+(++v)+']><i></i><![endif]-->',
      div.getElementsByTagName('i')[0]
    );
    /*jshint +W116*/

    // each time it's evaluated, v gets incremented and
    //   tossed into the DOM as a conditional comment
    // the i element is then a child of the div.

    // the return value of the getEBTN call is used as
    //   the final condition expression
    // if there is an i element (the IE conditional
    //   succeeded), then getEBTN's return is truthy
    // and the loop continues until there is no
    //   more i elements.

    // In other words:  ** MAGIC**

    return v > 4 ? v : undef;

  }(document))
};

// Google Analytics
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-38876227-1']);
_gaq.push(['_trackPageview']);

(function () {
  var ga = document.createElement('script');
  ga.type = 'text/javascript';
  ga.async = true;
  ga.src = ('https:' === document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(ga, s);
})();

// Google+
window.___gcfg = {lang: 'en-GB'};

(function () {
  var po = document.createElement('script');
  po.type = 'text/javascript';
  po.async = true;
  po.src = '//apis.google.com/js/plusone.js';
  var s = document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(po, s);
})();

// Twitter
/* jshint -W062, -W030 */
!function(d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0];
  if (!d.getElementById(id)) {
    js = d.createElement(s);
    js.async = true;
    js.id = id;
    js.src = 'https://platform.twitter.com/widgets.js';
    fjs.parentNode.insertBefore(js, fjs);
  }
}(document, 'script', 'twitter-wjs');
/* jshint +W062, +W030 */
