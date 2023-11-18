const t="liquid-ajax-cart",e="data-ajax-cart",n="ajax-cart",o="js-ajax-cart",r="add",i="change",a="update",s="clear",u="get",c=`${t}:queue-start`,l=`${t}:queue-start-internal`,d=`${t}:queue-end-internal`,f=`${t}:queue-end`,h=`${t}:request-start-internal`,p=`${t}:request-start`,m=`${t}:request-end-internal`,y=`${t}:request-end`,v=[];let b=!1;function q(t){var e;(null===(e=t.options)||void 0===e?void 0:e.important)&&0!==v.length?v[0].push(t):1===v.push([t])&&($(!0),g())}function g(){if(0===v.length)return void $(!1);if(0===v[0].length)return v.shift(),void g();const{requestType:t,body:e,options:n}=v[0][0];!function(t,e,n,o){const i=x(t);let a;t!==u&&(a=e||{});const s=t===u?"GET":"POST",c=n.info||{},l={requestType:t,endpoint:i,requestBody:a,info:c},d=[],f=new CustomEvent(h,{detail:{requestState:{requestType:t,endpoint:i,info:c,requestBody:a}}});document.dispatchEvent(f);const m=new CustomEvent(p,{detail:{requestState:{requestType:t,endpoint:i,info:c,requestBody:a}}});if(document.dispatchEvent(m),c.cancel)return l.responseData=null,void w(n,o,l);if(void 0!==a){let e;if(a instanceof FormData||a instanceof URLSearchParams?a.has("sections")&&(e=a.get("sections").toString()):e=a.sections,"string"==typeof e||e instanceof String||Array.isArray(e)){const n=[];if(Array.isArray(e)?n.push(...e):n.push(...e.split(",")),r===t&&d.push(...n.slice(0,5)),n.length>5){d.push(...n.slice(5));const t=n.slice(0,5).join(",");a instanceof FormData||a instanceof URLSearchParams?a.set("sections",t):a.sections=t}}else null!=e&&console.error(`Liquid Ajax Cart: "sections" parameter in a Cart Ajax API request must be a string or an array. Now it is ${e}`)}const y={method:s};t!==u&&(a instanceof FormData||a instanceof URLSearchParams?(y.body=a,y.headers={"x-requested-with":"XMLHttpRequest"}):(y.body=JSON.stringify(a),y.headers={"Content-Type":"application/json"})),fetch(i,y).then((t=>t.json().then((e=>({ok:t.ok,status:t.status,body:e}))))).then((t=>(l.responseData=t,!l.responseData.ok||l.responseData.body.token&&0===d.length?l:A(d).then((t=>(l.extraResponseData=t,l)))))).catch((t=>{console.error("Liquid Ajax Cart: Error while performing cart Ajax request"),console.error(t),l.responseData=null,l.fetchError=t})).finally((()=>{w(n,o,l)}))}(t,e,n,(()=>{v[0].shift(),g()}))}function $(t){b=t;const e=new CustomEvent(b?l:d);document.dispatchEvent(e);const n=new CustomEvent(b?c:f);document.dispatchEvent(n)}function w(t,e,n){if("firstCallback"in t)try{t.firstCallback(n)}catch(t){console.error('Liquid Ajax Cart: Error in request "firstCallback" function'),console.error(t)}const o={requestState:n},r=new CustomEvent(m,{detail:o});document.dispatchEvent(r);const i=new CustomEvent(y,{detail:o});if(document.dispatchEvent(i),"lastCallback"in t)try{t.lastCallback(n)}catch(t){console.error('Liquid Ajax Cart: Error in request "lastCallback" function'),console.error(t)}e()}function A(t=[]){const e={};return t.length>0&&(e.sections=t.slice(0,5).join(",")),fetch(x(a),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)}).then((e=>e.json().then((n=>{const o={ok:e.ok,status:e.status,body:n};return t.length<6?o:A(t.slice(5)).then((t=>{var e;return t.ok&&(null===(e=t.body)||void 0===e?void 0:e.sections)&&"object"==typeof t.body.sections&&("sections"in o.body||(o.body.sections={}),o.body.sections=Object.assign(Object.assign({},o.body.sections),t.body.sections)),o}))}))))}function L(t={}){q({requestType:u,body:void 0,options:t})}function E(t={},e={}){q({requestType:r,body:t,options:e})}function S(t={},e={}){q({requestType:i,body:t,options:e})}function j(t={},e={}){q({requestType:a,body:t,options:e})}function C(t={},e={}){q({requestType:s,body:t,options:e})}function x(t){var e,n,o,c,l,d,f,h,p,m;switch(t){case r:return`${(null===(n=null===(e=window.Shopify)||void 0===e?void 0:e.routes)||void 0===n?void 0:n.root)||"/"}cart/add.js`;case i:return`${(null===(c=null===(o=window.Shopify)||void 0===o?void 0:o.routes)||void 0===c?void 0:c.root)||"/"}cart/change.js`;case u:return`${(null===(d=null===(l=window.Shopify)||void 0===l?void 0:l.routes)||void 0===d?void 0:d.root)||"/"}cart.js`;case s:return`${(null===(h=null===(f=window.Shopify)||void 0===f?void 0:f.routes)||void 0===h?void 0:h.root)||"/"}cart/clear.js`;case a:return`${(null===(m=null===(p=window.Shopify)||void 0===p?void 0:p.routes)||void 0===m?void 0:m.root)||"/"}cart/update.js`;default:return}}function T(){return b}const k=`${e}-initial-state`;let D,_=null;function N(){return{cart:_,previousCart:D}}const R=`${e}-bind`;function B(){N().cart&&document.querySelectorAll(`[${R}]`).forEach((t=>{const e=t.getAttribute(R);t.textContent=function(t){const{binderFormatters:e}=H,[n,...o]=t.split("|");let r=F(n,N().cart);return o.forEach((t=>{const n=t.trim();""!==n&&("object"==typeof e&&n in e?r=e[n](r):n in O?r=O[n](r):console.warn(`Liquid Ajax Cart: the "${n}" formatter is not found`))})),"string"==typeof r||r instanceof String||"number"==typeof r||r instanceof Number?r.toString():(console.error(`Liquid Ajax Cart: the calculated value for the ${R}="${t}" element must be string or number. But the value is`,r),"")}(e)}))}function F(t,e){const n=t.split("."),o=n.shift().trim();return""!==o&&o in e&&n.length>0?F(n.join("."),e[o]):e[o]}const O={money_with_currency:t=>{var e;const n=N();if("number"!=typeof t&&!(t instanceof Number))return console.error("Liquid Ajax Cart: the 'money_with_currency' formatter is not applied because the value is not a number. The value is ",t),t;const o=t/100;return"Intl"in window&&(null===(e=window.Shopify)||void 0===e?void 0:e.locale)?Intl.NumberFormat(window.Shopify.locale,{style:"currency",currency:n.cart.currency}).format(o):`${o.toFixed(2)} ${n.cart.currency}`}},H={binderFormatters:{},requestErrorText:"There was an error while updating your cart. Please try again.",updateOnWindowFocus:!0,quantityTagAllowZero:!1,quantityTagDebounce:300},M=`${e}-section`,U=`${e}-static-element`,P=`${e}-section-scroll`,I="shopify-section-",J=`${n}-product-form`,V="processing";class W extends HTMLElement{connectedCallback(){var t,e;const n=this,o=this.querySelectorAll("form");if(1!==o.length)return void console.error(`Liquid Ajax Cart: "${J}" element must have one "form" element as a child, ${o.length} found`,n);const r=o[0];new URL(r.action).pathname===`${(null===(e=null===(t=window.Shopify)||void 0===t?void 0:t.routes)||void 0===e?void 0:e.root)||"/"}cart/add`?r.addEventListener("submit",(t=>{if(!n.hasAttribute(V)){const t=new FormData(r);n.setAttribute(V,""),E(t,{lastCallback:()=>{n.removeAttribute(V)},info:{initiator:n}})}t.preventDefault()})):console.error(`Liquid Ajax Cart: "${J}" element's form "action" attribute value isn't a product form action URL`,r,n)}}var Z,z,G,K,X,Q,Y,tt;const et=`${(null===(z=null===(Z=window.Shopify)||void 0===Z?void 0:Z.routes)||void 0===z?void 0:z.root)||"/"}cart/change`,nt=`${(null===(K=null===(G=window.Shopify)||void 0===G?void 0:G.routes)||void 0===K?void 0:K.root)||"/"}cart/add`,ot=`${(null===(Q=null===(X=window.Shopify)||void 0===X?void 0:X.routes)||void 0===Q?void 0:Q.root)||"/"}cart/clear`,rt=`${(null===(tt=null===(Y=window.Shopify)||void 0===Y?void 0:Y.routes)||void 0===tt?void 0:tt.root)||"/"}cart/update`,it=`${e}-request-button`;function at(t,e){let n;const o=[et,nt,ot,rt];if(!t.hasAttribute(it))return;const r=t.getAttribute(it);if(r){let t;try{if(t=new URL(r,window.location.origin),!o.includes(t.pathname))throw`URL should be one of the following: ${et}, ${nt}, ${rt}, ${ot}`;n=t}catch(t){console.error(`Liquid Ajax Cart: ${it} contains an invalid URL as a parameter.`,t)}}else if(t instanceof HTMLAnchorElement&&t.hasAttribute("href")){const e=new URL(t.href);o.includes(e.pathname)?n=e:t.hasAttribute(it)&&console.error(`Liquid Ajax Cart: a link with the ${it} contains an invalid href URL.`,`URL should be one of the following: ${et}, ${nt}, ${rt}, ${ot}`)}if(void 0===n)return void console.error(`Liquid Ajax Cart: a ${it} element doesn't have a valid URL`);if(e&&e.preventDefault(),T())return;const i=new FormData;switch(n.searchParams.forEach(((t,e)=>{i.append(e,t)})),n.pathname){case nt:E(i,{info:{initiator:t}});break;case et:S(i,{info:{initiator:t}});break;case rt:j(i,{info:{initiator:t}});break;case ot:C({},{info:{initiator:t}})}}function st(t,e){let n,o;return t.length>3?(n=e.cart.items.find((e=>e.key===t)),o="id"):(n=e.cart.items[Number(t)-1],o="line"),void 0===n&&(n=null,console.error(`Liquid Ajax Cart: line item with ${o}="${t}" not found`)),[n,o]}const ut=`${e}-quantity-input`;function ct(t){return!!t.hasAttribute(ut)&&(t instanceof HTMLInputElement&&("text"===t.type||"number"===t.type)||(console.error(`Liquid Ajax Cart: the ${ut} attribute supports "input" elements only with the "text" and the "number" types`),!1))}function lt(){document.querySelectorAll(`input[${ut}]`).forEach((t=>{if(!ct(t))return;if(T())return void(t.disabled=!0);const e=N(),n=t.getAttribute(ut).trim(),[o]=st(n,e);o?t.value=o.quantity.toString():null===o&&(t.value="0"),t.disabled=!1}))}function dt(t,e){if(!ct(t))return;if(e&&e.preventDefault(),T())return;let n=Number(t.value.trim());const o=t.getAttribute(ut).trim();if(isNaN(n))return void console.error(`Liquid Ajax Cart: input value of a ${ut} must be an Integer number`);if(n<1&&(n=0),!o)return void console.error(`Liquid Ajax Cart: attribute value of a ${ut} must be an item key or an item index`);const r=o.length>3?"id":"line",i=new FormData;i.set(r,o),i.set("quantity",n.toString()),S(i,{info:{initiator:t}}),t.blur()}const ft=`${e}-property-input`;function ht(t){const e=t.getAttribute(ft),n=t.getAttribute("name");console.error(`Liquid Ajax Cart: the element [${ft}="${e}"]${n?`[name="${n}"]`:""} has wrong attributes.`)}function pt(t){return!!t.hasAttribute(ft)&&!!(t instanceof HTMLInputElement&&"hidden"!==t.type||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement)}function mt(t){const e={objectCode:void 0,propertyName:void 0,attributeValue:void 0};if(!t.hasAttribute(ft))return e;let n=t.getAttribute(ft).trim();if(!n){const e=t.getAttribute("name").trim();e&&(n=e)}if(!n)return ht(t),e;if(e.attributeValue=n,"note"===n)return e.objectCode="note",e;let[o,...r]=n.trim().split("[");return!r||1!==r.length||r[0].length<2||r[0].indexOf("]")!==r[0].length-1?(ht(t),e):(e.objectCode=o,e.propertyName=r[0].replace("]",""),e)}function yt(){document.querySelectorAll(`[${ft}]`).forEach((t=>{if(!pt(t))return;if(T())return void(t.disabled=!0);const{objectCode:e,propertyName:n,attributeValue:o}=mt(t);if(!e)return;const r=N();let i,a=!1;if("note"===e)i=r.cart.note;else if("attributes"===e)i=r.cart.attributes[n];else{const[t,s]=st(e,r);t&&(i=t.properties[n]),null===t&&(console.error(`Liquid Ajax Cart: line item with ${s}="${e}" was not found when the [${ft}] element with "${o}" value tried to get updated from the State`),a=!0)}t instanceof HTMLInputElement&&("checkbox"===t.type||"radio"===t.type)?t.checked=t.value===i:("string"==typeof i||i instanceof String||"number"==typeof i||i instanceof Number||(Array.isArray(i)||i instanceof Object?(i=JSON.stringify(i),console.warn(`Liquid Ajax Cart: the ${ft} with the "${o}" value is bound to the ${n} ${"attributes"===e?"attribute":"property"} that is not string or number: ${i}`)):i=""),t.value=i),a||(t.disabled=!1)}))}function vt(t,e){if(!pt(t))return;e&&e.preventDefault(),t.blur();const n=N();if(T())return;const{objectCode:o,propertyName:r,attributeValue:i}=mt(t);if(!o)return;let a=t.value;if(t instanceof HTMLInputElement&&"checkbox"===t.type&&!t.checked){let t=document.querySelector(`input[type="hidden"][${ft}="${i}"]`);t||"note"!==o&&"attributes"!==o||(t=document.querySelector(`input[type="hidden"][${ft}][name="${i}"]`)),a=t?t.value:""}if("note"===o){const e=new FormData;e.set("note",a),j(e,{info:{initiator:t}})}else if("attributes"===o){const e=new FormData;e.set(`attributes[${r}]`,a),j(e,{info:{initiator:t}})}else{const[e,s]=st(o,n);if(null===e&&console.error(`Liquid Ajax Cart: line item with ${s}="${o}" was not found when the [${ft}] element with "${i}" value tried to update the cart`),!e)return;const u=Object.assign({},e.properties);u[r]=a;const c=new FormData;let l=c;c.set(s,o),c.set("quantity",e.quantity.toString());for(let t in u){const n=u[t];"string"==typeof n||n instanceof String?c.set(`properties[${t}]`,u[t]):l={[s]:o,quantity:e.quantity,properties:u}}S(l,{info:{initiator:t}})}}const bt=`${n}-quantity`,qt=`${e}-quantity-plus`,gt=`${e}-quantity-minus`;function $t(){customElements.define(J,W),document.addEventListener("click",(function(t){for(let e=t.target;e&&e!=document.documentElement;e=e.parentElement)at(e,t)}),!1),document.addEventListener("change",(function(t){vt(t.target,t)}),!1),document.addEventListener("keydown",(function(t){const e=t.target;"Enter"===t.key&&(e instanceof HTMLTextAreaElement&&!t.ctrlKey||vt(e,t)),"Escape"===t.key&&function(t){if(!pt(t))return;if(!(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement))return;if(t instanceof HTMLInputElement&&("checkbox"===t.type||"radio"===t.type))return;const e=N(),{objectCode:n,propertyName:o}=mt(t);if(!n)return;let r;if("note"===n)r=e.cart.note;else if("attributes"===n)r=e.cart.attributes[o];else{const[t]=st(n,e);t&&(r=t.properties[o])}void 0!==r&&(r||"string"==typeof r||r instanceof String||(r=""),t.value=String(r)),t.blur()}(e)}),!1),document.addEventListener(l,yt),document.addEventListener(m,yt),document.addEventListener(d,yt),yt(),document.addEventListener("change",(function(t){dt(t.target,t)}),!1),document.addEventListener("keydown",(function(t){"Enter"===t.key&&dt(t.target,t),"Escape"===t.key&&function(t){if(!ct(t))return;const e=t.getAttribute(ut).trim();let n;const o=N();if(e.length>3)n=o.cart.items.find((t=>t.key===e));else{const t=Number(e)-1;n=o.cart.items[t]}n&&(t.value=n.quantity.toString()),t.blur()}(t.target)}),!1),document.addEventListener(l,lt),document.addEventListener(m,lt),document.addEventListener(d,lt),lt(),customElements.define(bt,class extends HTMLElement{constructor(){super(...arguments),this._timer=void 0}connectedCallback(){const t=this.querySelectorAll("input");1===t.length?(this._$input=t[0],this._$input.hasAttribute(ut)?this.querySelectorAll(`[${qt}], [${gt}]`).forEach((t=>{t.addEventListener("click",(e=>{const{quantityTagAllowZero:n}=H,o=!0===n?0:1;if(!T()){const e=Number(this._$input.value);if(isNaN(e))return void console.error(`Liquid Ajax Cart: "${bt}" element's input value isn't a number`,this._$input,this);let n=e;n=t.hasAttribute(qt)?n+1:n-1,n<o&&(n=o),n!==e&&(this._$input.value=n.toString(),this._runAwaiting())}e.preventDefault()})),t.addEventListener("focusout",(e=>{e.relatedTarget&&t.contains(e.relatedTarget)||void 0!==this._timer&&this._runRequest()}))})):console.error(`Liquid Ajax Cart: "${bt}" element's input must have the "${ut}" attribute`,this._$input,this)):console.error(`Liquid Ajax Cart: "${bt}" element must have one "input" element as a child, ${t.length} found`,this)}_runAwaiting(){const{quantityTagDebounce:t}=H;void 0!==this._timer&&clearTimeout(this._timer),t>0?this._timer=setTimeout((()=>{this._runRequest()}),Number(t)):this._runRequest()}_runRequest(){void 0!==this._timer&&clearTimeout(this._timer),this._timer=void 0,T()||this._$input.dispatchEvent(new Event("change",{bubbles:!0}))}})}const wt=`${e}-errors`,At=`${o}-init`,Lt=`${o}-processing`,Et=`${o}-empty`,St=`${o}-not-empty`;function jt(){const t=document.querySelector("html"),e=N();t.classList.toggle(At,null!==e.cart),t.classList.toggle(Lt,T()),t.classList.toggle(Et,0===e.cart.item_count),t.classList.toggle(St,e.cart.item_count>0)}let Ct=!1;if(!("liquidAjaxCart"in window)){function xt(t,e){Object.defineProperty(window.liquidAjaxCart,t,{get:e,set:()=>{throw new Error(`Liquid Ajax Cart: the "${t}" is a read-only property`)},enumerable:!0})}window.liquidAjaxCart={conf:function(t,e){t in H?(H[t]=e,"binderFormatters"===t&&B()):console.error(`Liquid Ajax Cart: unknown configuration parameter "${t}"`)}},xt("init",(()=>Ct)),document.addEventListener(h,(t=>{const{requestState:e}=t.detail;if(void 0!==e.requestBody){const t=[];if(document.querySelectorAll(`[${M}]`).forEach((e=>{const n=e.closest(`[id^="${I}"]`);if(n){const e=n.id.replace(I,"");-1===t.indexOf(e)&&t.push(e)}else console.error(`Liquid Ajax Cart: there is a ${M} element that is not inside a Shopify section. All the ${M} elements must be inside Shopify sections.`)})),t.length){let n,o=t.join(",");e.requestBody instanceof FormData||e.requestBody instanceof URLSearchParams?e.requestBody.has("sections")&&(n=e.requestBody.get("sections").toString()):n=e.requestBody.sections,(("string"==typeof n||n instanceof String)&&""!==n||n&&Array.isArray(n)&&n.length>0)&&(o=`${n.toString()},${o}`),e.requestBody instanceof FormData||e.requestBody instanceof URLSearchParams?e.requestBody.set("sections",o):e.requestBody.sections=o}}})),document.addEventListener(m,(t=>{var e,n,o;t.detail.sections=[];const{requestState:i}=t.detail,a=new DOMParser,s=[];if((null===(e=i.responseData)||void 0===e?void 0:e.ok)&&"sections"in i.responseData.body){let t=i.responseData.body.sections;(null===(o=null===(n=i.extraResponseData)||void 0===n?void 0:n.body)||void 0===o?void 0:o.sections)&&(t=Object.assign(Object.assign({},t),i.extraResponseData.body.sections));for(let e in t)t[e]?document.querySelectorAll(`#shopify-section-${e}`).forEach((n=>{let o=[];const u="__noId__",c={};n.querySelectorAll(` [${P}] `).forEach((t=>{let e=t.getAttribute(P).toString().trim();""===e&&(e=u),e in c||(c[e]=[]),c[e].push({scroll:t.scrollTop,height:t.scrollHeight})}));const l={},d=n.querySelectorAll(`[${U}]`);d&&d.forEach((t=>{let e=t.getAttribute(U).toString().trim();""===e&&(e=u),e in l||(l[e]=[]),l[e].push(t)}));const f=n.querySelectorAll(`[${M}]`);if(f){const r=a.parseFromString(t[e],"text/html");r.querySelectorAll('img[loading="lazy"]').forEach((t=>{t.removeAttribute("loading")}));for(let t in l)r.querySelectorAll(` [${U}="${t.replace(u,"")}"] `).forEach(((e,n)=>{n+1<=l[t].length&&(e.before(l[t][n]),e.parentElement.removeChild(e))}));const i=r.querySelectorAll(`[${M}]`);if(f.length!==i.length){console.error(`Liquid Ajax Cart: the received HTML for the "${e}" section has a different quantity of the "${M}" containers. The section will be updated completely.`);const t=r.querySelector(`#${I}${e}`);if(t){for(n.innerHTML="";t.childNodes.length;)n.appendChild(t.firstChild);o.push(n)}}else f.forEach(((t,e)=>{t.before(i[e]),t.parentElement.removeChild(t),o.push(i[e])}))}for(let t in c)n.querySelectorAll(` [${P}="${t.replace(u,"")}"] `).forEach(((e,n)=>{n+1<=c[t].length&&(i.requestType!==r||c[t][n].height>=e.scrollHeight)&&(e.scrollTop=c[t][n].scroll)}));o.length>0&&s.push({id:e,elements:o})})):console.error(`Liquid Ajax Cart: the HTML for the "${e}" section was requested but the response is ${t[e]}`)}s.length>0&&(t.detail.sections=s)})),(()=>{let t;document.addEventListener(h,(e=>{const{requestState:n}=e.detail;t=void 0,n.requestType===r?t=(t=>{var e;let n;const o=null===(e=t.info)||void 0===e?void 0:e.initiator;return o instanceof W&&(n=o.querySelectorAll(`[${wt}="form"]`)),n})(n):n.requestType===i&&(t=(t=>{var e;let n;const o=N();let r,i;if(t.requestBody instanceof FormData||t.requestBody instanceof URLSearchParams?(t.requestBody.has("line")&&(i=t.requestBody.get("line").toString()),t.requestBody.has("id")&&(r=t.requestBody.get("id").toString())):("line"in t.requestBody&&(i=String(t.requestBody.line)),"id"in t.requestBody&&(r=String(t.requestBody.id))),i){const t=Number(i);if(t>0){const n=t-1;r=null===(e=o.cart.items[n])||void 0===e?void 0:e.key}}return r&&(n=r.indexOf(":")>-1?document.querySelectorAll(`[${wt}="${r}"]`):document.querySelectorAll(o.cart.items.reduce(((t,e)=>(e.key!==r&&e.id!==Number(r)||t.push(`[${wt}="${e.key}"]`),t)),[]).join(","))),n})(n)),t&&t.length>0&&t.forEach((t=>{t.textContent=""}))})),document.addEventListener(m,(e=>{const{requestState:n}=e.detail;if(n.info.cancel)return;if(!t||0===t.length)return;const o=function(t){var e,n,o,r,i;const{requestErrorText:a}=H;return(null===(e=t.responseData)||void 0===e?void 0:e.ok)?"":(null===(o=null===(n=t.responseData)||void 0===n?void 0:n.body)||void 0===o?void 0:o.description)||(null===(i=null===(r=t.responseData)||void 0===r?void 0:r.body)||void 0===i?void 0:i.message)||a}(n);o&&t.forEach((t=>{t.textContent=o}))}))})(),function(){document.addEventListener(m,(t=>{var e,n;const{requestState:o}=t.detail;let r;(null===(e=o.extraResponseData)||void 0===e?void 0:e.ok)&&o.extraResponseData.body.token?r=o.extraResponseData.body:(null===(n=o.responseData)||void 0===n?void 0:n.ok)&&o.responseData.body.token&&(r=o.responseData.body),r&&(D=_,_=r,t.detail.previousCart=D,t.detail.cart=_)}));const t=document.querySelector(`[${k}]`);if(t)try{_=JSON.parse(t.textContent)}catch(t){console.error(`Liquid Ajax Cart: can't parse cart JSON from the "${k}" script`),console.error(t)}return new Promise(((t,e)=>{var n,o;_?t():fetch(`${(null===(o=null===(n=window.Shopify)||void 0===n?void 0:n.routes)||void 0===o?void 0:o.root)||"/"}cart.js`,{headers:{"Content-Type":"application/json"}}).then((t=>t.json())).then((e=>{_=e,t()})).catch((t=>{console.error(t),e('Can\'t load the cart state from the "/cart.js" endpoint')}))}))}().then((()=>{document.addEventListener(m,B),B(),$t(),document.addEventListener(l,jt),document.addEventListener(m,jt),document.addEventListener(d,jt),jt(),window.liquidAjaxCart.get=L,window.liquidAjaxCart.add=E,window.liquidAjaxCart.change=S,window.liquidAjaxCart.update=j,window.liquidAjaxCart.clear=C,xt("cart",(()=>N().cart)),xt("processing",T),window.addEventListener("focus",(()=>{H.updateOnWindowFocus&&j({},{})})),window.addEventListener("pageshow",(t=>{(t.persisted||"back_forward"===performance.getEntriesByType("navigation")[0].type)&&window.liquidAjaxCart.update({},void 0)})),Ct=!0;const e=new CustomEvent(`${t}:init`);document.dispatchEvent(e)}))}