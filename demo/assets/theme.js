/* Simple jQuery Equal Heights @version 1.5.1. Copyright (c) 2013 Matt Banks. Dual licensed under the MIT and GPL licenses. */
!(function(a) {
  (a.fn.equalHeights = function() {
    var b = 0,
      c = a(this);
    return (
      c.each(function() {
        var c = a(this).innerHeight();
        c > b && (b = c);
      }),
      c.css('height', b)
    );
  }),
    a('[data-equal]').each(function() {
      var b = a(this),
        c = b.data('equal');
      b.find(c).equalHeights();
    });
})(jQuery);

/* Run function after window resize */
var afterResize = (function() {
  var t = {};
  return function(callback, ms, uniqueId) {
    if (!uniqueId) {
      uniqueId = "Don't call this twice without a uniqueId";
    }
    if (t[uniqueId]) {
      clearTimeout(t[uniqueId]);
    }
    t[uniqueId] = setTimeout(callback, ms);
  };
})();

window.theme = window.theme || {};

/* ================ VENDOR ================ */
/*!
 * enquire.js v2.1.2 - Awesome Media Queries in JavaScript
 * Copyright (c) 2014 Nick Williams - http://wicky.nillia.ms/enquire.js
 * License: MIT (http://www.opensource.org/licenses/mit-license.php)
 */
!function(a,b,c){var d=window.matchMedia;"undefined"!=typeof module&&module.exports?module.exports=c(d):"function"==typeof define&&define.amd?define(function(){return b[a]=c(d)}):b[a]=c(d)}("enquire",this,function(a){"use strict";function b(a,b){var c,d=0,e=a.length;for(d;e>d&&(c=b(a[d],d),c!==!1);d++);}function c(a){return"[object Array]"===Object.prototype.toString.apply(a)}function d(a){return"function"==typeof a}function e(a){this.options=a,!a.deferSetup&&this.setup()}function f(b,c){this.query=b,this.isUnconditional=c,this.handlers=[],this.mql=a(b);var d=this;this.listener=function(a){d.mql=a,d.assess()},this.mql.addListener(this.listener)}function g(){if(!a)throw new Error("matchMedia not present, legacy browsers require a polyfill");this.queries={},this.browserIsIncapable=!a("only all").matches}return e.prototype={setup:function(){this.options.setup&&this.options.setup(),this.initialised=!0},on:function(){!this.initialised&&this.setup(),this.options.match&&this.options.match()},off:function(){this.options.unmatch&&this.options.unmatch()},destroy:function(){this.options.destroy?this.options.destroy():this.off()},equals:function(a){return this.options===a||this.options.match===a}},f.prototype={addHandler:function(a){var b=new e(a);this.handlers.push(b),this.matches()&&b.on()},removeHandler:function(a){var c=this.handlers;b(c,function(b,d){return b.equals(a)?(b.destroy(),!c.splice(d,1)):void 0})},matches:function(){return this.mql.matches||this.isUnconditional},clear:function(){b(this.handlers,function(a){a.destroy()}),this.mql.removeListener(this.listener),this.handlers.length=0},assess:function(){var a=this.matches()?"on":"off";b(this.handlers,function(b){b[a]()})}},g.prototype={register:function(a,e,g){var h=this.queries,i=g&&this.browserIsIncapable;return h[a]||(h[a]=new f(a,i)),d(e)&&(e={match:e}),c(e)||(e=[e]),b(e,function(b){d(b)&&(b={match:b}),h[a].addHandler(b)}),this},unregister:function(a,b){var c=this.queries[a];return c&&(b?c.removeHandler(b):(c.clear(),delete this.queries[a])),this}},new g});
/* Modernizr 2.8.2 (Custom Build) | MIT & BSD
 * Build: http://modernizr.com/download/#-fontface-csstransforms-csstransforms3d-touch-cssclasses-teststyles-testprop-testallprops-prefixes-domprefixes-cssclassprefix:supports!
 */
;window.Modernizr=function(a,b,c){function z(a){j.cssText=a}function A(a,b){return z(m.join(a+";")+(b||""))}function B(a,b){return typeof a===b}function C(a,b){return!!~(""+a).indexOf(b)}function D(a,b){for(var d in a){var e=a[d];if(!C(e,"-")&&j[e]!==c)return b=="pfx"?e:!0}return!1}function E(a,b,d){for(var e in a){var f=b[a[e]];if(f!==c)return d===!1?a[e]:B(f,"function")?f.bind(d||b):f}return!1}function F(a,b,c){var d=a.charAt(0).toUpperCase()+a.slice(1),e=(a+" "+o.join(d+" ")+d).split(" ");return B(b,"string")||B(b,"undefined")?D(e,b):(e=(a+" "+p.join(d+" ")+d).split(" "),E(e,b,c))}var d="2.8.2",e={},f=!0,g=b.documentElement,h="modernizr",i=b.createElement(h),j=i.style,k,l={}.toString,m=" -webkit- -moz- -o- -ms- ".split(" "),n="Webkit Moz O ms",o=n.split(" "),p=n.toLowerCase().split(" "),q={},r={},s={},t=[],u=t.slice,v,w=function(a,c,d,e){var f,i,j,k,l=b.createElement("div"),m=b.body,n=m||b.createElement("body");if(parseInt(d,10))while(d--)j=b.createElement("div"),j.id=e?e[d]:h+(d+1),l.appendChild(j);return f=["&#173;",'<style id="s',h,'">',a,"</style>"].join(""),l.id=h,(m?l:n).innerHTML+=f,n.appendChild(l),m||(n.style.background="",n.style.overflow="hidden",k=g.style.overflow,g.style.overflow="hidden",g.appendChild(n)),i=c(l,a),m?l.parentNode.removeChild(l):(n.parentNode.removeChild(n),g.style.overflow=k),!!i},x={}.hasOwnProperty,y;!B(x,"undefined")&&!B(x.call,"undefined")?y=function(a,b){return x.call(a,b)}:y=function(a,b){return b in a&&B(a.constructor.prototype[b],"undefined")},Function.prototype.bind||(Function.prototype.bind=function(b){var c=this;if(typeof c!="function")throw new TypeError;var d=u.call(arguments,1),e=function(){if(this instanceof e){var a=function(){};a.prototype=c.prototype;var f=new a,g=c.apply(f,d.concat(u.call(arguments)));return Object(g)===g?g:f}return c.apply(b,d.concat(u.call(arguments)))};return e}),q.touch=function(){var c;return"ontouchstart"in a||a.DocumentTouch&&b instanceof DocumentTouch?c=!0:w(["@media (",m.join("touch-enabled),("),h,")","{#modernizr{top:9px;position:absolute}}"].join(""),function(a){c=a.offsetTop===9}),c},q.csstransforms=function(){return!!F("transform")},q.csstransforms3d=function(){var a=!!F("perspective");return a&&"webkitPerspective"in g.style&&w("@media (transform-3d),(-webkit-transform-3d){#modernizr{left:9px;position:absolute;height:3px;}}",function(b,c){a=b.offsetLeft===9&&b.offsetHeight===3}),a},q.fontface=function(){var a;return w('@font-face {font-family:"font";src:url("https://")}',function(c,d){var e=b.getElementById("smodernizr"),f=e.sheet||e.styleSheet,g=f?f.cssRules&&f.cssRules[0]?f.cssRules[0].cssText:f.cssText||"":"";a=/src/i.test(g)&&g.indexOf(d.split(" ")[0])===0}),a};for(var G in q)y(q,G)&&(v=G.toLowerCase(),e[v]=q[G](),t.push((e[v]?"":"no-")+v));return e.addTest=function(a,b){if(typeof a=="object")for(var d in a)y(a,d)&&e.addTest(d,a[d]);else{a=a.toLowerCase();if(e[a]!==c)return e;b=typeof b=="function"?b():b,typeof f!="undefined"&&f&&(g.className+=" supports-"+(b?"":"no-")+a),e[a]=b}return e},z(""),i=k=null,e._version=d,e._prefixes=m,e._domPrefixes=p,e._cssomPrefixes=o,e.testProp=function(a){return D([a])},e.testAllProps=F,e.testStyles=w,g.className=g.className.replace(/(^|\s)no-js(\s|$)/,"$1$2")+(f?" supports-js supports-"+t.join(" supports-"):""),e}(this,this.document);

/**
 * @license
 * lodash 4.5.1 (Custom Build) lodash.com/license | Underscore.js 1.8.3 underscorejs.org/LICENSE
 * Build: `lodash core -o ./dist/lodash.core.js`
 */
;(function(){function n(n,t){for(var r=-1,e=t.length,u=n.length;++r<e;)n[u+r]=t[r];return n}function t(n,t,r){for(var e=-1,u=n.length;++e<u;){var o=n[e],i=t(o);if(null!=i&&(c===an?i===i:r(i,c)))var c=i,f=o}return f}function r(n,t,r){var e;return r(n,function(n,r,u){return t(n,r,u)?(e=n,false):void 0}),e}function e(n,t,r,e,u){return u(n,function(n,u,o){r=e?(e=false,n):t(r,n,u,o)}),r}function u(n,t){return O(t,function(t){return n[t]})}function o(n){return n&&n.Object===Object?n:null}function i(n){return vn[n];
}function c(n){var t=false;if(null!=n&&typeof n.toString!="function")try{t=!!(n+"")}catch(r){}return t}function f(n,t){return n=typeof n=="number"||hn.test(n)?+n:-1,n>-1&&0==n%1&&(null==t?9007199254740991:t)>n}function a(n){if(Y(n)&&!Pn(n)){if(n instanceof l)return n;if(En.call(n,"__wrapped__")){var t=new l(n.__wrapped__,n.__chain__);return t.__actions__=N(n.__actions__),t}}return new l(n)}function l(n,t){this.__wrapped__=n,this.__actions__=[],this.__chain__=!!t}function p(n,t,r,e){var u;return(u=n===an)||(u=xn[r],
u=(n===u||n!==n&&u!==u)&&!En.call(e,r)),u?t:n}function s(n){return X(n)?Fn(n):{}}function h(n,t,r){if(typeof n!="function")throw new TypeError("Expected a function");return setTimeout(function(){n.apply(an,r)},t)}function v(n,t){var r=true;return $n(n,function(n,e,u){return r=!!t(n,e,u)}),r}function y(n,t){var r=[];return $n(n,function(n,e,u){t(n,e,u)&&r.push(n)}),r}function _(t,r,e,u){u||(u=[]);for(var o=-1,i=t.length;++o<i;){var c=t[o];r>0&&Y(c)&&L(c)&&(e||Pn(c)||K(c))?r>1?_(c,r-1,e,u):n(u,c):e||(u[u.length]=c);
}return u}function g(n,t){return n&&qn(n,t,en)}function b(n,t){return y(t,function(t){return Q(n[t])})}function j(n,t,r,e,u){return n===t?true:null==n||null==t||!X(n)&&!Y(t)?n!==n&&t!==t:m(n,t,j,r,e,u)}function m(n,t,r,e,u,o){var i=Pn(n),f=Pn(t),a="[object Array]",l="[object Array]";i||(a=kn.call(n),"[object Arguments]"==a&&(a="[object Object]")),f||(l=kn.call(t),"[object Arguments]"==l&&(l="[object Object]"));var p="[object Object]"==a&&!c(n),f="[object Object]"==l&&!c(t);return!(l=a==l)||i||p?2&u||(a=p&&En.call(n,"__wrapped__"),
f=f&&En.call(t,"__wrapped__"),!a&&!f)?l?(o||(o=[]),(a=J(o,function(t){return t[0]===n}))&&a[1]?a[1]==t:(o.push([n,t]),t=(i?I:q)(n,t,r,e,u,o),o.pop(),t)):false:r(a?n.value():n,f?t.value():t,e,u,o):$(n,t,a)}function d(n){var t=typeof n;return"function"==t?n:null==n?cn:("object"==t?x:A)(n)}function w(n){n=null==n?n:Object(n);var t,r=[];for(t in n)r.push(t);return r}function O(n,t){var r=-1,e=L(n)?Array(n.length):[];return $n(n,function(n,u,o){e[++r]=t(n,u,o)}),e}function x(n){var t=en(n);return function(r){
var e=t.length;if(null==r)return!e;for(r=Object(r);e--;){var u=t[e];if(!(u in r&&j(n[u],r[u],an,3)))return false}return true}}function E(n,t){return n=Object(n),P(t,function(t,r){return r in n&&(t[r]=n[r]),t},{})}function A(n){return function(t){return null==t?an:t[n]}}function k(n,t,r){var e=-1,u=n.length;for(0>t&&(t=-t>u?0:u+t),r=r>u?u:r,0>r&&(r+=u),u=t>r?0:r-t>>>0,t>>>=0,r=Array(u);++e<u;)r[e]=n[e+t];return r}function N(n){return k(n,0,n.length)}function S(n,t){var r;return $n(n,function(n,e,u){return r=t(n,e,u),
!r}),!!r}function T(t,r){return P(r,function(t,r){return r.func.apply(r.thisArg,n([t],r.args))},t)}function F(n,t,r,e){r||(r={});for(var u=-1,o=t.length;++u<o;){var i=t[u],c=e?e(r[i],n[i],i,r,n):n[i],f=r,a=f[i];En.call(f,i)&&(a===c||a!==a&&c!==c)&&(c!==an||i in f)||(f[i]=c)}return r}function R(n){return V(function(t,r){var e=-1,u=r.length,o=u>1?r[u-1]:an,o=typeof o=="function"?(u--,o):an;for(t=Object(t);++e<u;){var i=r[e];i&&n(t,i,e,o)}return t})}function B(n){return function(){var t=arguments,r=s(n.prototype),t=n.apply(r,t);
return X(t)?t:r}}function D(n,t,r){function e(){for(var o=-1,i=arguments.length,c=-1,f=r.length,a=Array(f+i),l=this&&this!==wn&&this instanceof e?u:n;++c<f;)a[c]=r[c];for(;i--;)a[c++]=arguments[++o];return l.apply(t,a)}if(typeof n!="function")throw new TypeError("Expected a function");var u=B(n);return e}function I(n,t,r,e,u,o){var i=-1,c=1&u,f=n.length,a=t.length;if(f!=a&&!(2&u&&a>f))return false;for(a=true;++i<f;){var l=n[i],p=t[i];if(void 0!==an){a=false;break}if(c){if(!S(t,function(n){return l===n||r(l,n,e,u,o);
})){a=false;break}}else if(l!==p&&!r(l,p,e,u,o)){a=false;break}}return a}function $(n,t,r){switch(r){case"[object Boolean]":case"[object Date]":return+n==+t;case"[object Error]":return n.name==t.name&&n.message==t.message;case"[object Number]":return n!=+n?t!=+t:n==+t;case"[object RegExp]":case"[object String]":return n==t+""}return false}function q(n,t,r,e,u,o){var i=2&u,c=en(n),f=c.length,a=en(t).length;if(f!=a&&!i)return false;for(var l=f;l--;){var p=c[l];if(!(i?p in t:En.call(t,p)))return false}for(a=true;++l<f;){
var p=c[l],s=n[p],h=t[p];if(void 0!==an||s!==h&&!r(s,h,e,u,o)){a=false;break}i||(i="constructor"==p)}return a&&!i&&(r=n.constructor,e=t.constructor,r!=e&&"constructor"in n&&"constructor"in t&&!(typeof r=="function"&&r instanceof r&&typeof e=="function"&&e instanceof e)&&(a=false)),a}function z(n){var t=n?n.length:an;if(W(t)&&(Pn(n)||nn(n)||K(n))){n=String;for(var r=-1,e=Array(t);++r<t;)e[r]=n(r);t=e}else t=null;return t}function C(n){var t=n&&n.constructor,t=Q(t)&&t.prototype||xn;return n===t}function G(n){
return n?n[0]:an}function J(n,t){return r(n,d(t),$n)}function M(n,t){return $n(n,typeof t=="function"?t:cn)}function P(n,t,r){return e(n,d(t),r,3>arguments.length,$n)}function U(n,t){var r;if(typeof t!="function")throw new TypeError("Expected a function");return n=Un(n),function(){return 0<--n&&(r=t.apply(this,arguments)),1>=n&&(t=an),r}}function V(n){var t;if(typeof n!="function")throw new TypeError("Expected a function");return t=In(t===an?n.length-1:Un(t),0),function(){for(var r=arguments,e=-1,u=In(r.length-t,0),o=Array(u);++e<u;)o[e]=r[t+e];
for(u=Array(t+1),e=-1;++e<t;)u[e]=r[e];return u[t]=o,n.apply(this,u)}}function H(n,t){return n>t}function K(n){return Y(n)&&L(n)&&En.call(n,"callee")&&(!Rn.call(n,"callee")||"[object Arguments]"==kn.call(n))}function L(n){return null!=n&&!(typeof n=="function"&&Q(n))&&W(zn(n))}function Q(n){return n=X(n)?kn.call(n):"","[object Function]"==n||"[object GeneratorFunction]"==n}function W(n){return typeof n=="number"&&n>-1&&0==n%1&&9007199254740991>=n}function X(n){var t=typeof n;return!!n&&("object"==t||"function"==t);
}function Y(n){return!!n&&typeof n=="object"}function Z(n){return typeof n=="number"||Y(n)&&"[object Number]"==kn.call(n)}function nn(n){return typeof n=="string"||!Pn(n)&&Y(n)&&"[object String]"==kn.call(n)}function tn(n,t){return t>n}function rn(n){return typeof n=="string"?n:null==n?"":n+""}function en(n){var t=C(n);if(!t&&!L(n))return Dn(Object(n));var r,e=z(n),u=!!e,e=e||[],o=e.length;for(r in n)!En.call(n,r)||u&&("length"==r||f(r,o))||t&&"constructor"==r||e.push(r);return e}function un(n){for(var t=-1,r=C(n),e=w(n),u=e.length,o=z(n),i=!!o,o=o||[],c=o.length;++t<u;){
var a=e[t];i&&("length"==a||f(a,c))||"constructor"==a&&(r||!En.call(n,a))||o.push(a)}return o}function on(n){return n?u(n,en(n)):[]}function cn(n){return n}function fn(t,r,e){var u=en(r),o=b(r,u);null!=e||X(r)&&(o.length||!u.length)||(e=r,r=t,t=this,o=b(r,en(r)));var i=X(e)&&"chain"in e?e.chain:true,c=Q(t);return $n(o,function(e){var u=r[e];t[e]=u,c&&(t.prototype[e]=function(){var r=this.__chain__;if(i||r){var e=t(this.__wrapped__);return(e.__actions__=N(this.__actions__)).push({func:u,args:arguments,
thisArg:t}),e.__chain__=r,e}return u.apply(t,n([this.value()],arguments))})}),t}var an,ln=1/0,pn=/[&<>"'`]/g,sn=RegExp(pn.source),hn=/^(?:0|[1-9]\d*)$/,vn={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;","`":"&#96;"},yn={"function":true,object:true},_n=yn[typeof exports]&&exports&&!exports.nodeType?exports:an,gn=yn[typeof module]&&module&&!module.nodeType?module:an,bn=gn&&gn.exports===_n?_n:an,jn=o(yn[typeof self]&&self),mn=o(yn[typeof window]&&window),dn=o(yn[typeof this]&&this),wn=o(_n&&gn&&typeof global=="object"&&global)||mn!==(dn&&dn.window)&&mn||jn||dn||Function("return this")(),On=Array.prototype,xn=Object.prototype,En=xn.hasOwnProperty,An=0,kn=xn.toString,Nn=wn._,Sn=wn.Reflect,Tn=Sn?Sn.f:an,Fn=Object.create,Rn=xn.propertyIsEnumerable,Bn=wn.isFinite,Dn=Object.keys,In=Math.max,$n=function(n,t){
return function(r,e){if(null==r)return r;if(!L(r))return n(r,e);for(var u=r.length,o=t?u:-1,i=Object(r);(t?o--:++o<u)&&false!==e(i[o],o,i););return r}}(g),qn=function(n){return function(t,r,e){var u=-1,o=Object(t);e=e(t);for(var i=e.length;i--;){var c=e[n?i:++u];if(false===r(o[c],c,o))break}return t}}();Tn&&!Rn.call({valueOf:1},"valueOf")&&(w=function(n){n=Tn(n);for(var t,r=[];!(t=n.next()).done;)r.push(t.value);return r});var zn=A("length"),Cn=V(function(t,r){return Pn(t)||(t=null==t?[]:[Object(t)]),_(r,1),
n(N(t),on)}),Gn=V(function(n,t,r){return D(n,t,r)}),Jn=V(function(n,t){return h(n,1,t)}),Mn=V(function(n,t,r){return h(n,Vn(t)||0,r)}),Pn=Array.isArray,Un=Number,Vn=Number,Hn=R(function(n,t){F(t,en(t),n)}),Kn=R(function(n,t){F(t,un(t),n)}),Ln=R(function(n,t,r,e){F(t,un(t),n,e)}),Qn=V(function(n){return n.push(an,p),Ln.apply(an,n)}),Wn=V(function(n,t){return null==n?{}:E(n,_(t,1))}),Xn=d;l.prototype=s(a.prototype),l.prototype.constructor=l,a.assignIn=Kn,a.before=U,a.bind=Gn,a.chain=function(n){return n=a(n),
n.__chain__=true,n},a.compact=function(n){return y(n,Boolean)},a.concat=Cn,a.create=function(n,t){var r=s(n);return t?Hn(r,t):r},a.defaults=Qn,a.defer=Jn,a.delay=Mn,a.filter=function(n,t){return y(n,d(t))},a.flatten=function(n){return n&&n.length?_(n,1):[]},a.flattenDeep=function(n){return n&&n.length?_(n,ln):[]},a.iteratee=Xn,a.keys=en,a.map=function(n,t){return O(n,d(t))},a.matches=function(n){return x(Hn({},n))},a.mixin=fn,a.negate=function(n){if(typeof n!="function")throw new TypeError("Expected a function");
return function(){return!n.apply(this,arguments)}},a.once=function(n){return U(2,n)},a.pick=Wn,a.slice=function(n,t,r){var e=n?n.length:0;return r=r===an?e:+r,e?k(n,null==t?0:+t,r):[]},a.sortBy=function(n,t){var r=0;return t=d(t),O(O(n,function(n,e,u){return{c:n,b:r++,a:t(n,e,u)}}).sort(function(n,t){var r;n:{r=n.a;var e=t.a;if(r!==e){var u=null===r,o=r===an,i=r===r,c=null===e,f=e===an,a=e===e;if(r>e&&!c||!i||u&&!f&&a||o&&a){r=1;break n}if(e>r&&!u||!a||c&&!o&&i||f&&i){r=-1;break n}}r=0}return r||n.b-t.b;
}),A("c"))},a.tap=function(n,t){return t(n),n},a.thru=function(n,t){return t(n)},a.toArray=function(n){return L(n)?n.length?N(n):[]:on(n)},a.values=on,a.extend=Kn,fn(a,a),a.clone=function(n){return X(n)?Pn(n)?N(n):F(n,en(n)):n},a.escape=function(n){return(n=rn(n))&&sn.test(n)?n.replace(pn,i):n},a.every=function(n,t,r){return t=r?an:t,v(n,d(t))},a.find=J,a.forEach=M,a.has=function(n,t){return null!=n&&En.call(n,t)},a.head=G,a.identity=cn,a.indexOf=function(n,t,r){var e=n?n.length:0;r=typeof r=="number"?0>r?In(e+r,0):r:0,
r=(r||0)-1;for(var u=t===t;++r<e;){var o=n[r];if(u?o===t:o!==o)return r}return-1},a.isArguments=K,a.isArray=Pn,a.isBoolean=function(n){return true===n||false===n||Y(n)&&"[object Boolean]"==kn.call(n)},a.isDate=function(n){return Y(n)&&"[object Date]"==kn.call(n)},a.isEmpty=function(n){if(L(n)&&(Pn(n)||nn(n)||Q(n.splice)||K(n)))return!n.length;for(var t in n)if(En.call(n,t))return false;return true},a.isEqual=function(n,t){return j(n,t)},a.isFinite=function(n){return typeof n=="number"&&Bn(n)},a.isFunction=Q,a.isNaN=function(n){
return Z(n)&&n!=+n},a.isNull=function(n){return null===n},a.isNumber=Z,a.isObject=X,a.isRegExp=function(n){return X(n)&&"[object RegExp]"==kn.call(n)},a.isString=nn,a.isUndefined=function(n){return n===an},a.last=function(n){var t=n?n.length:0;return t?n[t-1]:an},a.max=function(n){return n&&n.length?t(n,cn,H):an},a.min=function(n){return n&&n.length?t(n,cn,tn):an},a.noConflict=function(){return wn._===this&&(wn._=Nn),this},a.noop=function(){},a.reduce=P,a.result=function(n,t,r){return t=null==n?an:n[t],
t===an&&(t=r),Q(t)?t.call(n):t},a.size=function(n){return null==n?0:(n=L(n)?n:en(n),n.length)},a.some=function(n,t,r){return t=r?an:t,S(n,d(t))},a.uniqueId=function(n){var t=++An;return rn(n)+t},a.each=M,a.first=G,fn(a,function(){var n={};return g(a,function(t,r){En.call(a.prototype,r)||(n[r]=t)}),n}(),{chain:false}),a.VERSION="4.5.1",$n("pop join replace reverse split push shift sort splice unshift".split(" "),function(n){var t=(/^(?:replace|split)$/.test(n)?String.prototype:On)[n],r=/^(?:push|sort|unshift)$/.test(n)?"tap":"thru",e=/^(?:pop|join|replace|shift)$/.test(n);
a.prototype[n]=function(){var n=arguments;return e&&!this.__chain__?t.apply(this.value(),n):this[r](function(r){return t.apply(r,n)})}}),a.prototype.toJSON=a.prototype.valueOf=a.prototype.value=function(){return T(this.__wrapped__,this.__actions__)},(mn||jn||{})._=a,typeof define=="function"&&typeof define.amd=="object"&&define.amd? define(function(){return a}):_n&&gn?(bn&&((gn.exports=a)._=a),_n._=a):wn._=a}).call(this);

