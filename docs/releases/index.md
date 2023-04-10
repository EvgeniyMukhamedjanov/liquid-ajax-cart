---
layout: full
disable_anchors: true
title: Releases
---

<div class="release-list">
{%- assign release_slice = '/releases/liquid-ajax-cart-v' -%}

{%- assign versions_joined = '' -%}
{%- for file in site.static_files -%}
	{%- assign file_release_slice = file.path | slice: 0, release_slice.size -%}
	{%- if release_slice == file_release_slice -%}
		{%- assign file_release_version = file.path | slice: release_slice.size, 15 | replace: ".js", "" -%}
		{%- assign file_release_version_array = file_release_version | split: '.' -%}
		{%- if versions_joined != "" -%}
			{%- assign versions_joined = versions_joined | append: '|' -%}
		{%- endif -%}
		{%- for version_part in file_release_version_array -%}
			{%- assign versions_joined = versions_joined | append: '.' -%}
			{%- if version_part.size == 1 -%}
				{%- assign versions_joined = versions_joined | append: '00' -%}
			{%- elsif version_part.size == 2 -%}
				{%- assign versions_joined = versions_joined | append: '0' -%}
			{%- endif -%}
			{%- assign versions_joined = versions_joined | append: version_part -%}
		{%- endfor -%}
	{%- endif -%}
{%- endfor -%}
{%- assign versions_array = versions_joined | split: '|' | sort | reverse -%}

{%- for long_version in versions_array -%}
{% assign file_version = long_version | replace: "0", "-" | replace: ".---", ".0"  | replace: ".--", "." | replace: ".-", "." | remove_first: "." | replace: "-", "0" %}

<div class="release">
	<div class="release__heading">
		<h2 class="release__version">v{{ file_version }}</h2>
		<div class="release__date">
            {%- if file_version == '1.11.0' -%}Released on 2023, Apr 11{%- endif -%}
			{%- if file_version == '1.10.3' -%}Released on 2022, Jul 5{%- endif -%}
			{%- if file_version == '1.10.2' -%}Released on 2022, Jun 15{%- endif -%}
			{%- if file_version == '1.10.1' -%}Released on 2022, Apr 8{%- endif -%}
			{%- if file_version == '1.10.0' -%}Released on 2022, Feb 19{%- endif -%}
			{%- if file_version == '1.9.0' -%}Released on 2022, Feb 3{%- endif -%}
			{%- if file_version == '1.8.2' -%}Released on 2022, Feb 2{%- endif -%}
			{%- if file_version == '1.8.0' -%}Released on 2022, Jan 22{%- endif -%}
			{%- if file_version == '1.7.0' -%}Released on 2022, Jan 3{%- endif -%}
			{%- if file_version == '1.6.0' -%}Released on 2021, Nov 16{%- endif -%}
			{%- if file_version == '1.5.0' -%}Released on 2021, Nov 2{%- endif -%}
			{%- if file_version == '1.4.0' -%}Released on 2021, Oct 30{%- endif -%}
			{%- if file_version == '1.3.0' -%}Released on 2021, Oct 25{%- endif -%}
			{%- if file_version == '1.2.1' -%}Released on 2021, Oct 23{%- endif -%}
			{%- if file_version == '1.2.0' -%}Released on 2021, Oct 22{%- endif -%}
			{%- if file_version == '1.1.0' -%}Released on 2021, Oct 16{%- endif -%}
			{%- if file_version == '1.0.0' -%}Released on 2021, Oct 10{%- endif -%}
			{%- if file_version == '0.2.0' -%}Released on 2021, Oct 10{%- endif -%}
			{%- if file_version == '0.1.1' -%}Released on 2021, Oct 10{%- endif -%}
			{%- if file_version == '0.1.0' -%}Released on 2021, Oct 5{%- endif -%}
			{%- if file_version == '0.0.1' -%}Released on 2021, Oct 5{%- endif -%}
		</div>
	</div>

<div class="release__description" markdown="1">
{% if file_version != '0.0.1' %}
##### Changes:

{% endif %}

{%- if file_version == '1.11.0' -%}
* The `lineItemQuantityErrorText` configuration parameter is removed, as Shopify started returning error in the `/cart/change.js` response.
{%- endif -%}

{%- if file_version == '1.10.3' -%}
* The `liquidAjaxCartInit` event is added for the `body` tag.
{%- endif -%}

{%- if file_version == '1.10.2' -%}
* Shopify Markets support is added
{%- endif -%}

{%- if file_version == '1.10.1' -%}
* The `js-ajax-cart-not-compatible` CSS class is added.
* The JavaScript module is reduced in size.
{%- endif -%}

