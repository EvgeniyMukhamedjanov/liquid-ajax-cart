---
title: Releases
layout: docs-v2
---

# Releases
<p class="lead" markdown="1">
Liquid Ajax Cart is also available as an npm package [![npm](https://img.shields.io/npm/v/liquid-ajax-cart)](https://www.npmjs.com/package/liquid-ajax-cart).
</p>

<ul class="steps-list">
<li class="steps-list__step steps-list__step--feat">
<div class="steps-list__badge-list"><span class="steps-list__badge">2024, Dec 22</span></div>
<div class="steps-list__title steps-list__title--hero">v2.1.2</div>
<div class="steps-list__content" markdown="1">
An empty <code>update</code> object was added to the <a href="/v2/request-state/#extraresponsedata">extra request</a> payload
in order to fix the <a href="https://github.com/EvgeniyMukhamedjanov/liquid-ajax-cart/issues/107">issue</a>.

<a href="/v2/releases/liquid-ajax-cart-v2.1.2.js" download class="steps-list__cta">Download</a>
</div>
</li>

<li class="steps-list__step">
<div class="steps-list__badge-list"><span class="steps-list__badge">2024, May 20</span></div>
<div class="steps-list__title steps-list__title--hero">v2.1.1</div>
<div class="steps-list__content" markdown="1">
<ul>
<li>The support of the <code>select</code> element is added for the <code>data-ajax-cart-quantity-input</code>.</li>
<li>
Wrong error rendering in the <code>data-ajax-cart-errors</code> element
when the request error is an object is fixed.
</li>
<li>
The <code>extraRequestOnError</code> configuration parameter with the <code>true</code> value by default is added. 
It makes Liquid Ajax Cart send an additional request in order to re-render the cart related sections
if the current request has returned an error. It fixes the <a href="https://github.com/Shopify/dawn/issues/2994">issue</a> 
when a request that returns an error actually makes some changes in the cart.
</li>
</ul>

<a href="/v2/releases/liquid-ajax-cart-v2.1.1.js" download class="steps-list__cta">Download</a>
</div>
</li>

<li class="steps-list__step">
<div class="steps-list__badge-list"><span class="steps-list__badge">2023, Nov 18</span></div>
<div class="steps-list__title steps-list__title--hero">v2.1.0</div>
<div class="steps-list__content" markdown="1">
A new API called "<a href="/v2/cart-mutations/">Cart mutations</a>" is added. 
It allows you to automatically add or remove cart items based on specific conditions.
It is perfect solution for promotions and cart correction logic.

<a href="/v2/releases/liquid-ajax-cart-v2.1.0.js" download class="steps-list__cta">Download</a>
</div>
</li>

<li class="steps-list__step">
<div class="steps-list__badge-list"><span class="steps-list__badge">2023, Nov 04</span></div>
<div class="steps-list__title steps-list__title--hero">v2.0.2</div>
<div class="steps-list__content" markdown="1">
The <code>data-ajax-cart-quantity-minus</code> and <code>data-ajax-cart-quantity-plus</code> buttons 
of the <code><a href="/v2/ajax-cart-quantity/">&lt;ajax-cart-quantity&gt;</a></code> custom tag 
get the `aria-disabled` and `disabled` attributes when inactive.

<a href="/v2/releases/liquid-ajax-cart-v2.0.2.js" download class="steps-list__cta">Download</a>
</div>
</li>

<li class="steps-list__step">
<div class="steps-list__badge-list"><span class="steps-list__badge">2023, Oct 27</span></div>
<div class="steps-list__title steps-list__title--hero">v2.0.1</div>
<div class="steps-list__content" markdown="1">
<ul>
<li>
The <code><a href="/v2/quantity-tag-allow-zero/">quantityTagAllowZero</a></code> configuration parameter is added. 
It lets a user reach the "0" value by clicking the <code><a href="/v2/data-ajax-cart-quantity-minus/">data-ajax-cart-quantity-minus</a></code> button 
within the <code><a href="/v2/ajax-cart-quantity/">&lt;ajax-cart-quantity&gt;</a></code> custom tag.
</li>
<li>
The <code><a href="/v2/quantity-tag-debounce/">quantityTagDebounce</a></code> configuration parameters is added. 
It lets you change the debounce time for the <code><a href="/v2/ajax-cart-quantity/">&lt;ajax-cart-quantity&gt;</a></code> custom tag.
</li>
<li>
The <a href="https://github.com/EvgeniyMukhamedjanov/liquid-ajax-cart/issues/18">issue</a> is fixed when the cart state and the cart content was wrong when a user clicks the "Back" button in the browser. 
</li>
</ul>
<a href="/v2/releases/liquid-ajax-cart-v2.0.1.js" download class="steps-list__cta">Download</a>
</div>
</li>

<li class="steps-list__step">
<div class="steps-list__badge-list"><span class="steps-list__badge">2023, Sep 11</span></div>
<div class="steps-list__title steps-list__title--hero">v2.0.0</div>
<div class="steps-list__content" markdown="1">
The architecture of the library is completely redesigned. 
<br/>
Read more in the "[Differences from v1.x.x](/v2/differences-from-v1/)" article.

<a href="/v2/releases/liquid-ajax-cart-v2.0.0.js" download class="steps-list__cta">Download</a>
</div>
</li>

<li class="steps-list__step">
<div class="steps-list__badge-list"></div>
<div class="steps-list__title steps-list__title--hero">v1.x.x</div>
<div class="steps-list__content" markdown="1">
Visit the [Liquid Ajax Cart v1](/v1/) page to read the docs, see the changelog, or download previous versions.

<a href="/v1/" class="steps-list__cta">Go to v1</a>
</div>
</li>
</ul>