/*!
 * imagesLoaded PACKAGED v4.1.1
 * JavaScript is all like "You images are done yet or what?"
 * MIT License
 */

!function(t,e){"function"==typeof define&&define.amd?define("ev-emitter/ev-emitter",e):"object"==typeof module&&module.exports?module.exports=e():t.EvEmitter=e()}("undefined"!=typeof window?window:this,function(){function t(){}var e=t.prototype;return e.on=function(t,e){if(t&&e){var i=this._events=this._events||{},n=i[t]=i[t]||[];return-1==n.indexOf(e)&&n.push(e),this}},e.once=function(t,e){if(t&&e){this.on(t,e);var i=this._onceEvents=this._onceEvents||{},n=i[t]=i[t]||{};return n[e]=!0,this}},e.off=function(t,e){var i=this._events&&this._events[t];if(i&&i.length){var n=i.indexOf(e);return-1!=n&&i.splice(n,1),this}},e.emitEvent=function(t,e){var i=this._events&&this._events[t];if(i&&i.length){var n=0,o=i[n];e=e||[];for(var r=this._onceEvents&&this._onceEvents[t];o;){var s=r&&r[o];s&&(this.off(t,o),delete r[o]),o.apply(this,e),n+=s?0:1,o=i[n]}return this}},t}),function(t,e){"use strict";"function"==typeof define&&define.amd?define(["ev-emitter/ev-emitter"],function(i){return e(t,i)}):"object"==typeof module&&module.exports?module.exports=e(t,require("ev-emitter")):t.imagesLoaded=e(t,t.EvEmitter)}(window,function(t,e){function i(t,e){for(var i in e)t[i]=e[i];return t}function n(t){var e=[];if(Array.isArray(t))e=t;else if("number"==typeof t.length)for(var i=0;i<t.length;i++)e.push(t[i]);else e.push(t);return e}function o(t,e,r){return this instanceof o?("string"==typeof t&&(t=document.querySelectorAll(t)),this.elements=n(t),this.options=i({},this.options),"function"==typeof e?r=e:i(this.options,e),r&&this.on("always",r),this.getImages(),h&&(this.jqDeferred=new h.Deferred),void setTimeout(function(){this.check()}.bind(this))):new o(t,e,r)}function r(t){this.img=t}function s(t,e){this.url=t,this.element=e,this.img=new Image}var h=t.jQuery,a=t.console;o.prototype=Object.create(e.prototype),o.prototype.options={},o.prototype.getImages=function(){this.images=[],this.elements.forEach(this.addElementImages,this)},o.prototype.addElementImages=function(t){"IMG"==t.nodeName&&this.addImage(t),this.options.background===!0&&this.addElementBackgroundImages(t);var e=t.nodeType;if(e&&d[e]){for(var i=t.querySelectorAll("img"),n=0;n<i.length;n++){var o=i[n];this.addImage(o)}if("string"==typeof this.options.background){var r=t.querySelectorAll(this.options.background);for(n=0;n<r.length;n++){var s=r[n];this.addElementBackgroundImages(s)}}}};var d={1:!0,9:!0,11:!0};return o.prototype.addElementBackgroundImages=function(t){var e=getComputedStyle(t);if(e)for(var i=/url\((['"])?(.*?)\1\)/gi,n=i.exec(e.backgroundImage);null!==n;){var o=n&&n[2];o&&this.addBackground(o,t),n=i.exec(e.backgroundImage)}},o.prototype.addImage=function(t){var e=new r(t);this.images.push(e)},o.prototype.addBackground=function(t,e){var i=new s(t,e);this.images.push(i)},o.prototype.check=function(){function t(t,i,n){setTimeout(function(){e.progress(t,i,n)})}var e=this;return this.progressedCount=0,this.hasAnyBroken=!1,this.images.length?void this.images.forEach(function(e){e.once("progress",t),e.check()}):void this.complete()},o.prototype.progress=function(t,e,i){this.progressedCount++,this.hasAnyBroken=this.hasAnyBroken||!t.isLoaded,this.emitEvent("progress",[this,t,e]),this.jqDeferred&&this.jqDeferred.notify&&this.jqDeferred.notify(this,t),this.progressedCount==this.images.length&&this.complete(),this.options.debug&&a&&a.log("progress: "+i,t,e)},o.prototype.complete=function(){var t=this.hasAnyBroken?"fail":"done";if(this.isComplete=!0,this.emitEvent(t,[this]),this.emitEvent("always",[this]),this.jqDeferred){var e=this.hasAnyBroken?"reject":"resolve";this.jqDeferred[e](this)}},r.prototype=Object.create(e.prototype),r.prototype.check=function(){var t=this.getIsImageComplete();return t?void this.confirm(0!==this.img.naturalWidth,"naturalWidth"):(this.proxyImage=new Image,this.proxyImage.addEventListener("load",this),this.proxyImage.addEventListener("error",this),this.img.addEventListener("load",this),this.img.addEventListener("error",this),void(this.proxyImage.src=this.img.src))},r.prototype.getIsImageComplete=function(){return this.img.complete&&void 0!==this.img.naturalWidth},r.prototype.confirm=function(t,e){this.isLoaded=t,this.emitEvent("progress",[this,this.img,e])},r.prototype.handleEvent=function(t){var e="on"+t.type;this[e]&&this[e](t)},r.prototype.onload=function(){this.confirm(!0,"onload"),this.unbindEvents()},r.prototype.onerror=function(){this.confirm(!1,"onerror"),this.unbindEvents()},r.prototype.unbindEvents=function(){this.proxyImage.removeEventListener("load",this),this.proxyImage.removeEventListener("error",this),this.img.removeEventListener("load",this),this.img.removeEventListener("error",this)},s.prototype=Object.create(r.prototype),s.prototype.check=function(){this.img.addEventListener("load",this),this.img.addEventListener("error",this),this.img.src=this.url;var t=this.getIsImageComplete();t&&(this.confirm(0!==this.img.naturalWidth,"naturalWidth"),this.unbindEvents())},s.prototype.unbindEvents=function(){this.img.removeEventListener("load",this),this.img.removeEventListener("error",this)},s.prototype.confirm=function(t,e){this.isLoaded=t,this.emitEvent("progress",[this,this.element,e])},o.makeJQueryPlugin=function(e){e=e||t.jQuery,e&&(h=e,h.fn.imagesLoaded=function(t,e){var i=new o(this,t,e);return i.jqDeferred.promise(h(this))})},o.makeJQueryPlugin(),o});

/*
 * jQuery FlexSlider v2.7.1
 * Copyright 2012 WooThemes
 * Contributing Author: Tyler Smith
 */!function($){var e=!0;$.flexslider=function(t,a){var n=$(t);void 0===a.rtl&&"rtl"==$("html").attr("dir")&&(a.rtl=!0),n.vars=$.extend({},$.flexslider.defaults,a);var i=n.vars.namespace,r=window.navigator&&window.navigator.msPointerEnabled&&window.MSGesture,s=("ontouchstart"in window||r||window.DocumentTouch&&document instanceof DocumentTouch)&&n.vars.touch,o="click touchend MSPointerUp keyup",l="",c,d="vertical"===n.vars.direction,u=n.vars.reverse,v=n.vars.itemWidth>0,p="fade"===n.vars.animation,m=""!==n.vars.asNavFor,f={};$.data(t,"flexslider",n),f={init:function(){n.animating=!1,n.currentSlide=parseInt(n.vars.startAt?n.vars.startAt:0,10),isNaN(n.currentSlide)&&(n.currentSlide=0),n.animatingTo=n.currentSlide,n.atEnd=0===n.currentSlide||n.currentSlide===n.last,n.containerSelector=n.vars.selector.substr(0,n.vars.selector.search(" ")),n.slides=$(n.vars.selector,n),n.container=$(n.containerSelector,n),n.count=n.slides.length,n.syncExists=$(n.vars.sync).length>0,"slide"===n.vars.animation&&(n.vars.animation="swing"),n.prop=d?"top":n.vars.rtl?"marginRight":"marginLeft",n.args={},n.manualPause=!1,n.stopped=!1,n.started=!1,n.startTimeout=null,n.transitions=!n.vars.video&&!p&&n.vars.useCSS&&function(){var e=document.createElement("div"),t=["perspectiveProperty","WebkitPerspective","MozPerspective","OPerspective","msPerspective"];for(var a in t)if(void 0!==e.style[t[a]])return n.pfx=t[a].replace("Perspective","").toLowerCase(),n.prop="-"+n.pfx+"-transform",!0;return!1}(),n.isFirefox=navigator.userAgent.toLowerCase().indexOf("firefox")>-1,n.ensureAnimationEnd="",""!==n.vars.controlsContainer&&(n.controlsContainer=$(n.vars.controlsContainer).length>0&&$(n.vars.controlsContainer)),""!==n.vars.manualControls&&(n.manualControls=$(n.vars.manualControls).length>0&&$(n.vars.manualControls)),""!==n.vars.customDirectionNav&&(n.customDirectionNav=2===$(n.vars.customDirectionNav).length&&$(n.vars.customDirectionNav)),n.vars.randomize&&(n.slides.sort(function(){return Math.round(Math.random())-.5}),n.container.empty().append(n.slides)),n.doMath(),n.setup("init"),n.vars.controlNav&&f.controlNav.setup(),n.vars.directionNav&&f.directionNav.setup(),n.vars.keyboard&&(1===$(n.containerSelector).length||n.vars.multipleKeyboard)&&$(document).bind("keyup",function(e){var t=e.keyCode;if(!n.animating&&(39===t||37===t)){var a=n.vars.rtl?37===t?n.getTarget("next"):39===t&&n.getTarget("prev"):39===t?n.getTarget("next"):37===t&&n.getTarget("prev");n.flexAnimate(a,n.vars.pauseOnAction)}}),n.vars.mousewheel&&n.bind("mousewheel",function(e,t,a,i){e.preventDefault();var r=t<0?n.getTarget("next"):n.getTarget("prev");n.flexAnimate(r,n.vars.pauseOnAction)}),n.vars.pausePlay&&f.pausePlay.setup(),n.vars.slideshow&&n.vars.pauseInvisible&&f.pauseInvisible.init(),n.vars.slideshow&&(n.vars.pauseOnHover&&n.hover(function(){n.manualPlay||n.manualPause||n.pause()},function(){n.manualPause||n.manualPlay||n.stopped||n.play()}),n.vars.pauseInvisible&&f.pauseInvisible.isHidden()||(n.vars.initDelay>0?n.startTimeout=setTimeout(n.play,n.vars.initDelay):n.play())),m&&f.asNav.setup(),s&&n.vars.touch&&f.touch(),(!p||p&&n.vars.smoothHeight)&&$(window).bind("resize orientationchange focus",f.resize),n.find("img").attr("draggable","false"),setTimeout(function(){n.vars.start(n)},200)},asNav:{setup:function(){n.asNav=!0,n.animatingTo=Math.floor(n.currentSlide/n.move),n.currentItem=n.currentSlide,n.slides.removeClass(i+"active-slide").eq(n.currentItem).addClass(i+"active-slide"),r?(t._slider=n,n.slides.each(function(){var e=this;e._gesture=new MSGesture,e._gesture.target=e,e.addEventListener("MSPointerDown",function(e){e.preventDefault(),e.currentTarget._gesture&&e.currentTarget._gesture.addPointer(e.pointerId)},!1),e.addEventListener("MSGestureTap",function(e){e.preventDefault();var t=$(this),a=t.index();$(n.vars.asNavFor).data("flexslider").animating||t.hasClass("active")||(n.direction=n.currentItem<a?"next":"prev",n.flexAnimate(a,n.vars.pauseOnAction,!1,!0,!0))})})):n.slides.on(o,function(e){e.preventDefault();var t=$(this),a=t.index(),r;r=n.vars.rtl?-1*(t.offset().right-$(n).scrollLeft()):t.offset().left-$(n).scrollLeft(),r<=0&&t.hasClass(i+"active-slide")?n.flexAnimate(n.getTarget("prev"),!0):$(n.vars.asNavFor).data("flexslider").animating||t.hasClass(i+"active-slide")||(n.direction=n.currentItem<a?"next":"prev",n.flexAnimate(a,n.vars.pauseOnAction,!1,!0,!0))})}},controlNav:{setup:function(){n.manualControls?f.controlNav.setupManual():f.controlNav.setupPaging()},setupPaging:function(){var e="thumbnails"===n.vars.controlNav?"control-thumbs":"control-paging",t=1,a,r;if(n.controlNavScaffold=$('<ol class="'+i+"control-nav "+i+e+'"></ol>'),n.pagingCount>1)for(var s=0;s<n.pagingCount;s++){r=n.slides.eq(s),void 0===r.attr("data-thumb-alt")&&r.attr("data-thumb-alt","");var c=""!==r.attr("data-thumb-alt")?c=' alt="'+r.attr("data-thumb-alt")+'"':"";if(a="thumbnails"===n.vars.controlNav?'<img src="'+r.attr("data-thumb")+'"'+c+"/>":'<a href="#">'+t+"</a>","thumbnails"===n.vars.controlNav&&!0===n.vars.thumbCaptions){var d=r.attr("data-thumbcaption");""!==d&&void 0!==d&&(a+='<span class="'+i+'caption">'+d+"</span>")}n.controlNavScaffold.append("<li>"+a+"</li>"),t++}n.controlsContainer?$(n.controlsContainer).append(n.controlNavScaffold):n.append(n.controlNavScaffold),f.controlNav.set(),f.controlNav.active(),n.controlNavScaffold.delegate("a, img",o,function(e){if(e.preventDefault(),""===l||l===e.type){var t=$(this),a=n.controlNav.index(t);t.hasClass(i+"active")||(n.direction=a>n.currentSlide?"next":"prev",n.flexAnimate(a,n.vars.pauseOnAction))}""===l&&(l=e.type),f.setToClearWatchedEvent()})},setupManual:function(){n.controlNav=n.manualControls,f.controlNav.active(),n.controlNav.bind(o,function(e){if(e.preventDefault(),""===l||l===e.type){var t=$(this),a=n.controlNav.index(t);t.hasClass(i+"active")||(a>n.currentSlide?n.direction="next":n.direction="prev",n.flexAnimate(a,n.vars.pauseOnAction))}""===l&&(l=e.type),f.setToClearWatchedEvent()})},set:function(){var e="thumbnails"===n.vars.controlNav?"img":"a";n.controlNav=$("."+i+"control-nav li "+e,n.controlsContainer?n.controlsContainer:n)},active:function(){n.controlNav.removeClass(i+"active").eq(n.animatingTo).addClass(i+"active")},update:function(e,t){n.pagingCount>1&&"add"===e?n.controlNavScaffold.append($('<li><a href="#">'+n.count+"</a></li>")):1===n.pagingCount?n.controlNavScaffold.find("li").remove():n.controlNav.eq(t).closest("li").remove(),f.controlNav.set(),n.pagingCount>1&&n.pagingCount!==n.controlNav.length?n.update(t,e):f.controlNav.active()}},directionNav:{setup:function(){var e=$('<ul class="'+i+'direction-nav"><li class="'+i+'nav-prev"><a class="'+i+'prev" href="#">'+n.vars.prevText+'</a></li><li class="'+i+'nav-next"><a class="'+i+'next" href="#">'+n.vars.nextText+"</a></li></ul>");n.customDirectionNav?n.directionNav=n.customDirectionNav:n.controlsContainer?($(n.controlsContainer).append(e),n.directionNav=$("."+i+"direction-nav li a",n.controlsContainer)):(n.append(e),n.directionNav=$("."+i+"direction-nav li a",n)),f.directionNav.update(),n.directionNav.bind(o,function(e){e.preventDefault();var t;""!==l&&l!==e.type||(t=$(this).hasClass(i+"next")?n.getTarget("next"):n.getTarget("prev"),n.flexAnimate(t,n.vars.pauseOnAction)),""===l&&(l=e.type),f.setToClearWatchedEvent()})},update:function(){var e=i+"disabled";1===n.pagingCount?n.directionNav.addClass(e).attr("tabindex","-1"):n.vars.animationLoop?n.directionNav.removeClass(e).removeAttr("tabindex"):0===n.animatingTo?n.directionNav.removeClass(e).filter("."+i+"prev").addClass(e).attr("tabindex","-1"):n.animatingTo===n.last?n.directionNav.removeClass(e).filter("."+i+"next").addClass(e).attr("tabindex","-1"):n.directionNav.removeClass(e).removeAttr("tabindex")}},pausePlay:{setup:function(){var e=$('<div class="'+i+'pauseplay"><a href="#"></a></div>');n.controlsContainer?(n.controlsContainer.append(e),n.pausePlay=$("."+i+"pauseplay a",n.controlsContainer)):(n.append(e),n.pausePlay=$("."+i+"pauseplay a",n)),f.pausePlay.update(n.vars.slideshow?i+"pause":i+"play"),n.pausePlay.bind(o,function(e){e.preventDefault(),""!==l&&l!==e.type||($(this).hasClass(i+"pause")?(n.manualPause=!0,n.manualPlay=!1,n.pause()):(n.manualPause=!1,n.manualPlay=!0,n.play())),""===l&&(l=e.type),f.setToClearWatchedEvent()})},update:function(e){"play"===e?n.pausePlay.removeClass(i+"pause").addClass(i+"play").html(n.vars.playText):n.pausePlay.removeClass(i+"play").addClass(i+"pause").html(n.vars.pauseText)}},touch:function(){function e(e){e.stopPropagation(),n.animating?e.preventDefault():(n.pause(),t._gesture.addPointer(e.pointerId),w=0,c=d?n.h:n.w,f=Number(new Date),l=v&&u&&n.animatingTo===n.last?0:v&&u?n.limit-(n.itemW+n.vars.itemMargin)*n.move*n.animatingTo:v&&n.currentSlide===n.last?n.limit:v?(n.itemW+n.vars.itemMargin)*n.move*n.currentSlide:u?(n.last-n.currentSlide+n.cloneOffset)*c:(n.currentSlide+n.cloneOffset)*c)}function a(e){e.stopPropagation();var a=e.target._slider;if(a){var n=-e.translationX,i=-e.translationY;if(w+=d?i:n,m=(a.vars.rtl?-1:1)*w,x=d?Math.abs(w)<Math.abs(-n):Math.abs(w)<Math.abs(-i),e.detail===e.MSGESTURE_FLAG_INERTIA)return void setImmediate(function(){t._gesture.stop()});(!x||Number(new Date)-f>500)&&(e.preventDefault(),!p&&a.transitions&&(a.vars.animationLoop||(m=w/(0===a.currentSlide&&w<0||a.currentSlide===a.last&&w>0?Math.abs(w)/c+2:1)),a.setProps(l+m,"setTouch")))}}function i(e){e.stopPropagation();var t=e.target._slider;if(t){if(t.animatingTo===t.currentSlide&&!x&&null!==m){var a=u?-m:m,n=a>0?t.getTarget("next"):t.getTarget("prev");t.canAdvance(n)&&(Number(new Date)-f<550&&Math.abs(a)>50||Math.abs(a)>c/2)?t.flexAnimate(n,t.vars.pauseOnAction):p||t.flexAnimate(t.currentSlide,t.vars.pauseOnAction,!0)}s=null,o=null,m=null,l=null,w=0}}var s,o,l,c,m,f,g,h,S,x=!1,y=0,b=0,w=0;r?(t.style.msTouchAction="none",t._gesture=new MSGesture,t._gesture.target=t,t.addEventListener("MSPointerDown",e,!1),t._slider=n,t.addEventListener("MSGestureChange",a,!1),t.addEventListener("MSGestureEnd",i,!1)):(g=function(e){n.animating?e.preventDefault():(window.navigator.msPointerEnabled||1===e.touches.length)&&(n.pause(),c=d?n.h:n.w,f=Number(new Date),y=e.touches[0].pageX,b=e.touches[0].pageY,l=v&&u&&n.animatingTo===n.last?0:v&&u?n.limit-(n.itemW+n.vars.itemMargin)*n.move*n.animatingTo:v&&n.currentSlide===n.last?n.limit:v?(n.itemW+n.vars.itemMargin)*n.move*n.currentSlide:u?(n.last-n.currentSlide+n.cloneOffset)*c:(n.currentSlide+n.cloneOffset)*c,s=d?b:y,o=d?y:b,t.addEventListener("touchmove",h,!1),t.addEventListener("touchend",S,!1))},h=function(e){y=e.touches[0].pageX,b=e.touches[0].pageY,m=d?s-b:(n.vars.rtl?-1:1)*(s-y),x=d?Math.abs(m)<Math.abs(y-o):Math.abs(m)<Math.abs(b-o);var t=500;(!x||Number(new Date)-f>500)&&(e.preventDefault(),!p&&n.transitions&&(n.vars.animationLoop||(m/=0===n.currentSlide&&m<0||n.currentSlide===n.last&&m>0?Math.abs(m)/c+2:1),n.setProps(l+m,"setTouch")))},S=function(e){if(t.removeEventListener("touchmove",h,!1),n.animatingTo===n.currentSlide&&!x&&null!==m){var a=u?-m:m,i=a>0?n.getTarget("next"):n.getTarget("prev");n.canAdvance(i)&&(Number(new Date)-f<550&&Math.abs(a)>50||Math.abs(a)>c/2)?n.flexAnimate(i,n.vars.pauseOnAction):p||n.flexAnimate(n.currentSlide,n.vars.pauseOnAction,!0)}t.removeEventListener("touchend",S,!1),s=null,o=null,m=null,l=null},t.addEventListener("touchstart",g,!1))},resize:function(){!n.animating&&n.is(":visible")&&(v||n.doMath(),p?f.smoothHeight():v?(n.slides.width(n.computedW),n.update(n.pagingCount),n.setProps()):d?(n.viewport.height(n.h),n.setProps(n.h,"setTotal")):(n.vars.smoothHeight&&f.smoothHeight(),n.newSlides.width(n.computedW),n.setProps(n.computedW,"setTotal")))},smoothHeight:function(e){if(!d||p){var t=p?n:n.viewport;e?t.animate({height:n.slides.eq(n.animatingTo).innerHeight()},e):t.innerHeight(n.slides.eq(n.animatingTo).innerHeight())}},sync:function(e){var t=$(n.vars.sync).data("flexslider"),a=n.animatingTo;switch(e){case"animate":t.flexAnimate(a,n.vars.pauseOnAction,!1,!0);break;case"play":t.playing||t.asNav||t.play();break;case"pause":t.pause();break}},uniqueID:function(e){return e.filter("[id]").add(e.find("[id]")).each(function(){var e=$(this);e.attr("id",e.attr("id")+"_clone")}),e},pauseInvisible:{visProp:null,init:function(){var e=f.pauseInvisible.getHiddenProp();if(e){var t=e.replace(/[H|h]idden/,"")+"visibilitychange";document.addEventListener(t,function(){f.pauseInvisible.isHidden()?n.startTimeout?clearTimeout(n.startTimeout):n.pause():n.started?n.play():n.vars.initDelay>0?setTimeout(n.play,n.vars.initDelay):n.play()})}},isHidden:function(){var e=f.pauseInvisible.getHiddenProp();return!!e&&document[e]},getHiddenProp:function(){var e=["webkit","moz","ms","o"];if("hidden"in document)return"hidden";for(var t=0;t<e.length;t++)if(e[t]+"Hidden"in document)return e[t]+"Hidden";return null}},setToClearWatchedEvent:function(){clearTimeout(c),c=setTimeout(function(){l=""},3e3)}},n.flexAnimate=function(e,t,a,r,o){if(n.vars.animationLoop||e===n.currentSlide||(n.direction=e>n.currentSlide?"next":"prev"),m&&1===n.pagingCount&&(n.direction=n.currentItem<e?"next":"prev"),!n.animating&&(n.canAdvance(e,o)||a)&&n.is(":visible")){if(m&&r){var l=$(n.vars.asNavFor).data("flexslider");if(n.atEnd=0===e||e===n.count-1,l.flexAnimate(e,!0,!1,!0,o),n.direction=n.currentItem<e?"next":"prev",l.direction=n.direction,Math.ceil((e+1)/n.visible)-1===n.currentSlide||0===e)return n.currentItem=e,n.slides.removeClass(i+"active-slide").eq(e).addClass(i+"active-slide"),!1;n.currentItem=e,n.slides.removeClass(i+"active-slide").eq(e).addClass(i+"active-slide"),e=Math.floor(e/n.visible)}if(n.animating=!0,n.animatingTo=e,t&&n.pause(),n.vars.before(n),n.syncExists&&!o&&f.sync("animate"),n.vars.controlNav&&f.controlNav.active(),v||n.slides.removeClass(i+"active-slide").eq(e).addClass(i+"active-slide"),n.atEnd=0===e||e===n.last,n.vars.directionNav&&f.directionNav.update(),e===n.last&&(n.vars.end(n),n.vars.animationLoop||n.pause()),p)s?(n.slides.eq(n.currentSlide).css({opacity:0,zIndex:1}),n.slides.eq(e).css({opacity:1,zIndex:2}),n.wrapup(c)):(n.slides.eq(n.currentSlide).css({zIndex:1}).animate({opacity:0},n.vars.animationSpeed,n.vars.easing),n.slides.eq(e).css({zIndex:2}).animate({opacity:1},n.vars.animationSpeed,n.vars.easing,n.wrapup));else{var c=d?n.slides.filter(":first").height():n.computedW,g,h,S;v?(g=n.vars.itemMargin,S=(n.itemW+g)*n.move*n.animatingTo,h=S>n.limit&&1!==n.visible?n.limit:S):h=0===n.currentSlide&&e===n.count-1&&n.vars.animationLoop&&"next"!==n.direction?u?(n.count+n.cloneOffset)*c:0:n.currentSlide===n.last&&0===e&&n.vars.animationLoop&&"prev"!==n.direction?u?0:(n.count+1)*c:u?(n.count-1-e+n.cloneOffset)*c:(e+n.cloneOffset)*c,n.setProps(h,"",n.vars.animationSpeed),n.transitions?(n.vars.animationLoop&&n.atEnd||(n.animating=!1,n.currentSlide=n.animatingTo),n.container.unbind("webkitTransitionEnd transitionend"),n.container.bind("webkitTransitionEnd transitionend",function(){clearTimeout(n.ensureAnimationEnd),n.wrapup(c)}),clearTimeout(n.ensureAnimationEnd),n.ensureAnimationEnd=setTimeout(function(){n.wrapup(c)},n.vars.animationSpeed+100)):n.container.animate(n.args,n.vars.animationSpeed,n.vars.easing,function(){n.wrapup(c)})}n.vars.smoothHeight&&f.smoothHeight(n.vars.animationSpeed)}},n.wrapup=function(e){p||v||(0===n.currentSlide&&n.animatingTo===n.last&&n.vars.animationLoop?n.setProps(e,"jumpEnd"):n.currentSlide===n.last&&0===n.animatingTo&&n.vars.animationLoop&&n.setProps(e,"jumpStart")),n.animating=!1,n.currentSlide=n.animatingTo,n.vars.after(n)},n.animateSlides=function(){!n.animating&&e&&n.flexAnimate(n.getTarget("next"))},n.pause=function(){clearInterval(n.animatedSlides),n.animatedSlides=null,n.playing=!1,n.vars.pausePlay&&f.pausePlay.update("play"),n.syncExists&&f.sync("pause")},n.play=function(){n.playing&&clearInterval(n.animatedSlides),n.animatedSlides=n.animatedSlides||setInterval(n.animateSlides,n.vars.slideshowSpeed),n.started=n.playing=!0,n.vars.pausePlay&&f.pausePlay.update("pause"),n.syncExists&&f.sync("play")},n.stop=function(){n.pause(),n.stopped=!0},n.canAdvance=function(e,t){var a=m?n.pagingCount-1:n.last;return!!t||(!(!m||n.currentItem!==n.count-1||0!==e||"prev"!==n.direction)||(!m||0!==n.currentItem||e!==n.pagingCount-1||"next"===n.direction)&&(!(e===n.currentSlide&&!m)&&(!!n.vars.animationLoop||(!n.atEnd||0!==n.currentSlide||e!==a||"next"===n.direction)&&(!n.atEnd||n.currentSlide!==a||0!==e||"next"!==n.direction))))},n.getTarget=function(e){return n.direction=e,"next"===e?n.currentSlide===n.last?0:n.currentSlide+1:0===n.currentSlide?n.last:n.currentSlide-1},n.setProps=function(e,t,a){var i=function(){var a=e||(n.itemW+n.vars.itemMargin)*n.move*n.animatingTo;return function(){if(v)return"setTouch"===t?e:u&&n.animatingTo===n.last?0:u?n.limit-(n.itemW+n.vars.itemMargin)*n.move*n.animatingTo:n.animatingTo===n.last?n.limit:a;switch(t){case"setTotal":return u?(n.count-1-n.currentSlide+n.cloneOffset)*e:(n.currentSlide+n.cloneOffset)*e;case"setTouch":return e;case"jumpEnd":return u?e:n.count*e;case"jumpStart":return u?n.count*e:e;default:return e}}()*(n.vars.rtl?1:-1)+"px"}();n.transitions&&(i=n.isFirefox?d?"translate3d(0,"+i+",0)":"translate3d("+parseInt(i)+"px,0,0)":d?"translate3d(0,"+i+",0)":"translate3d("+(n.vars.rtl?-1:1)*parseInt(i)+"px,0,0)",a=void 0!==a?a/1e3+"s":"0s",n.container.css("-"+n.pfx+"-transition-duration",a),n.container.css("transition-duration",a)),n.args[n.prop]=i,(n.transitions||void 0===a)&&n.container.css(n.args),n.container.css("transform",i)},n.setup=function(e){if(p)n.vars.rtl?n.slides.css({width:"100%",float:"right",marginLeft:"-100%",position:"relative"}):n.slides.css({width:"100%",float:"left",marginRight:"-100%",position:"relative"}),"init"===e&&(s?n.slides.css({opacity:0,display:"block",webkitTransition:"opacity "+n.vars.animationSpeed/1e3+"s ease",zIndex:1}).eq(n.currentSlide).css({opacity:1,zIndex:2}):0==n.vars.fadeFirstSlide?n.slides.css({opacity:0,display:"block",zIndex:1}).eq(n.currentSlide).css({zIndex:2}).css({opacity:1}):n.slides.css({opacity:0,display:"block",zIndex:1}).eq(n.currentSlide).css({zIndex:2}).animate({opacity:1},n.vars.animationSpeed,n.vars.easing)),n.vars.smoothHeight&&f.smoothHeight();else{var t,a;"init"===e&&(n.viewport=$('<div class="'+i+'viewport"></div>').css({overflow:"hidden",position:"relative"}).appendTo(n).append(n.container),n.cloneCount=0,n.cloneOffset=0,u&&(a=$.makeArray(n.slides).reverse(),n.slides=$(a),n.container.empty().append(n.slides))),n.vars.animationLoop&&!v&&(n.cloneCount=2,n.cloneOffset=1,"init"!==e&&n.container.find(".clone").remove(),n.container.append(f.uniqueID(n.slides.first().clone().addClass("clone")).attr("aria-hidden","true")).prepend(f.uniqueID(n.slides.last().clone().addClass("clone")).attr("aria-hidden","true"))),n.newSlides=$(n.vars.selector,n),t=u?n.count-1-n.currentSlide+n.cloneOffset:n.currentSlide+n.cloneOffset,d&&!v?(n.container.height(200*(n.count+n.cloneCount)+"%").css("position","absolute").width("100%"),setTimeout(function(){n.newSlides.css({display:"block"}),n.doMath(),n.viewport.height(n.h),n.setProps(t*n.h,"init")},"init"===e?100:0)):(n.container.width(200*(n.count+n.cloneCount)+"%"),n.setProps(t*n.computedW,"init"),setTimeout(function(){n.doMath(),n.vars.rtl&&n.isFirefox?n.newSlides.css({width:n.computedW,marginRight:n.computedM,float:"right",display:"block"}):n.newSlides.css({width:n.computedW,marginRight:n.computedM,float:"left",display:"block"}),n.vars.smoothHeight&&f.smoothHeight()},"init"===e?100:0))}v||n.slides.removeClass(i+"active-slide").eq(n.currentSlide).addClass(i+"active-slide"),n.vars.init(n)},n.doMath=function(){var e=n.slides.first(),t=n.vars.itemMargin,a=n.vars.minItems,i=n.vars.maxItems;n.w=void 0===n.viewport?n.width():n.viewport.width(),n.isFirefox&&(n.w=n.width()),n.h=e.height(),n.boxPadding=e.outerWidth()-e.width(),v?(n.itemT=n.vars.itemWidth+t,n.itemM=t,n.minW=a?a*n.itemT:n.w,n.maxW=i?i*n.itemT-t:n.w,n.itemW=n.minW>n.w?(n.w-t*(a-1))/a:n.maxW<n.w?(n.w-t*(i-1))/i:n.vars.itemWidth>n.w?n.w:n.vars.itemWidth,n.visible=Math.floor(n.w/n.itemW),n.move=n.vars.move>0&&n.vars.move<n.visible?n.vars.move:n.visible,n.pagingCount=Math.ceil((n.count-n.visible)/n.move+1),n.last=n.pagingCount-1,n.limit=1===n.pagingCount?0:n.vars.itemWidth>n.w?n.itemW*(n.count-1)+t*(n.count-1):(n.itemW+t)*n.count-n.w-t):(n.itemW=n.w,n.itemM=t,n.pagingCount=n.count,n.last=n.count-1),n.computedW=n.itemW-n.boxPadding,n.computedM=n.itemM},n.update=function(e,t){n.doMath(),v||(e<n.currentSlide?n.currentSlide+=1:e<=n.currentSlide&&0!==e&&(n.currentSlide-=1),n.animatingTo=n.currentSlide),n.vars.controlNav&&!n.manualControls&&("add"===t&&!v||n.pagingCount>n.controlNav.length?f.controlNav.update("add"):("remove"===t&&!v||n.pagingCount<n.controlNav.length)&&(v&&n.currentSlide>n.last&&(n.currentSlide-=1,n.animatingTo-=1),f.controlNav.update("remove",n.last))),n.vars.directionNav&&f.directionNav.update()},n.addSlide=function(e,t){var a=$(e);n.count+=1,n.last=n.count-1,d&&u?void 0!==t?n.slides.eq(n.count-t).after(a):n.container.prepend(a):void 0!==t?n.slides.eq(t).before(a):n.container.append(a),n.update(t,"add"),n.slides=$(n.vars.selector+":not(.clone)",n),n.setup(),n.vars.added(n)},n.removeSlide=function(e){var t=isNaN(e)?n.slides.index($(e)):e;n.count-=1,n.last=n.count-1,isNaN(e)?$(e,n.slides).remove():d&&u?n.slides.eq(n.last).remove():n.slides.eq(e).remove(),n.doMath(),n.update(t,"remove"),n.slides=$(n.vars.selector+":not(.clone)",n),n.setup(),n.vars.removed(n)},f.init()},$(window).blur(function(t){e=!1}).focus(function(t){e=!0}),$.flexslider.defaults={namespace:"flex-",selector:".slides > li",animation:"fade",easing:"swing",direction:"horizontal",reverse:!1,animationLoop:!0,smoothHeight:!1,startAt:0,slideshow:!0,slideshowSpeed:7e3,animationSpeed:600,initDelay:0,randomize:!1,fadeFirstSlide:!0,thumbCaptions:!1,pauseOnAction:!0,pauseOnHover:!1,pauseInvisible:!0,useCSS:!0,touch:!0,video:!1,controlNav:!0,directionNav:!0,prevText:"Previous",nextText:"Next",keyboard:!0,multipleKeyboard:!1,mousewheel:!1,pausePlay:!1,pauseText:"Pause",playText:"Play",controlsContainer:"",manualControls:"",customDirectionNav:"",sync:"",asNavFor:"",itemWidth:0,itemMargin:0,minItems:1,maxItems:0,move:0,allowOneSlide:!0,isFirefox:!1,start:function(){},before:function(){},after:function(){},end:function(){},added:function(){},removed:function(){},init:function(){},rtl:!1},$.fn.flexslider=function(e){if(void 0===e&&(e={}),"object"==typeof e)return this.each(function(){var t=$(this),a=e.selector?e.selector:".slides > li",n=t.find(a);1===n.length&&!1===e.allowOneSlide||0===n.length?(n.fadeIn(400),e.start&&e.start(t)):void 0===t.data("flexslider")&&new $.flexslider(this,e)});var t=$(this).data("flexslider");switch(e){case"play":t.play();break;case"pause":t.pause();break;case"stop":t.stop();break;case"next":t.flexAnimate(t.getTarget("next"),!0);break;case"prev":case"previous":t.flexAnimate(t.getTarget("prev"),!0);break;default:"number"==typeof e&&t.flexAnimate(e,!0)}}}(jQuery);

/*!
	Zoom v1.7.13 - 2014-04-29
	Enlarge images on click or mouseover.
	(c) 2014 Jack Moore - http://www.jacklmoore.com/zoom
	license: http://www.opensource.org/licenses/mit-license.php
*/
(function(o){var t={url:!1,callback:!1,target:!1,duration:120,on:"mouseover",touch:!0,onZoomIn:!1,onZoomOut:!1,magnify:1};o.zoom=function(t,n,e,i){var u,c,a,m,l,r,s,f=o(t).css("position"),h=o(n);return t.style.position=/(absolute|fixed)/.test(f)?f:"relative",t.style.overflow="hidden",e.style.width=e.style.height="",o(e).addClass("zoomImg").css({position:"absolute",top:0,left:0,opacity:0,width:e.width*i,height:e.height*i,border:"none",maxWidth:"none",maxHeight:"none"}).appendTo(t),{init:function(){c=o(t).outerWidth(),u=o(t).outerHeight(),n===t?(m=c,a=u):(m=h.outerWidth(),a=h.outerHeight()),l=(e.width-c)/m,r=(e.height-u)/a,s=h.offset()},move:function(o){var t=o.pageX-s.left,n=o.pageY-s.top;n=Math.max(Math.min(n,a),0),t=Math.max(Math.min(t,m),0),e.style.left=t*-l+"px",e.style.top=n*-r+"px"}}},o.fn.zoom=function(n){return this.each(function(){var e,i=o.extend({},t,n||{}),u=i.target||this,c=this,a=o(c),m=document.createElement("img"),l=o(m),r="mousemove.zoom",s=!1,f=!1;(i.url||(e=a.find("img"),e[0]&&(i.url=e.data("src")||e.attr("src")),i.url))&&(function(){var o=u.style.position,t=u.style.overflow;a.one("zoom.destroy",function(){a.off(".zoom"),u.style.position=o,u.style.overflow=t,l.remove()})}(),m.onload=function(){function t(t){e.init(),e.move(t),l.stop().fadeTo(o.support.opacity?i.duration:0,1,o.isFunction(i.onZoomIn)?i.onZoomIn.call(m):!1)}function n(){l.stop().fadeTo(i.duration,0,o.isFunction(i.onZoomOut)?i.onZoomOut.call(m):!1)}var e=o.zoom(u,c,m,i.magnify);"grab"===i.on?a.on("mousedown.zoom",function(i){1===i.which&&(o(document).one("mouseup.zoom",function(){n(),o(document).off(r,e.move)}),t(i),o(document).on(r,e.move),i.preventDefault())}):"click"===i.on?a.on("click.zoom",function(i){return s?void 0:(s=!0,t(i),o(document).on(r,e.move),o(document).one("click.zoom",function(){n(),s=!1,o(document).off(r,e.move)}),!1)}):"toggle"===i.on?a.on("click.zoom",function(o){s?n():t(o),s=!s}):"mouseover"===i.on&&(e.init(),a.on("mouseenter.zoom",t).on("mouseleave.zoom",n).on(r,e.move)),i.touch&&a.on("touchstart.zoom",function(o){o.preventDefault(),f?(f=!1,n()):(f=!0,t(o.originalEvent.touches[0]||o.originalEvent.changedTouches[0]))}).on("touchmove.zoom",function(o){o.preventDefault(),e.move(o.originalEvent.touches[0]||o.originalEvent.changedTouches[0])}),o.isFunction(i.callback)&&i.callback.call(m)},m.src=i.url)})},o.fn.zoom.defaults=t})(window.jQuery);

/*! Magnific Popup - v1.0.0 - 2015-03-30
* http://dimsemenov.com/plugins/magnific-popup/
* Copyright (c) 2015 Dmitry Semenov; */
!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):a("object"==typeof exports?require("jquery"):window.jQuery||window.Zepto)}(function(a){var b,c,d,e,f,g,h="Close",i="BeforeClose",j="AfterClose",k="BeforeAppend",l="MarkupParse",m="Open",n="Change",o="mfp",p="."+o,q="mfp-ready",r="mfp-removing",s="mfp-prevent-close",t=function(){},u=!!window.jQuery,v=a(window),w=function(a,c){b.ev.on(o+a+p,c)},x=function(b,c,d,e){var f=document.createElement("div");return f.className="mfp-"+b,d&&(f.innerHTML=d),e?c&&c.appendChild(f):(f=a(f),c&&f.appendTo(c)),f},y=function(c,d){b.ev.triggerHandler(o+c,d),b.st.callbacks&&(c=c.charAt(0).toLowerCase()+c.slice(1),b.st.callbacks[c]&&b.st.callbacks[c].apply(b,a.isArray(d)?d:[d]))},z=function(c){return c===g&&b.currTemplate.closeBtn||(b.currTemplate.closeBtn=a(b.st.closeMarkup.replace("%title%",b.st.tClose)),g=c),b.currTemplate.closeBtn},A=function(){a.magnificPopup.instance||(b=new t,b.init(),a.magnificPopup.instance=b)},B=function(){var a=document.createElement("p").style,b=["ms","O","Moz","Webkit"];if(void 0!==a.transition)return!0;for(;b.length;)if(b.pop()+"Transition"in a)return!0;return!1};t.prototype={constructor:t,init:function(){var c=navigator.appVersion;b.isIE7=-1!==c.indexOf("MSIE 7."),b.isIE8=-1!==c.indexOf("MSIE 8."),b.isLowIE=b.isIE7||b.isIE8,b.isAndroid=/android/gi.test(c),b.isIOS=/iphone|ipad|ipod/gi.test(c),b.supportsTransition=B(),b.probablyMobile=b.isAndroid||b.isIOS||/(Opera Mini)|Kindle|webOS|BlackBerry|(Opera Mobi)|(Windows Phone)|IEMobile/i.test(navigator.userAgent),d=a(document),b.popupsCache={}},open:function(c){var e;if(c.isObj===!1){b.items=c.items.toArray(),b.index=0;var g,h=c.items;for(e=0;e<h.length;e++)if(g=h[e],g.parsed&&(g=g.el[0]),g===c.el[0]){b.index=e;break}}else b.items=a.isArray(c.items)?c.items:[c.items],b.index=c.index||0;if(b.isOpen)return void b.updateItemHTML();b.types=[],f="",b.ev=c.mainEl&&c.mainEl.length?c.mainEl.eq(0):d,c.key?(b.popupsCache[c.key]||(b.popupsCache[c.key]={}),b.currTemplate=b.popupsCache[c.key]):b.currTemplate={},b.st=a.extend(!0,{},a.magnificPopup.defaults,c),b.fixedContentPos="auto"===b.st.fixedContentPos?!b.probablyMobile:b.st.fixedContentPos,b.st.modal&&(b.st.closeOnContentClick=!1,b.st.closeOnBgClick=!1,b.st.showCloseBtn=!1,b.st.enableEscapeKey=!1),b.bgOverlay||(b.bgOverlay=x("bg").on("click"+p,function(){b.close()}),b.wrap=x("wrap").attr("tabindex",-1).on("click"+p,function(a){b._checkIfClose(a.target)&&b.close()}),b.container=x("container",b.wrap)),b.contentContainer=x("content"),b.st.preloader&&(b.preloader=x("preloader",b.container,b.st.tLoading));var i=a.magnificPopup.modules;for(e=0;e<i.length;e++){var j=i[e];j=j.charAt(0).toUpperCase()+j.slice(1),b["init"+j].call(b)}y("BeforeOpen"),b.st.showCloseBtn&&(b.st.closeBtnInside?(w(l,function(a,b,c,d){c.close_replaceWith=z(d.type)}),f+=" mfp-close-btn-in"):b.wrap.append(z())),b.st.alignTop&&(f+=" mfp-align-top"),b.wrap.css(b.fixedContentPos?{overflow:b.st.overflowY,overflowX:"hidden",overflowY:b.st.overflowY}:{top:v.scrollTop(),position:"absolute"}),(b.st.fixedBgPos===!1||"auto"===b.st.fixedBgPos&&!b.fixedContentPos)&&b.bgOverlay.css({height:d.height(),position:"absolute"}),b.st.enableEscapeKey&&d.on("keyup"+p,function(a){27===a.keyCode&&b.close()}),v.on("resize"+p,function(){b.updateSize()}),b.st.closeOnContentClick||(f+=" mfp-auto-cursor"),f&&b.wrap.addClass(f);var k=b.wH=v.height(),n={};if(b.fixedContentPos&&b._hasScrollBar(k)){var o=b._getScrollbarSize();o&&(n.marginRight=o)}b.fixedContentPos&&(b.isIE7?a("body, html").css("overflow","hidden"):n.overflow="hidden");var r=b.st.mainClass;return b.isIE7&&(r+=" mfp-ie7"),r&&b._addClassToMFP(r),b.updateItemHTML(),y("BuildControls"),a("html").css(n),b.bgOverlay.add(b.wrap).prependTo(b.st.prependTo||a(document.body)),b._lastFocusedEl=document.activeElement,setTimeout(function(){b.content?(b._addClassToMFP(q),b._setFocus()):b.bgOverlay.addClass(q),d.on("focusin"+p,b._onFocusIn)},16),b.isOpen=!0,b.updateSize(k),y(m),c},close:function(){b.isOpen&&(y(i),b.isOpen=!1,b.st.removalDelay&&!b.isLowIE&&b.supportsTransition?(b._addClassToMFP(r),setTimeout(function(){b._close()},b.st.removalDelay)):b._close())},_close:function(){y(h);var c=r+" "+q+" ";if(b.bgOverlay.detach(),b.wrap.detach(),b.container.empty(),b.st.mainClass&&(c+=b.st.mainClass+" "),b._removeClassFromMFP(c),b.fixedContentPos){var e={marginRight:""};b.isIE7?a("body, html").css("overflow",""):e.overflow="",a("html").css(e)}d.off("keyup"+p+" focusin"+p),b.ev.off(p),b.wrap.attr("class","mfp-wrap").removeAttr("style"),b.bgOverlay.attr("class","mfp-bg"),b.container.attr("class","mfp-container"),!b.st.showCloseBtn||b.st.closeBtnInside&&b.currTemplate[b.currItem.type]!==!0||b.currTemplate.closeBtn&&b.currTemplate.closeBtn.detach(),b._lastFocusedEl&&a(b._lastFocusedEl).focus(),b.currItem=null,b.content=null,b.currTemplate=null,b.prevHeight=0,y(j)},updateSize:function(a){if(b.isIOS){var c=document.documentElement.clientWidth/window.innerWidth,d=window.innerHeight*c;b.wrap.css("height",d),b.wH=d}else b.wH=a||v.height();b.fixedContentPos||b.wrap.css("height",b.wH),y("Resize")},updateItemHTML:function(){var c=b.items[b.index];b.contentContainer.detach(),b.content&&b.content.detach(),c.parsed||(c=b.parseEl(b.index));var d=c.type;if(y("BeforeChange",[b.currItem?b.currItem.type:"",d]),b.currItem=c,!b.currTemplate[d]){var f=b.st[d]?b.st[d].markup:!1;y("FirstMarkupParse",f),b.currTemplate[d]=f?a(f):!0}e&&e!==c.type&&b.container.removeClass("mfp-"+e+"-holder");var g=b["get"+d.charAt(0).toUpperCase()+d.slice(1)](c,b.currTemplate[d]);b.appendContent(g,d),c.preloaded=!0,y(n,c),e=c.type,b.container.prepend(b.contentContainer),y("AfterChange")},appendContent:function(a,c){b.content=a,a?b.st.showCloseBtn&&b.st.closeBtnInside&&b.currTemplate[c]===!0?b.content.find(".mfp-close").length||b.content.append(z()):b.content=a:b.content="",y(k),b.container.addClass("mfp-"+c+"-holder"),b.contentContainer.append(b.content)},parseEl:function(c){var d,e=b.items[c];if(e.tagName?e={el:a(e)}:(d=e.type,e={data:e,src:e.src}),e.el){for(var f=b.types,g=0;g<f.length;g++)if(e.el.hasClass("mfp-"+f[g])){d=f[g];break}e.src=e.el.attr("data-mfp-src"),e.src||(e.src=e.el.attr("href"))}return e.type=d||b.st.type||"inline",e.index=c,e.parsed=!0,b.items[c]=e,y("ElementParse",e),b.items[c]},addGroup:function(a,c){var d=function(d){d.mfpEl=this,b._openClick(d,a,c)};c||(c={});var e="click.magnificPopup";c.mainEl=a,c.items?(c.isObj=!0,a.off(e).on(e,d)):(c.isObj=!1,c.delegate?a.off(e).on(e,c.delegate,d):(c.items=a,a.off(e).on(e,d)))},_openClick:function(c,d,e){var f=void 0!==e.midClick?e.midClick:a.magnificPopup.defaults.midClick;if(f||2!==c.which&&!c.ctrlKey&&!c.metaKey){var g=void 0!==e.disableOn?e.disableOn:a.magnificPopup.defaults.disableOn;if(g)if(a.isFunction(g)){if(!g.call(b))return!0}else if(v.width()<g)return!0;c.type&&(c.preventDefault(),b.isOpen&&c.stopPropagation()),e.el=a(c.mfpEl),e.delegate&&(e.items=d.find(e.delegate)),b.open(e)}},updateStatus:function(a,d){if(b.preloader){c!==a&&b.container.removeClass("mfp-s-"+c),d||"loading"!==a||(d=b.st.tLoading);var e={status:a,text:d};y("UpdateStatus",e),a=e.status,d=e.text,b.preloader.html(d),b.preloader.find("a").on("click",function(a){a.stopImmediatePropagation()}),b.container.addClass("mfp-s-"+a),c=a}},_checkIfClose:function(c){if(!a(c).hasClass(s)){var d=b.st.closeOnContentClick,e=b.st.closeOnBgClick;if(d&&e)return!0;if(!b.content||a(c).hasClass("mfp-close")||b.preloader&&c===b.preloader[0])return!0;if(c===b.content[0]||a.contains(b.content[0],c)){if(d)return!0}else if(e&&a.contains(document,c))return!0;return!1}},_addClassToMFP:function(a){b.bgOverlay.addClass(a),b.wrap.addClass(a)},_removeClassFromMFP:function(a){this.bgOverlay.removeClass(a),b.wrap.removeClass(a)},_hasScrollBar:function(a){return(b.isIE7?d.height():document.body.scrollHeight)>(a||v.height())},_setFocus:function(){(b.st.focus?b.content.find(b.st.focus).eq(0):b.wrap).focus()},_onFocusIn:function(c){return c.target===b.wrap[0]||a.contains(b.wrap[0],c.target)?void 0:(b._setFocus(),!1)},_parseMarkup:function(b,c,d){var e;d.data&&(c=a.extend(d.data,c)),y(l,[b,c,d]),a.each(c,function(a,c){if(void 0===c||c===!1)return!0;if(e=a.split("_"),e.length>1){var d=b.find(p+"-"+e[0]);if(d.length>0){var f=e[1];"replaceWith"===f?d[0]!==c[0]&&d.replaceWith(c):"img"===f?d.is("img")?d.attr("src",c):d.replaceWith('<img src="'+c+'" class="'+d.attr("class")+'" />'):d.attr(e[1],c)}}else b.find(p+"-"+a).html(c)})},_getScrollbarSize:function(){if(void 0===b.scrollbarSize){var a=document.createElement("div");a.style.cssText="width: 99px; height: 99px; overflow: scroll; position: absolute; top: -9999px;",document.body.appendChild(a),b.scrollbarSize=a.offsetWidth-a.clientWidth,document.body.removeChild(a)}return b.scrollbarSize}},a.magnificPopup={instance:null,proto:t.prototype,modules:[],open:function(b,c){return A(),b=b?a.extend(!0,{},b):{},b.isObj=!0,b.index=c||0,this.instance.open(b)},close:function(){return a.magnificPopup.instance&&a.magnificPopup.instance.close()},registerModule:function(b,c){c.options&&(a.magnificPopup.defaults[b]=c.options),a.extend(this.proto,c.proto),this.modules.push(b)},defaults:{disableOn:0,key:null,midClick:!1,mainClass:"",preloader:!0,focus:"",closeOnContentClick:!1,closeOnBgClick:!0,closeBtnInside:!0,showCloseBtn:!0,enableEscapeKey:!0,modal:!1,alignTop:!1,removalDelay:0,prependTo:null,fixedContentPos:"auto",fixedBgPos:"auto",overflowY:"auto",closeMarkup:'<button title="%title%" type="button" class="mfp-close">&times;</button>',tClose:"Close (Esc)",tLoading:"Loading..."}},a.fn.magnificPopup=function(c){A();var d=a(this);if("string"==typeof c)if("open"===c){var e,f=u?d.data("magnificPopup"):d[0].magnificPopup,g=parseInt(arguments[1],10)||0;f.items?e=f.items[g]:(e=d,f.delegate&&(e=e.find(f.delegate)),e=e.eq(g)),b._openClick({mfpEl:e},d,f)}else b.isOpen&&b[c].apply(b,Array.prototype.slice.call(arguments,1));else c=a.extend(!0,{},c),u?d.data("magnificPopup",c):d[0].magnificPopup=c,b.addGroup(d,c);return d};var C,D,E,F="inline",G=function(){E&&(D.after(E.addClass(C)).detach(),E=null)};a.magnificPopup.registerModule(F,{options:{hiddenClass:"hide",markup:"",tNotFound:"Content not found"},proto:{initInline:function(){b.types.push(F),w(h+"."+F,function(){G()})},getInline:function(c,d){if(G(),c.src){var e=b.st.inline,f=a(c.src);if(f.length){var g=f[0].parentNode;g&&g.tagName&&(D||(C=e.hiddenClass,D=x(C),C="mfp-"+C),E=f.after(D).detach().removeClass(C)),b.updateStatus("ready")}else b.updateStatus("error",e.tNotFound),f=a("<div>");return c.inlineElement=f,f}return b.updateStatus("ready"),b._parseMarkup(d,{},c),d}}});var H,I="ajax",J=function(){H&&a(document.body).removeClass(H)},K=function(){J(),b.req&&b.req.abort()};a.magnificPopup.registerModule(I,{options:{settings:null,cursor:"mfp-ajax-cur",tError:'<a href="%url%">The content</a> could not be loaded.'},proto:{initAjax:function(){b.types.push(I),H=b.st.ajax.cursor,w(h+"."+I,K),w("BeforeChange."+I,K)},getAjax:function(c){H&&a(document.body).addClass(H),b.updateStatus("loading");var d=a.extend({url:c.src,success:function(d,e,f){var g={data:d,xhr:f};y("ParseAjax",g),b.appendContent(a(g.data),I),c.finished=!0,J(),b._setFocus(),setTimeout(function(){b.wrap.addClass(q)},16),b.updateStatus("ready"),y("AjaxContentAdded")},error:function(){J(),c.finished=c.loadError=!0,b.updateStatus("error",b.st.ajax.tError.replace("%url%",c.src))}},b.st.ajax.settings);return b.req=a.ajax(d),""}}});var L,M=function(c){if(c.data&&void 0!==c.data.title)return c.data.title;var d=b.st.image.titleSrc;if(d){if(a.isFunction(d))return d.call(b,c);if(c.el)return c.el.attr(d)||""}return""};a.magnificPopup.registerModule("image",{options:{markup:'<div class="mfp-figure"><div class="mfp-close"></div><figure><div class="mfp-img"></div><figcaption><div class="mfp-bottom-bar"><div class="mfp-title"></div><div class="mfp-counter"></div></div></figcaption></figure></div>',cursor:"mfp-zoom-out-cur",titleSrc:"title",verticalFit:!0,tError:'<a href="%url%">The image</a> could not be loaded.'},proto:{initImage:function(){var c=b.st.image,d=".image";b.types.push("image"),w(m+d,function(){"image"===b.currItem.type&&c.cursor&&a(document.body).addClass(c.cursor)}),w(h+d,function(){c.cursor&&a(document.body).removeClass(c.cursor),v.off("resize"+p)}),w("Resize"+d,b.resizeImage),b.isLowIE&&w("AfterChange",b.resizeImage)},resizeImage:function(){var a=b.currItem;if(a&&a.img&&b.st.image.verticalFit){var c=0;b.isLowIE&&(c=parseInt(a.img.css("padding-top"),10)+parseInt(a.img.css("padding-bottom"),10)),a.img.css("max-height",b.wH-c)}},_onImageHasSize:function(a){a.img&&(a.hasSize=!0,L&&clearInterval(L),a.isCheckingImgSize=!1,y("ImageHasSize",a),a.imgHidden&&(b.content&&b.content.removeClass("mfp-loading"),a.imgHidden=!1))},findImageSize:function(a){var c=0,d=a.img[0],e=function(f){L&&clearInterval(L),L=setInterval(function(){return d.naturalWidth>0?void b._onImageHasSize(a):(c>200&&clearInterval(L),c++,void(3===c?e(10):40===c?e(50):100===c&&e(500)))},f)};e(1)},getImage:function(c,d){var e=0,f=function(){c&&(c.img[0].complete?(c.img.off(".mfploader"),c===b.currItem&&(b._onImageHasSize(c),b.updateStatus("ready")),c.hasSize=!0,c.loaded=!0,y("ImageLoadComplete")):(e++,200>e?setTimeout(f,100):g()))},g=function(){c&&(c.img.off(".mfploader"),c===b.currItem&&(b._onImageHasSize(c),b.updateStatus("error",h.tError.replace("%url%",c.src))),c.hasSize=!0,c.loaded=!0,c.loadError=!0)},h=b.st.image,i=d.find(".mfp-img");if(i.length){var j=document.createElement("img");j.className="mfp-img",c.el&&c.el.find("img").length&&(j.alt=c.el.find("img").attr("alt")),c.img=a(j).on("load.mfploader",f).on("error.mfploader",g),j.src=c.src,i.is("img")&&(c.img=c.img.clone()),j=c.img[0],j.naturalWidth>0?c.hasSize=!0:j.width||(c.hasSize=!1)}return b._parseMarkup(d,{title:M(c),img_replaceWith:c.img},c),b.resizeImage(),c.hasSize?(L&&clearInterval(L),c.loadError?(d.addClass("mfp-loading"),b.updateStatus("error",h.tError.replace("%url%",c.src))):(d.removeClass("mfp-loading"),b.updateStatus("ready")),d):(b.updateStatus("loading"),c.loading=!0,c.hasSize||(c.imgHidden=!0,d.addClass("mfp-loading"),b.findImageSize(c)),d)}}});var N,O=function(){return void 0===N&&(N=void 0!==document.createElement("p").style.MozTransform),N};a.magnificPopup.registerModule("zoom",{options:{enabled:!1,easing:"ease-in-out",duration:300,opener:function(a){return a.is("img")?a:a.find("img")}},proto:{initZoom:function(){var a,c=b.st.zoom,d=".zoom";if(c.enabled&&b.supportsTransition){var e,f,g=c.duration,j=function(a){var b=a.clone().removeAttr("style").removeAttr("class").addClass("mfp-animated-image"),d="all "+c.duration/1e3+"s "+c.easing,e={position:"fixed",zIndex:9999,left:0,top:0,"-webkit-backface-visibility":"hidden"},f="transition";return e["-webkit-"+f]=e["-moz-"+f]=e["-o-"+f]=e[f]=d,b.css(e),b},k=function(){b.content.css("visibility","visible")};w("BuildControls"+d,function(){if(b._allowZoom()){if(clearTimeout(e),b.content.css("visibility","hidden"),a=b._getItemToZoom(),!a)return void k();f=j(a),f.css(b._getOffset()),b.wrap.append(f),e=setTimeout(function(){f.css(b._getOffset(!0)),e=setTimeout(function(){k(),setTimeout(function(){f.remove(),a=f=null,y("ZoomAnimationEnded")},16)},g)},16)}}),w(i+d,function(){if(b._allowZoom()){if(clearTimeout(e),b.st.removalDelay=g,!a){if(a=b._getItemToZoom(),!a)return;f=j(a)}f.css(b._getOffset(!0)),b.wrap.append(f),b.content.css("visibility","hidden"),setTimeout(function(){f.css(b._getOffset())},16)}}),w(h+d,function(){b._allowZoom()&&(k(),f&&f.remove(),a=null)})}},_allowZoom:function(){return"image"===b.currItem.type},_getItemToZoom:function(){return b.currItem.hasSize?b.currItem.img:!1},_getOffset:function(c){var d;d=c?b.currItem.img:b.st.zoom.opener(b.currItem.el||b.currItem);var e=d.offset(),f=parseInt(d.css("padding-top"),10),g=parseInt(d.css("padding-bottom"),10);e.top-=a(window).scrollTop()-f;var h={width:d.width(),height:(u?d.innerHeight():d[0].offsetHeight)-g-f};return O()?h["-moz-transform"]=h.transform="translate("+e.left+"px,"+e.top+"px)":(h.left=e.left,h.top=e.top),h}}});var P="iframe",Q="//about:blank",R=function(a){if(b.currTemplate[P]){var c=b.currTemplate[P].find("iframe");c.length&&(a||(c[0].src=Q),b.isIE8&&c.css("display",a?"block":"none"))}};a.magnificPopup.registerModule(P,{options:{markup:'<div class="mfp-iframe-scaler"><div class="mfp-close"></div><iframe class="mfp-iframe" src="//about:blank" frameborder="0" allowfullscreen></iframe></div>',srcAction:"iframe_src",patterns:{youtube:{index:"youtube.com",id:"v=",src:"//www.youtube.com/embed/%id%?autoplay=1"},vimeo:{index:"vimeo.com/",id:"/",src:"//player.vimeo.com/video/%id%?autoplay=1"},gmaps:{index:"//maps.google.",src:"%id%&output=embed"}}},proto:{initIframe:function(){b.types.push(P),w("BeforeChange",function(a,b,c){b!==c&&(b===P?R():c===P&&R(!0))}),w(h+"."+P,function(){R()})},getIframe:function(c,d){var e=c.src,f=b.st.iframe;a.each(f.patterns,function(){return e.indexOf(this.index)>-1?(this.id&&(e="string"==typeof this.id?e.substr(e.lastIndexOf(this.id)+this.id.length,e.length):this.id.call(this,e)),e=this.src.replace("%id%",e),!1):void 0});var g={};return f.srcAction&&(g[f.srcAction]=e),b._parseMarkup(d,g,c),b.updateStatus("ready"),d}}});var S=function(a){var c=b.items.length;return a>c-1?a-c:0>a?c+a:a},T=function(a,b,c){return a.replace(/%curr%/gi,b+1).replace(/%total%/gi,c)};a.magnificPopup.registerModule("gallery",{options:{enabled:!1,arrowMarkup:'<button title="%title%" type="button" class="mfp-arrow mfp-arrow-%dir%"></button>',preload:[0,2],navigateByImgClick:!0,arrows:!0,tPrev:"Previous (Left arrow key)",tNext:"Next (Right arrow key)",tCounter:"%curr% of %total%"},proto:{initGallery:function(){var c=b.st.gallery,e=".mfp-gallery",g=Boolean(a.fn.mfpFastClick);return b.direction=!0,c&&c.enabled?(f+=" mfp-gallery",w(m+e,function(){c.navigateByImgClick&&b.wrap.on("click"+e,".mfp-img",function(){return b.items.length>1?(b.next(),!1):void 0}),d.on("keydown"+e,function(a){37===a.keyCode?b.prev():39===a.keyCode&&b.next()})}),w("UpdateStatus"+e,function(a,c){c.text&&(c.text=T(c.text,b.currItem.index,b.items.length))}),w(l+e,function(a,d,e,f){var g=b.items.length;e.counter=g>1?T(c.tCounter,f.index,g):""}),w("BuildControls"+e,function(){if(b.items.length>1&&c.arrows&&!b.arrowLeft){var d=c.arrowMarkup,e=b.arrowLeft=a(d.replace(/%title%/gi,c.tPrev).replace(/%dir%/gi,"left")).addClass(s),f=b.arrowRight=a(d.replace(/%title%/gi,c.tNext).replace(/%dir%/gi,"right")).addClass(s),h=g?"mfpFastClick":"click";e[h](function(){b.prev()}),f[h](function(){b.next()}),b.isIE7&&(x("b",e[0],!1,!0),x("a",e[0],!1,!0),x("b",f[0],!1,!0),x("a",f[0],!1,!0)),b.container.append(e.add(f))}}),w(n+e,function(){b._preloadTimeout&&clearTimeout(b._preloadTimeout),b._preloadTimeout=setTimeout(function(){b.preloadNearbyImages(),b._preloadTimeout=null},16)}),void w(h+e,function(){d.off(e),b.wrap.off("click"+e),b.arrowLeft&&g&&b.arrowLeft.add(b.arrowRight).destroyMfpFastClick(),b.arrowRight=b.arrowLeft=null})):!1},next:function(){b.direction=!0,b.index=S(b.index+1),b.updateItemHTML()},prev:function(){b.direction=!1,b.index=S(b.index-1),b.updateItemHTML()},goTo:function(a){b.direction=a>=b.index,b.index=a,b.updateItemHTML()},preloadNearbyImages:function(){var a,c=b.st.gallery.preload,d=Math.min(c[0],b.items.length),e=Math.min(c[1],b.items.length);for(a=1;a<=(b.direction?e:d);a++)b._preloadItem(b.index+a);for(a=1;a<=(b.direction?d:e);a++)b._preloadItem(b.index-a)},_preloadItem:function(c){if(c=S(c),!b.items[c].preloaded){var d=b.items[c];d.parsed||(d=b.parseEl(c)),y("LazyLoad",d),"image"===d.type&&(d.img=a('<img class="mfp-img" />').on("load.mfploader",function(){d.hasSize=!0}).on("error.mfploader",function(){d.hasSize=!0,d.loadError=!0,y("LazyLoadError",d)}).attr("src",d.src)),d.preloaded=!0}}}});var U="retina";a.magnificPopup.registerModule(U,{options:{replaceSrc:function(a){return a.src.replace(/\.\w+$/,function(a){return"@2x"+a})},ratio:1},proto:{initRetina:function(){if(window.devicePixelRatio>1){var a=b.st.retina,c=a.ratio;c=isNaN(c)?c():c,c>1&&(w("ImageHasSize."+U,function(a,b){b.img.css({"max-width":b.img[0].naturalWidth/c,width:"100%"})}),w("ElementParse."+U,function(b,d){d.src=a.replaceSrc(d,c)}))}}}}),function(){var b=1e3,c="ontouchstart"in window,d=function(){v.off("touchmove"+f+" touchend"+f)},e="mfpFastClick",f="."+e;a.fn.mfpFastClick=function(e){return a(this).each(function(){var g,h=a(this);if(c){var i,j,k,l,m,n;h.on("touchstart"+f,function(a){l=!1,n=1,m=a.originalEvent?a.originalEvent.touches[0]:a.touches[0],j=m.clientX,k=m.clientY,v.on("touchmove"+f,function(a){m=a.originalEvent?a.originalEvent.touches:a.touches,n=m.length,m=m[0],(Math.abs(m.clientX-j)>10||Math.abs(m.clientY-k)>10)&&(l=!0,d())}).on("touchend"+f,function(a){d(),l||n>1||(g=!0,a.preventDefault(),clearTimeout(i),i=setTimeout(function(){g=!1},b),e())})})}h.on("click"+f,function(){g||e()})})},a.fn.destroyMfpFastClick=function(){a(this).off("touchstart"+f+" click"+f),c&&v.off("touchmove"+f+" touchend"+f)}}(),A()});


/*================ TIMBER ================*/
// Timber functions
window.timber = window.timber || {};

timber.cacheSelectors = function() {
  timber.cache = {
    // General
    $html: $('html'),
    $body: $('body'),
    $window: $(window),

    // Navigation
    $navigation: $('#AccessibleNav')
  };
};

timber.init = function() {
  timber.cacheSelectors();
  timber.accessibleNav();
  timber.autoResponsiveElements();
};

timber.accessibleNav = function() {
  var classes = {
    active: 'nav-hover',
    focus: 'nav-focus',
    outside: 'nav-outside',
    hasDropdown: 'site-nav--has-dropdown'
  };
  var selectors = {
    active: '.nav-hover',
    hasDropdown: '.site-nav--has-dropdown',
    dropdown: '[data-meganav-dropdown]',
    link: '.site-nav__link',
    nextLink: '> .site-nav__link',
    parentLink: '[data-meganav-type="parent"]',
    childLink: '[data-meganav-type="child"]'
  };

  var $nav = timber.cache.$navigation,
    $allLinks = $nav.find(selectors.link),
    $parents = $nav.find(selectors.hasDropdown),
    $childLinks = $nav.find(selectors.childLink),
    $topLevel = $parents.find(selectors.nextLink),
    $dropdowns = $nav.find(selectors.dropdown),
    $subMenuLinks = $dropdowns.find(selectors.link);

  // Mouseenter
  $parents.on('mouseenter touchstart', function(evt) {
    var $el = $(this);
    var evtType = evt.type;
    var $dropdowns = $nav.find(selectors.active);

    if (!$el.hasClass(classes.active)) {
      // force stop the click from happening
      evt.preventDefault();
      evt.stopImmediatePropagation();
    }

    // Make sure we close any opened same level dropdown before opening a new one
    if (evtType === 'touchstart' && $dropdowns.length > 0) {
      hideDropdown($el);
    }

    showDropdown($el);
  });

  $childLinks.on('touchstart', function(evt) {
    evt.stopImmediatePropagation();
  });

  $parents.on('mouseleave', function() {
    hideDropdown($(this));
  });

  $allLinks.on('focus', function() {
    handleFocus($(this));
  });

  $allLinks.on('blur', function() {
    removeFocus($topLevel);
  });

  // accessibleNav private methods
  function handleFocus($el) {
    var $newFocus = null,
      $previousItem = $el.parent().prev();

    // Always put tabindex -1 on previous element just in case the user is going backward.
    // In that case, we want to focus on the previous parent and not the previous parent childs

    $allLinks.attr('tabindex', '');

    if ($previousItem.hasClass(classes.hasDropdown)) {
      $previousItem.find(selectors.dropdown + ' a').attr('tabindex', -1);
    }

    $newFocus = $el.parents(selectors.hasDropdown).find('> a');
    addFocus($newFocus);
  }

  function showDropdown($el) {
    var $toplevel = $el.find(selectors.nextLink);

    $toplevel.attr('aria-expanded', true);

    $el.addClass(classes.active);

    setTimeout(function() {
      timber.cache.$body.on('touchstart.MegaNav', function() {
        hideDropdowns();
      });
    }, 250);
  }

  function hideDropdown($el) {
    var $dropdowns = $el.parent().find(selectors.active);
    var $parentLink = $dropdowns.find(selectors.nextLink);

    $parentLink.attr('aria-expanded', false);

    $dropdowns.removeClass(classes.active);

    timber.cache.$body.off('touchstart.MegaNav');
  }

  function hideDropdowns() {
    var $dropdowns = $nav.find(selectors.active);
    $.each($dropdowns, function() {
      hideDropdown($(this));
    });
  }

  function addFocus($el) {
    $el.addClass(classes.focus);

    if ($el.attr('aria-expanded') !== undefined) {
      $el.attr('aria-expanded', true);
    }
  }

  function removeFocus($el) {
    $el.removeClass(classes.focus);

    $subMenuLinks.attr('tabindex', -1);

    if ($el.attr('aria-expanded') !== undefined) {
      $el.attr('aria-expanded', false);
    }
  }

  // Check if dropdown is outside of viewport
  function handleDropdownOffset($dropdowns) {
    var viewportSize = $(window).width();
    $dropdowns.removeClass(classes.outside);

    $.each($dropdowns, function() {
      var $dropdown = $(this);
      var dropdownOffset = $dropdown.offset().left + $dropdown.width();
      if (dropdownOffset > viewportSize) {
        $dropdown.addClass(classes.outside);
      }
    });
  }

  timber.cache.$window.load(function() {
    handleDropdownOffset($dropdowns);
  });

  timber.cache.$window.resize(function() {
    afterResize(function() {
      handleDropdownOffset($dropdowns);
    }, 250);
  });
};

timber.autoResponsiveElements = function() {
  var $iframeVideo = $(
    'iframe[src*="youtube.com/embed"], iframe[src*="player.vimeo"]'
  );
  var $iframeReset = $iframeVideo.add('iframe#admin_bar_iframe');

  $('table').wrap('<div class="table-wrapper"></div>');

  $iframeVideo.each(function() {
    // Add wrapper to make video responsive
    if (!$(this).parents('.video-wrapper').length) {
      $(this).wrap('<div class="video-wrapper"></div>');
    }
  });

  $iframeReset.each(function() {
    // Re-set the src attribute on each iframe after page load
    // for Chrome's 'incorrect iFrame content on 'back'' bug.
    // https://code.google.com/p/chromium/issues/detail?id=395791
    // Need to specifically target video and admin bar
    this.src = this.src;
  });
};

// Initialize Timber's JS on docready
$(timber.init);


/* ================ SLATE ================ */
theme.Sections = function Sections() {
  this.constructors = {};
  this.instances = [];

  $(document)
    .on('shopify:section:load', this._onSectionLoad.bind(this))
    .on('shopify:section:unload', this._onSectionUnload.bind(this))
    .on('shopify:section:select', this._onSelect.bind(this))
    .on('shopify:section:deselect', this._onDeselect.bind(this))
    .on('shopify:block:select', this._onBlockSelect.bind(this))
    .on('shopify:block:deselect', this._onBlockDeselect.bind(this));
};

theme.Sections.prototype = _.assignIn({}, theme.Sections.prototype, {
  _createInstance: function(container, constructor) {
    var $container = $(container);
    var id = $container.attr('data-section-id');
    var type = $container.attr('data-section-type');

    constructor = constructor || this.constructors[type];

    if (_.isUndefined(constructor)) {
      return;
    }

    var instance = _.assignIn(new constructor(container), {
      id: id,
      type: type,
      container: container
    });

    this.instances.push(instance);
  },

  _onSectionLoad: function(evt) {
    var container = $('[data-section-id]', evt.target)[0];
    if (container) {
      this._createInstance(container);
    }
  },

  _onSectionUnload: function(evt) {
    this.instances = _.filter(this.instances, function(instance) {
      var isEventInstance = instance.id === evt.detail.sectionId;

      if (isEventInstance) {
        if (_.isFunction(instance.onUnload)) {
          instance.onUnload(evt);
        }
      }

      return !isEventInstance;
    });
  },

  _onSelect: function(evt) {
    // eslint-disable-next-line no-shadow
    var instance = _.find(this.instances, function(instance) {
      return instance.id === evt.detail.sectionId;
    });

    if (!_.isUndefined(instance) && _.isFunction(instance.onSelect)) {
      instance.onSelect(evt);
    }
  },

  _onDeselect: function(evt) {
    // eslint-disable-next-line no-shadow
    var instance = _.find(this.instances, function(instance) {
      return instance.id === evt.detail.sectionId;
    });

    if (!_.isUndefined(instance) && _.isFunction(instance.onDeselect)) {
      instance.onDeselect(evt);
    }
  },

  _onBlockSelect: function(evt) {
    // eslint-disable-next-line no-shadow
    var instance = _.find(this.instances, function(instance) {
      return instance.id === evt.detail.sectionId;
    });

    if (!_.isUndefined(instance) && _.isFunction(instance.onBlockSelect)) {
      instance.onBlockSelect(evt);
    }
  },

  _onBlockDeselect: function(evt) {
    // eslint-disable-next-line no-shadow
    var instance = _.find(this.instances, function(instance) {
      return instance.id === evt.detail.sectionId;
    });

    if (!_.isUndefined(instance) && _.isFunction(instance.onBlockDeselect)) {
      instance.onBlockDeselect(evt);
    }
  },

  register: function(type, constructor) {
    this.constructors[type] = constructor;

    $('[data-section-type=' + type + ']').each(
      function(index, container) {
        this._createInstance(container, constructor);
      }.bind(this)
    );
  }
});

/**
 * A11y Helpers
 * -----------------------------------------------------------------------------
 * A collection of useful functions that help make your theme more accessible
 * to users with visual impairments.
 */

theme.a11y = {
  /**
   * For use when focus shifts to a container rather than a link
   * eg for In-page links, after scroll, focus shifts to content area so that
   * next `tab` is where user expects if focusing a link, just $link.focus();
   *
   * @param {JQuery} $element - The element to be acted upon
   */
  pageLinkFocus: function($element) {
    var focusClass = 'js-focus-hidden';

    $element
      .first()
      .attr('tabIndex', '-1')
      .focus()
      .addClass(focusClass)
      .one('blur', callback);

    function callback() {
      $element
        .first()
        .removeClass(focusClass)
        .removeAttr('tabindex');
    }
  },

  /**
   * If there's a hash in the url, focus the appropriate element
   */
  focusHash: function() {
    var hash = window.location.hash;

    // is there a hash in the url? is it an element on the page?
    if (hash && document.getElementById(hash.slice(1))) {
      this.pageLinkFocus($(hash));
    }
  },

  /**
   * When an in-page (url w/hash) link is clicked, focus the appropriate element
   */
  bindInPageLinks: function() {
    $('a[href*=#]').on(
      'click',
      function(evt) {
        this.pageLinkFocus($(evt.currentTarget.hash));
      }.bind(this)
    );
  },

  /**
   * Traps the focus in a particular container
   *
   * @param {object} options - Options to be used
   * @param {jQuery} options.$container - Container to trap focus within
   * @param {jQuery} options.$elementToFocus - Element to be focused when focus leaves container
   * @param {string} options.namespace - Namespace used for new focus event handler
   */
  trapFocus: function(options) {
    var eventName = options.namespace
      ? 'focusin.' + options.namespace
      : 'focusin';

    if (!options.$elementToFocus) {
      options.$elementToFocus = options.$container;
    }

    options.$container.attr('tabindex', '-1');
    options.$elementToFocus.focus();

    $(document).on(eventName, function(evt) {
      if (
        options.$container[0] !== evt.target &&
        !options.$container.has(evt.target).length
      ) {
        options.$container.focus();
      }
    });
  },

  /**
   * Removes the trap of focus in a particular container
   *
   * @param {object} options - Options to be used
   * @param {jQuery} options.$container - Container to trap focus within
   * @param {string} options.namespace - Namespace used for new focus event handler
   */
  removeTrapFocus: function(options) {
    var eventName = options.namespace
      ? 'focusin.' + options.namespace
      : 'focusin';

    if (options.$container && options.$container.length) {
      options.$container.removeAttr('tabindex');
    }

    $(document).off(eventName);
  }
};


/* ================ MODULES ================ */
theme.Hero = (function() {
  theme.sliders = function(slider, sectionId) {
    this.$slider = $(slider);
    this.$sliderContainer = this.$slider.parent();
    this.sectionId = sectionId;
    this.selectors = {
      slide: '[data-slider-item]',
      activeSlide: '.flex-active-slide',
      navigationButton: '[data-slider-navigation]',
      previousArrow: '[data-slider-prev]',
      pauseButton: '[data-slider-pause]',
      textContentMobile: '[data-text-mobile]',
      indicatorDotsContainer: '.flex-control-nav'
    };
    $.extend(theme.strings, {
      loadSlideA11yString: this.$slider.data('slide-nav-a11y'),
      activeSlideA11yString: this.$slider.data('slide-nav-active-a11y')
    });
    this.sliderArgs = {
      animation: this.$slider.data('transition'),
      animationSpeed: 500,
      pauseOnHover: true,
      keyboard: false,
      slideshow: this.$slider.data('autoplay'),
      slideshowSpeed: this.$slider.data('speed'),
      controlNav: true,
      directionNav: false,
      smoothHeight: false,
      // eslint-disable-next-line shopify/jquery-dollar-sign-reference
      controlsContainer: this.$sliderContainer.find('[data-slider-controls]'),
      before: function(slider) {
        var $slider = $(slider);
        $slider.resize();
        $slider
          .find(this.selectors.slide)
          .not(this.selectors.activeSlide)
          .removeClass('slide-hide');

        this.showMobileText(slider.animatingTo);
      }.bind(this),
      start: function(slider) {
        this.slideshowA11y(slider);
      }.bind(this),
      after: function(slider) {
        var $slider = $(slider);
        var $slides = $slider.find(this.selectors.slide);
        var $activeSlide = $slider.find(this.selectors.activeSlide);
        var $indicatorDots = this.$sliderContainer.find(
          this.selectors.indicatorDotsContainer + ' a'
        );
        var currentSlide = slider.currentSlide;

        $slider
          .find(this.selectors.slide)
          .not(this.selectors.activeSlide)
          .addClass('slide-hide');
        $slider.resize();

        $slides.attr('aria-hidden', true);
        $activeSlide.attr('aria-hidden', false);

        $indicatorDots.each(function(index) {
          var $element = $(this);
          $element.attr('aria-label', slideLabel(currentSlide, index));
          if (index === currentSlide) {
            $element.attr('aria-current', true);
          } else {
            $element.removeAttr('aria-current');
          }
        });
      }.bind(this),
      init: function(slider) {
        var $slider = $(slider);
        var previousArrow = this.selectors.previousArrow;
        $slider.find(this.selectors.activeSlide).removeClass('slide-hide');

        this.$sliderContainer
          .find(this.selectors.navigationButton)
          .on('click keyup', function(evt) {
            if (
              evt.type === 'keyup' &&
              !(evt.keyCode === '13' || evt.keyCode === '32')
            ) {
              return;
            }
            if ($(this).is(previousArrow)) {
              $slider.flexslider('prev');
            } else {
              $slider.flexslider('next');
            }
          });

        if (this.sliderArgs.slideshow) {
          var $pauseButton = this.$sliderContainer.find(
            this.selectors.pauseButton
          );
          var pausedClass = 'is-paused';

          $pauseButton.on('click', function() {
            var $element = $(this);
            var isPaused = $element.hasClass(pausedClass);

            $element.toggleClass(pausedClass, !isPaused).attr({
              'aria-label': isPaused
                ? $element.data('label-pause')
                : $element.data('label-play'),
              'aria-pressed': !isPaused
            });

            if (isPaused) {
              $slider.flexslider('play');
            } else {
              $slider.flexslider('pause');
            }
          });
        }
      }.bind(this)
    };

    this.slideshowA11y = function(slider) {
      var $slider = $(slider);
      var $sliderContainer = this.$sliderContainer;
      var $slides = $slider.find(this.selectors.slide);
      var $activeSlide = $slider.find(this.selectors.activeSlide);
      var sectionId = this.sectionId;
      var $indicatorsContainer = $sliderContainer.find(
        this.selectors.indicatorDotsContainer
      );
      var $indicatorDots = $indicatorsContainer.find('a');

      $sliderContainer
        .on('keyup', this.keyboardNavigation.bind(this))
        .on('focusin', function(evt) {
          if (
            $(this).has(evt.target).length &&
            $slider.attr('aria-live') === 'polite'
          ) {
            return;
          }

          $slider.attr('aria-live', 'polite');
        })
        .on('focusout', function(evt) {
          if ($(this).has(evt.relatedTarget).length) {
            return;
          }

          $slider.removeAttr('aria-live');
        });

      $slides.each(function() {
        $(this).attr('aria-hidden', true);
      });

      $activeSlide.attr('aria-hidden', false);

      // Turn off default listeners set by flexslider
      $indicatorsContainer.off('click touchend MSPointerUp keyup', 'a, img');

      $indicatorDots.each(function(index) {
        var $element = $(this);
        $element
          .attr({
            'aria-label': slideLabel(0, index),
            'data-slide-number': index + 1,
            'aria-controls': 'slide--' + sectionId + '-' + index,
            href: '#flexslider--' + sectionId
          })
          .on('keyup click', function(evt) {
            if (evt.type === 'keyup') {
              if (evt.which === 9) {
                evt.stopImmediatePropagation();
              }
              if (evt.which !== 13) {
                return;
              }
            }

            evt.preventDefault();

            var slideNumber = $(evt.target).data('slide-number') - 1;

            $slider.flexslider(slideNumber);

            if (evt.type === 'keyup' || evt.detail === 0) {
              $sliderContainer.focus();
            }
          });

        if (index === 0) {
          $element.attr('aria-current', true);
        }
      });
    };

    this.showMobileText = function(slideIndex) {
      var $allTextContent = this.$sliderContainer.find(
        this.selectors.textContentMobile
      );
      var $currentTextContent = $allTextContent.filter(
        '[data-mobile-slide-text=' + slideIndex + ']'
      );
      $allTextContent.hide();
      $currentTextContent.show();
    };

    this.keyboardNavigation = function(evt) {
      if (evt.keyCode === 37) {
        this.$slider.flexslider('prev');
      }
      if (evt.keyCode === 39) {
        this.$slider.flexslider('next');
      }
    };

    if (this.$slider.length) {
      if (this.$slider.find('li').length === 1) {
        this.sliderArgs.slideshow = false;
        this.sliderArgs.slideshowSpeed = 0;
        this.sliderArgs.controlNav = false;
        this.sliderArgs.directionNav = false;
        this.sliderArgs.touch = false;
      }

      // eslint-disable-next-line shopify/jquery-dollar-sign-reference
      var slideshow = this.$slider.flexslider(this.sliderArgs);

      this.showMobileText(0);

      return slideshow;
    }
  };

  function slideLabel(activeSlideIndex, currentIndex) {
    var label =
      activeSlideIndex === currentIndex
        ? theme.strings.activeSlideA11yString
        : theme.strings.loadSlideA11yString;

    return label.replace('[slide_number]', currentIndex + 1);
  }

  return theme.sliders;
})();


/*================ SECTIONS ================*/
theme.Product = (function() {
  function Product(container) {
    this.$container = $(container);
    this.sectionId = this.$container.attr('data-section-id');

    this.selectors = {
      $html: $('html'),
      $productImageGallery: $('.gallery__item', this.$container),
      $productImages: $('.product-single__image-wrapper', this.$container),
      $thumbImages: $('#ProductThumbs', this.$container).find(
        'a.product-single__thumbnail'
      ),
      $addToCart: $('#AddToCart', this.$container),
      $productPrice: $('#ProductPrice', this.$container),
      $comparePrice: $('#ComparePrice', this.$container),
      $comparePriceA11y: $('#ComparePriceA11y', this.$container),
      $priceA11y: $('#PriceA11y', this.$container),
      $quantityElements: $('.product-single__quantity', this.$container),
      $addToCartText: $('#AddToCartText', this.$container),
      $tabTrigger: $('.tab-switch__trigger', this.$container),
      $tabContent: $('.tab-switch__content', this.$container),
      $productFullDetails: $('.product-single__full-details', this.$container),
      $SKU: $('.variant-sku', this.$container),
      $shopifyPaymentButton: $('.shopify-payment-button', this.$container),
      $unitPrice: $('[data-unit-price]', this.$container),
      $unitPriceBaseUnit: $('[data-unit-price-base-unit]', this.$container),
      $unitPriceContainer: $('[data-unit-price-container]', this.$container)
    };

    this.classes = {
      hide: 'hide'
    };

    if (!$('#ProductJson-' + this.sectionId).html()) {
      return;
    }

    this.zoomType = this.$container.data('image-zoom-type');
    this.showExtraTab = this.$container.data('show-extra-tab') || false;
    this.extraTabContent = this.$container.data('extra-tab-content') || '';
    this.enableHistoryState =
      this.$container.data('enable-history-state') || false;

    this.productSingleObject = JSON.parse(
      document.getElementById('ProductJson-' + this.sectionId).innerHTML
    );

    this.init();
  }

  Product.prototype = _.assignIn({}, Product.prototype, {
    init: function() {
      this.initBreakpoints();
      this.initProductVariant();
      this.productImageSwitch();
      timber.autoResponsiveElements();

      if (this.zoomType === 'lightbox') {
        this.productImageGallery();
      } else if (this.zoomType === 'zoom-in') {
        this.productImageZoom();
      }

      if (!this.showExtraTab || this.extraTabContent) {
        this.initProductTabs();
      }
    },

    initBreakpoints: function() {
      var self = this;

      enquire.register(theme.variables.mediaQueryMedium, {
        match: function() {
          if (self.zoomType === 'zoom-in') {
            if (self.selectors.$productImages.length) {
              // remove event handlers for product zoom on mobile
              self.selectors.$productImages.trigger('zoom.destroy');
              self.selectors.$productImages.off();
              self.selectors.$productImages.removeClass('image-zoom');
            }
          } else if (self.zoomType === 'lightbox') {
            // remove event handlers for lightbox on mobile
            self.selectors.$productImageGallery.off();
            self.selectors.$productImages.each(function() {
              $(this).removeClass('zoom-lightbox');
            });
          }

          theme.variables.bpSmall = true;
        },
        unmatch: function() {
          theme.variables.bpSmall = false;
          if (self.zoomType === 'zoom-in') {
            // reinit product zoom
            self.productImageZoom();
          } else if (self.zoomType === 'lightbox') {
            // reinit lightbox
            self.selectors.$productImages.each(function() {
              $(this).addClass('zoom-lightbox');
            });
            self.productImageGallery();
          }
        }
      });
    },

    productImageGallery: function() {
      if (theme.variables.bpSmall) return;

      if (!this.selectors.$productImageGallery.length) return;

      this.selectors.$productImageGallery.magnificPopup({
        type: 'image',
        mainClass: 'mfp-fade',
        closeOnBgClick: true,
        closeBtnInside: false,
        closeOnContentClick: true,
        tClose: theme.strings.zoomClose,
        removalDelay: 500,
        callbacks: {
          open: function() {
            $('html').css('overflow-y', 'hidden');
          },
          close: function() {
            $('html').css('overflow-y', '');
          }
        },
        gallery: {
          enabled: true,
          navigateByImgClick: false,
          arrowMarkup:
            '<button title="%title%" type="button" class="mfp-arrow mfp-arrow-%dir%"><span class="mfp-chevron mfp-chevron-%dir%"></span></button>',
          tPrev: theme.strings.zoomPrev,
          tNext: theme.strings.zoomNext
        }
      });

      var $productImageGallery = this.selectors.$productImageGallery;
      this.selectors.$productImages.each(function() {
        $(this).bind('click', function() {
          var imageId = $(this).attr('data-image-id');
          $productImageGallery
            .filter('[data-image-id="' + imageId + '"]')
            .trigger('click');
        });
      });
    },

    productImageSwitch: function() {
      if (!this.selectors.$thumbImages.length) {
        return;
      }

      var self = this;

      // Switch the main image with one of the thumbnails
      // Note: this does not change the variant selected, just the image
      this.selectors.$thumbImages.on('click', function(evt) {
        evt.preventDefault();
        var newImageId = $(this).attr('data-image-id');
        self.switchImage(newImageId);
      });
    },

    initProductTabs: function() {
      if (!this.selectors.$tabTrigger.length) {
        return;
      }

      var $trigger = this.selectors.$tabTrigger,
        $content = this.selectors.$tabContent,
        $el,
        link;

      // Hide extra content areas with JS and set active tab
      $content.filter(':gt(0)').addClass('is-hidden');
      $trigger.first().addClass('is-active');

      $trigger.on('click', function(evt) {
        evt.preventDefault();
        // set active tab
        $trigger.removeClass('is-active');
        $el = $(this).addClass('is-active');

        // hide all content areas, then show desired one
        link = $el.data('link');
        $content.addClass('is-hidden');
        $content
          .filter('[data-content="' + link + '"]')
          .removeClass('is-hidden');
      });
    },

    initProductVariant: function() {
      var self = this;
      var product = this.productSingleObject;

      var selectCallback = function(variant, selector) {
        self.productPage({
          money_format: theme.moneyFormat,
          variant: variant,
          selector: selector,
          translations: {
            add_to_cart: theme.strings.addToCart,
            sold_out: theme.strings.soldOut,
            unavailable: theme.strings.unavailable
          }
        });
      };

      this.optionSelector = new Shopify.OptionSelectors(
        'ProductSelect-' + this.sectionId,
        {
          product: product,
          onVariantSelected: selectCallback,
          enableHistoryState: this.enableHistoryState
        }
      );

      // Add label if only one product option and it isn't 'Title'. Could be 'Size'.
      if (product.options.length === 1 && product.options[0] !== 'Title') {
        $('.selector-wrapper:eq(0)', this.$container).prepend(
          '<label for="productSelect-option-0">' +
            product.options[0] +
            '</label>'
        );
      }

      // Hide selectors if we only have 1 variant and its title contains 'Default'.
      if (
        product.variants.length === 1 &&
        product.variants[0].title.toLowerCase().indexOf('default') !== -1
      ) {
        $('.selector-wrapper', this.$container).hide();
      }
    },

    productPage: function(options) {
      var self = this;
      var moneyFormat = options.money_format;
      var variant = options.variant;
      var translations = options.translations;

      if (variant) {
        // Update variant image, if one is set
        if (variant.featured_image) {
          var newImg = variant.featured_image;
          self.switchImage(newImg.id);
        }

        // Select a valid variant if available
        if (variant.available) {
          // Available, enable the submit button, change text, show quantity elements
          this.selectors.$addToCart
            .removeClass('disabled')
            .prop('disabled', false);
          this.selectors.$addToCartText.html(translations.add_to_cart);
          this.selectors.$quantityElements.show();
          this.selectors.$shopifyPaymentButton.show();

          var $link = $(this.selectors.$productFullDetails, this.$container);

          if ($link.length) {
            $link.attr(
              'href',
              this.updateUrlParameter($link.attr('href'), 'variant', variant.id)
            );
          }
        } else {
          // Sold out, disable the submit button, change text, hide quantity elements
          this.selectors.$addToCart.addClass('disabled').prop('disabled', true);
          this.selectors.$addToCartText.html(translations.sold_out);
          this.selectors.$quantityElements.hide();
          this.selectors.$shopifyPaymentButton.hide();
        }

        // Regardless of stock, update the product price
        this.selectors.$productPrice.html(
          Shopify.formatMoney(variant.price, moneyFormat)
        );

        // Show SKU
        this.selectors.$SKU.html(variant.sku);

        // Also update and show the product's compare price if necessary
        if (variant.compare_at_price > variant.price) {
          this.selectors.$comparePrice
            .html(Shopify.formatMoney(variant.compare_at_price, moneyFormat))
            .removeClass(this.classes.hide);
          this.selectors.$comparePriceA11y.attr('aria-hidden', 'false');
          this.selectors.$priceA11y.attr('aria-hidden', 'false');
        } else {
          this.selectors.$comparePrice.addClass(this.classes.hide).html('');
          this.selectors.$comparePriceA11y.attr('aria-hidden', 'true');
        }

        // Unit price
        this.selectors.$unitPriceContainer.addClass(this.classes.hide);

        if (variant.unit_price) {
          this.selectors.$unitPrice.html(
            Shopify.formatMoney(variant.unit_price, theme.moneyFormat)
          );
          this.selectors.$unitPriceBaseUnit.html(this.getBaseUnit(variant));
          this.selectors.$unitPriceContainer.removeClass(this.classes.hide);
        }
      } else {
        // The variant doesn't exist, disable submit button.
        // This may be an error or notice that a specific variant is not available.
        // To only show available variants, implement linked product options:
        //   - http://docs.shopify.com/manual/configuration/store-customization/advanced-navigation/linked-product-options
        this.selectors.$addToCart.addClass('disabled').prop('disabled', true);
        this.selectors.$addToCartText.html(translations.unavailable);
        this.selectors.$quantityElements.hide();
        this.selectors.$shopifyPaymentButton.hide();
      }
    },

    updateUrlParameter: function(url, key, value) {
      var re = new RegExp('([?&])' + key + '=.*?(&|$)', 'i');
      var separator = url.indexOf('?') === -1 ? '?' : '&';

      if (url.match(re)) {
        return url.replace(re, '$1' + key + '=' + value + '$2');
      } else {
        return url + separator + key + '=' + value;
      }
    },

    switchImage: function(imageId) {
      var $newImage = $(
        this.selectors.$productImages.selector +
          "[data-image-id='" +
          imageId +
          "']",
        this.$container
      );
      var $otherImages = $(
        this.selectors.$productImages.selector +
          ":not([data-image-id='" +
          imageId +
          "'])",
        this.$container
      );

      $newImage.removeClass(this.classes.hide);
      $otherImages.addClass(this.classes.hide);
    },

    productImageZoom: function() {
      if (theme.variables.bpSmall && this.zoomType !== 'zoom-in') return;

      if (
        !this.selectors.$productImages.length ||
        this.selectors.$html.hasClass('supports-touch')
      )
        return;

      // Destroy zoom (in case it was already set), then set it up again
      this.selectors.$productImages.trigger('zoom.destroy');

      this.selectors.$productImages.each(function() {
        $(this)
          .addClass('image-zoom')
          .zoom({
            url: $(this)
              .find('img')
              .attr('data-zoom')
          });
      });
    },

    getBaseUnit: function(variant) {
      return variant.unit_price_measurement.reference_value === 1
        ? variant.unit_price_measurement.reference_unit
        : variant.unit_price_measurement.reference_value +
            variant.unit_price_measurement.reference_unit;
    }
  });

  return Product;
})();

theme.Collection = (function() {
  function Collection(container) {
    this.$container = $(container);

    this.selectors = {
      productGridImages: '.grid-link__image--product'
    };

    this.sortEnabled = this.$container.data('sort-enabled');
    this.tagsEnabled = this.$container.data('tags-enabled');

    this.$productGridImages = $(
      this.selectors.productGridImages,
      this.$container
    );

    this.init();
  }

  Collection.prototype = _.assignIn({}, Collection.prototype, {
    init: function() {
      this.stringOverrides();
      theme.cacheSelectors();
      theme.equalHeights(this.$productGridImages);

      if (this.sortEnabled) {
        this.collectionSorting();
      }

      if (this.tagsEnabled) {
        this.collectionTags();
      }
    },

    stringOverrides: function() {
      // Override defaults in theme.strings with potential
      // template overrides

      theme.productStrings = theme.productStrings || {};
      $.extend(theme.strings, theme.productStrings);
    },

    collectionSorting: function() {
      /*============================================================================
        Initialised here because collection liquid object is only available
        on collection pages, and not external JS files
      ==============================================================================*/
      Shopify.queryParams = {};
      if (location.search.length && location.search.indexOf('sort_by')) {
        for (
          var aKeyValue, i = 0, aCouples = location.search.substr(1).split('&');
          i < aCouples.length;
          i++
        ) {
          aKeyValue = aCouples[i].split('=');
          if (aKeyValue.length > 1) {
            Shopify.queryParams[
              decodeURIComponent(aKeyValue[0])
            ] = decodeURIComponent(aKeyValue[1]);
          }
        }
      }

      $(function() {
        $('#SortBy')
          .val(theme.strings.sortBy)
          .bind('change', function() {
            Shopify.queryParams.sort_by = $(this).val();
            location.search = $.param(Shopify.queryParams);
          });
      });
    },

    collectionTags: function() {
      var $browseBy = $('#BrowseBy');
      $(function() {
        $browseBy.bind('change', function() {
          location.href = $browseBy.val();
        });
      });
    }
  });

  return Collection;
})();

theme.ListCollections = (function() {
  function ListCollections(container) {
    this.$container = $(container);

    this.selectors = {
      collectionGridImages: '.grid-link__image--collection'
    };

    this.$collectionGridImages = $(
      this.selectors.collectionGridImages,
      this.$container
    );

    this.init();
  }

  ListCollections.prototype = _.assignIn({}, ListCollections.prototype, {
    init: function() {
      theme.cacheSelectors();
      theme.equalHeights(this.$collectionGridImages);
    }
  });

  return ListCollections;
})();

theme.Cart = (function() {
  var selectors = {
    body: 'body',
    cartSection: '#CartSection',
    cartNoteAdd: '.cart__note-add',
    cartNote: '.cart__note',
    cartNoCookies: 'cart--no-cookies'
  };

  function Cart() {
    if (!cookiesEnabled()) {
      $(selectors.cartSection).addClass(selectors.cartNoCookies);
    }

    if (!$(selectors.cartSection).data('notes-enable')) {
      return;
    }

    $(selectors.body).on('click', selectors.cartNoteAdd, function() {
      $(this).addClass('is-hidden');
      $(selectors.cartNote).addClass('is-active');
    });
  }

  function cookiesEnabled() {
    var cookieEnabled = navigator.cookieEnabled;

    if (!cookieEnabled) {
      document.cookie = 'testcookie';
      cookieEnabled = document.cookie.indexOf('testcookie') !== -1;
    }
    return cookieEnabled;
  }

  return Cart;
})();

theme.Header = (function() {
  function Header() {
    this.selectors = {
      headerBar: '.header-bar',
      mobileNavTrigger: '#MobileNavTrigger',
      mobileNav: '#MobileNav',
      mobileSublistTrigger: '.mobile-nav__sublist-trigger',
      showDropdownClass: 'show-dropdown',
      hasDropdownItem: '.site-nav--has-dropdown',
      body: 'body'
    };

    this.init();
  }

  Header.prototype = _.assignIn({}, Header.prototype, {
    init: function() {
      var self = this;

      this.cacheSelectors();

      cache.$mobileNavTrigger.on('click.mobileNavTrigger', function(evt) {
        evt.preventDefault();

        var isExpanded = $(this).attr('aria-expanded');

        if (isExpanded === 'true') {
          self.menuClose();
        } else {
          self.menuOpen();
        }
      });

      cache.$mobileSublistTrigger.on('click.mobileSublistTrigger', function(
        evt
      ) {
        var $el = $(this);
        var isExpanded = $el.attr('aria-expanded') === 'true';
        // Enable commented out if statement to allow direct clicking on trigger link
        //if (!$el.hasClass('is-active')) {
        evt.preventDefault();

        $el
          .toggleClass('is-active')
          .next('.mobile-nav__sublist')
          .stop()
          .slideToggle(200);

        $el.attr('aria-expanded', !isExpanded);

        if (
          !$el.hasClass(self.selectors.showDropdownClass) &&
          timber.vars.isTouch
        ) {
          evt.preventDefault();
          $el.addClass(self.selectors.showDropdownClass);
          cache.$doc.on('click.mobileNav', handleClickOutsideDropdown);
        }

        function handleClickOutsideDropdown(evt) {
          var $target = $(evt.target);

          if (!$target.is($el) && !$.contains($el[0], $target[0])) {
            $el.removeClass(self.selectors.showDropdownClass);
            cache.$doc.off('.mobileNav');
          }
        }
      });
    },

    cacheSelectors: function() {
      window.cache = window.cache || {};
      $.extend(window.cache, {
        $doc: $(document),
        $headerBar: $(this.selectors.headerBar),
        $mobileNavTrigger: $(this.selectors.mobileNavTrigger),
        $mobileNav: $(this.selectors.mobileNav),
        $mobileSublistTrigger: $(this.selectors.mobileSublistTrigger),
        $hasDropdownItem: $(this.selectors.hasDropdownItem)
      });
    },

    onUnload: function() {
      cache.$mobileNavTrigger.off('.mobileNavTrigger');
      cache.$mobileSublistTrigger.off('.mobileSublistTrigger');
    },

    menuOpen: function() {
      var self = this;

      cache.$mobileNavTrigger.attr('aria-expanded', 'true');
      cache.$mobileNav.slideDown(220);

      theme.a11y.trapFocus({
        $container: cache.$headerBar,
        $elementToFocus: cache.$mobileNav.find('> li:first-child a'),
        namespace: 'drawerMenu'
      });

      // Escape key closes menu
      theme.cache.$html.on('keyup.drawerMenu', function(evt) {
        if (evt.keyCode === 27) {
          self.menuClose();
        }
      });

      $(self.selectors.body).on('mousedown', function(evt) {
        if (evt.target.closest(self.selectors.headerBar)) return;
        theme.a11y.removeTrapFocus({
          $container: cache.$headerBar,
          namespace: 'drawerMenu'
        });
      });
    },

    menuClose: function() {
      cache.$mobileNavTrigger.attr('aria-expanded', 'false');
      cache.$mobileNav.slideUp(220);
      theme.cache.$html.off('keyup.drawerMenu');

      theme.a11y.removeTrapFocus({
        $container: cache.$headerBar,
        namespace: 'drawerMenu'
      });
    }
  });

  return Header;
})();

theme.slideshows = {};

theme.SlideshowSection = (function() {
  function SlideshowSection(container) {
    this.$container = $(container);
    var id = this.$container.attr('data-section-id');
    var slideshow = (this.slideshow = '#flexslider--' + id);

    theme.slideshows[slideshow] = new theme.Hero(slideshow, id);
  }

  return SlideshowSection;
})();

theme.SlideshowSection.prototype = _.assignIn(
  {},
  theme.SlideshowSection.prototype,
  {
    onUnload: function() {
      delete theme.slideshows[this.slideshow];
    },

    onBlockSelect: function(evt) {
      var $slideshow = $(this.slideshow);
      var $slide = $('#slide--' + evt.detail.blockId + ':not(.clone)');
      var slideIndex = $slide.data('flexslider-index');
      var $slideImg = $slide.find('img');
      $slideshow.flexslider(slideIndex, true);
      $slideshow.flexslider('pause');

      $slideImg.on('load', this.resizeOnImageLoad($slideImg)).bind(this);
    },

    onSelect: function() {
      var $slideshow = $(this.slideshow);
      var $slideImg = $slideshow.find('img').first();

      $slideImg.on('load', this.resizeOnImageLoad($slideImg)).bind(this);
    },

    onBlockDeselect: function() {
      var $slideshow = $(this.slideshow);
      // Check if we need to resume autoplay
      if ($slideshow.data('autoplay')) {
        $(this.slideshow).flexslider('play');
      }
    },

    resizeOnImageLoad: function($slideImg) {
      var intervalAttempts = 0;
      var $slideshow = $(this.slideshow);

      // Needed to resize the slider as the on('load') listener doesn't wait until the image has loaded.
      var imageHeightCheck = setInterval(function() {
        intervalAttempts++;
        if (
          $slideImg.length &&
          $slideImg.height() === 0 &&
          intervalAttempts < 10
        ) {
          sizeSlideshow($slideshow);
        } else {
          // clear interval
          sizeSlideshow($slideshow);
          clearInterval(imageHeightCheck);
        }
      }, 500);

      function sizeSlideshow($slideshow) {
        $slideshow.resize();
      }
    }
  }
);

theme.CollectionList = (function() {
  function CollectionList(container) {
    this.$container = $(container);

    this.selectors = {
      collectionGridImages: '.grid-link__image--collection'
    };

    this.$collectionGridImages = $(
      this.selectors.collectionGridImages,
      this.$container
    );

    this.init();
  }

  CollectionList.prototype = _.assignIn({}, CollectionList.prototype, {
    init: function() {
      theme.cacheSelectors();
      theme.equalHeights(this.$collectionGridImages);
    }
  });

  return CollectionList;
})();

theme.FeaturedProducts = (function() {
  function FeaturedProducts(container) {
    this.$container = $(container);

    this.selectors = {
      productGridImages: '.grid-link__image--product'
    };

    this.$productGridImages = $(
      this.selectors.productGridImages,
      this.$container
    );

    this.init();
  }

  FeaturedProducts.prototype = _.assignIn({}, FeaturedProducts.prototype, {
    init: function() {
      theme.cacheSelectors();
      theme.equalHeights(this.$productGridImages);
    }
  });

  return FeaturedProducts;
})();

theme.Maps = (function() {
  var config = {
    zoom: 14
  };
  var apiStatus = null;
  var mapsToLoad = [];

  function Map(container) {
    theme.$currentMapContainer = this.$container = $(container);
    var key = this.$container.data('api-key');

    if (typeof key !== 'string' || key === '') {
      return;
    }

    if (apiStatus === 'loaded') {
      var self = this;

      // Check if the script has previously been loaded with this key
      var $script = $('script[src*="' + key + '&"]');
      if ($script.length === 0) {
        $.getScript(
          'https://maps.googleapis.com/maps/api/js?key=' + key
        ).then(function() {
          apiStatus = 'loaded';
          self.createMap();
        });
      } else {
        this.createMap();
      }
    } else {
      mapsToLoad.push(this);

      if (apiStatus !== 'loading') {
        apiStatus = 'loading';
        if (typeof window.google === 'undefined') {
          $.getScript(
            'https://maps.googleapis.com/maps/api/js?key=' + key
          ).then(function() {
            apiStatus = 'loaded';
            initAllMaps();
          });
        }
      }
    }
  }

  function initAllMaps() {
    // API has loaded, load all Map instances in queue
    $.each(mapsToLoad, function(index, instance) {
      instance.createMap();
    });
  }

  function geolocate($map) {
    var deferred = $.Deferred();
    var geocoder = new google.maps.Geocoder();
    var address = $map.data('address-setting');

    geocoder.geocode({ address: address }, function(results, status) {
      if (status !== google.maps.GeocoderStatus.OK) {
        deferred.reject(status);
      }

      deferred.resolve(results);
    });

    return deferred;
  }

  Map.prototype = _.assignIn({}, Map.prototype, {
    createMap: function() {
      var $map = this.$container.find('.map-section__container');

      return geolocate($map)
        .then(
          function(results) {
            var mapOptions = {
              zoom: config.zoom,
              styles: config.styles,
              center: results[0].geometry.location,
              draggable: false,
              clickableIcons: false,
              scrollwheel: false,
              disableDoubleClickZoom: true,
              disableDefaultUI: true
            };

            var map = (this.map = new google.maps.Map($map[0], mapOptions));
            var center = (this.center = map.getCenter());

            //eslint-disable-next-line no-unused-vars
            var marker = new google.maps.Marker({
              map: map,
              position: center
            });

            google.maps.event.addDomListener(window, 'resize', function() {
              google.maps.event.trigger(map, 'resize');
              map.setCenter(center);
            });
          }.bind(this)
        )
        .fail(function() {
          var errorMessage;

          switch (status) {
            case 'ZERO_RESULTS':
              errorMessage = theme.strings.addressNoResults;
              break;
            case 'OVER_QUERY_LIMIT':
              errorMessage = theme.strings.addressQueryLimit;
              break;
            default:
              errorMessage = theme.strings.addressError;
              break;
          }

          // Only show error in the theme editor
          if (Shopify.designMode) {
            var $mapContainer = $map.parents('.map-section');

            $mapContainer.addClass('page-width map-section--load-error');
            $mapContainer
              .find('.map-section__wrapper')
              .html(
                '<div class="errors text-center">' + errorMessage + '</div>'
              );
          }
        });
    },

    onUnload: function() {
      if (typeof window.google !== 'undefined') {
        google.maps.event.clearListeners(this.map, 'resize');
      }
    }
  });

  return Map;
})();

// Global function called by Google on auth errors.
// Show an auto error message on all map instances.
// eslint-disable-next-line camelcase, no-unused-vars
function gm_authFailure() {
  if (!Shopify.designMode) return;

  theme.$currentMapContainer.addClass('page-width map-section--load-error');
  theme.$currentMapContainer
    .find('.map-section__wrapper')
    .html(
      '<div class="errors text-center">' + theme.strings.authError + '</div>'
    );
}

window.theme = window.theme || {};

theme.PasswordHeader = (function() {
  function PasswordHeader() {
    this.init();
  }

  PasswordHeader.prototype = _.assignIn({}, PasswordHeader.prototype, {
    init: function() {
      $('.js-toggle-login-modal').magnificPopup({
        type: 'inline',
        mainClass: 'mfp-fade',
        closeOnBgClick: false,
        closeBtnInside: false,
        closeOnContentClick: false,
        tClose: password.strings.pageClose,
        removalDelay: 500,
        callbacks: {
          open: function() {
            window.setTimeout(function() {
              document.getElementById('password').focus();
            }, 50);
          }
        }
      });
      if ($('.storefront-password-form .errors').size()) {
        $('.js-toggle-login-modal').click();
      }
    }
  });

  return PasswordHeader;
})();

theme.ProductRecommendations = (function() {
  var selectors = {
    productGridImages: '[data-image-wrapper]'
  };

  function ProductRecommendations(container) {
    this.$container = $(container);

    var baseUrl = this.$container.data('baseUrl');
    var productId = this.$container.data('productId');
    var recommendationsSectionUrl =
      baseUrl +
      '?section_id=product-recommendations&product_id=' +
      productId +
      '&limit=4';

    $.get(recommendationsSectionUrl).then(
      function(section) {
        var recommendationsMarkup = $(section).html();
        if (recommendationsMarkup.trim() !== '') {
          this.$container.html(recommendationsMarkup);
          theme.equalHeights(this.$container.find(selectors.productGridImages));
        }
      }.bind(this)
    );
  }

  return ProductRecommendations;
})();


$(document).ready(function() {
  var sections = new theme.Sections();

  sections.register('product-template', theme.Product);
  sections.register('collection-template', theme.Collection);
  sections.register('list-collections-template', theme.ListCollections);
  sections.register('cart-template', theme.Cart);
  sections.register('article-template', theme.Article);
  sections.register('header-section', theme.Header);
  sections.register('slideshow-section', theme.SlideshowSection);
  sections.register('collection-list-section', theme.CollectionList);
  sections.register('featured-products-section', theme.FeaturedProducts);
  sections.register('map-section', theme.Maps);
  sections.register('password-header', theme.PasswordHeader);
  sections.register('product-recommendations', theme.ProductRecommendations);
});

theme.cacheSelectors = function() {
  theme.cache = {
    // General
    $w: $(window),
    $html: $('html')
  };
};

timber.cacheVariables = function() {
  timber.vars = {
    isTouch: timber.cache.$html.hasClass('supports-touch')
  };
};

theme.init = function() {
  theme.cacheSelectors();
  timber.cacheVariables();
  theme.productCardImageLoadingAnimation();
};

theme.productCardImageLoadingAnimation = function() {
  var selectors = {
    image: '[data-image]',
    imageWrapper: '[data-image-wrapper]'
  };

  var classes = {
    loadingAnimation: 'grid-link__image--loading',
    lazyloaded: '.lazyloaded'
  };

  $(document).on('lazyloaded', function(e) {
    var $target = $(e.target);

    if (!$target.is(selectors.image)) {
      return;
    }

    $target
      .closest(selectors.imageWrapper)
      .removeClass(classes.loadingAnimation);
  });

  // When the theme loads, lazysizes might load images before the "lazyloaded"
  // event listener has been attached. When this happens, the following function
  // hides the loading placeholders.
  $(selectors.image + classes.lazyloaded)
    .closest(selectors.imageWrapper)
    .removeClass(classes.loadingAnimation);
};

theme.equalHeights = function($selector) {
  theme.cache.$w.on('load', resizeElements($selector));

  theme.cache.$w.on(
    'resize',
    afterResize(
      function() {
        resizeElements($selector);
      },
      250,
      'equal-heights'
    )
  );

  function resizeElements($selector) {
    $selector.imagesLoaded(function() {
      $selector.css('height', 'auto').equalHeights();
    });
  }
};

// Initialize theme's JS on docready
$(theme.init);