{%- if file_version == '1.10.0' -%}
* The `previousCart` parameter is always passed to `subscribeToCartStateUpdate` callback functions.
* The `getCartState` always returns the `previousCart` as well.
* `subscribeToCartStateUpdate` callback functions will be called with one more parameter — `isCartChanged`.
* The `info.cancel` property of a Request state lets you cancel the request before it is started.
* All Ajax Cart requests get in queues to be performed.
* The `newQueue` property is accepted within the `options` parameter of the `cartRequest*` functions and lets you manage request queue position.
{%- endif -%}

{%- if file_version == '1.9.0' -%}
* The `data-ajax-cart-static-element` attribute is added.
{%- endif -%}

{%- if file_version == '1.8.2' -%}
* The `subscribeToCartSectionsUpdate` function is added.
{%- endif -%}

{%- if file_version == '1.8.0' -%}
* The `addToCartCssClass` configuration parameter is added.
* The `money_with_currency` formatter is added for the `data-ajax-cart-bind-state` attribute.
* The `stateBinderFormatters` configuration parameter is added.
* The `subscribeToCartStateUpdate` function doesn't call the callback immediately after subscribing. Only after a next state change.
* `subscribeToCartStateUpdate` callback functions will be called with one more parameter — `previousCart`.
{%- endif -%}

{%- if file_version == '1.7.0' -%}
* The `data-ajax-cart-property-input` attribute is added.
* The routes to `routes.cart_*_url` are not automatically ajaxified anymore. Add the `data-ajax-cart-request-button` to ajaxify them.
{%- endif -%}

{%- if file_version == '1.6.0' -%}
* The `data-ajax-cart-quantity-input` supports line item's index now.
* The `data-ajax-cart-messages` attribute with an `item.key` parameter shows messages even if the request resulted with a message was called with the `line` parameter, not `id`.
* Liquid Ajax Cart update cart sections and the State when a window gets focus. 
* The `configure` function is removed.
* The `configureCart` function is added.
* The `data-ajax-cart-configuration` attribute is added.
* The `updateOnWindowFocus` configuration parameter is added.
{%- endif -%}

{%- if file_version == '1.5.0' -%}
If the `data-ajax-cart-section` is attached to a section's root container, it doesn't update the whole section anymore. Only containers with the attribute will be updatable.
{%- endif -%}


{%- if file_version == '1.4.0' -%}
If the `data-ajax-cart-section` is added not to a root HTML container then only the container with the attribute will be updated, not the whole section.
{%- endif -%}

{%- if file_version == '1.3.0' -%}
* The `window.liquidAjaxCart` object is available.
* Liquid Ajax Cart works correctly even if it is included more than once on a page.
{%- endif -%}

{%- if file_version == '1.2.1' -%}
The `data-ajax-cart-quantity-input` adds `initiator` property to Ajax requests.
{%- endif -%}

{%- if file_version == '1.2.0' -%}
* The `info` property is accepted within the `options` parameter of the `cartRequest*` functions.
* All the controls and product forms add the `initiator` property for any request.
* The `data-ajax-cart-quantity-input` sends data as the `FormData` object.
* The `data-ajax-cart-form-error` attribute is removed.
* The `data-ajax-cart-messages` attribute is added.
* The `messageBuilder`, `lineItemQuantityErrorText` and `requestErrorText` configuration options are added.
{%- endif -%}

{%- if file_version == '1.1.0' -%}
The `data-ajax-cart-quantity-input` is added.
{%- endif -%}

{%- if file_version == '1.0.0' -%}
Public release.
{%- endif -%}

{%- if file_version == '0.2.0' -%}
* The `cartRequest*` functions don't return the `Promise` anymore.
* The `cartRequest*` functions have one more parameter — the `options` object with the possibilty to pass the `firstComplete` and `lastComplete` callbacks.
{%- endif -%}

{%- if file_version == '0.1.1' -%}
* The `'x-requested-with': 'XMLHttpRequest'` header is added to the FormData and URLSearchParams requests.
{%- endif -%}

{%- if file_version == '0.1.0' -%}
* The `data-ajax-cart-quantity-button` attribute is removed.
* The `data-ajax-cart-request-button` attribute is added.
* The `cartRequestAdd` and `cartRequestUpdate` functions are added.
{% endif %}

{%- if file_version == '0.0.1' -%}
`Hello world!`
{% endif %}

<div class="release__download-wrapper">
	<a download href="{{ release_slice | append: file_version | append: '.js' }}" class="release__download-btn">
		Download
	</a>
</div>

</div>

	
</div>

{% endfor %}
</div>
