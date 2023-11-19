---
title: data-ajax-cart-property-input
layout: docs-v2
---

# data-ajax-cart-property-input

<p class="lead" markdown="1">
An attribute which ajaxifies cart item property inputs, cart note textarea, cart attribute inputs.
</p>

## How it works

Add the `data-ajax-cart-property-input` attribute to a cart item property input, 
a cart note input or a cart attribute input to ajaxify them. 
Once a user changes the value of the input field, 
Liquid Ajax Cart performs a Shopify Cart API Ajax request to update the cart.

The request will be sent on input's `change` event and when a user presses the `Enter` key within the input field or `Ctrl`+`Enter` for the `textarea` element.

When a user presses the `Esc` key within the input, its value is reset to the current item's quantity according to the [`liquidAjaxCart.cart`](/v2/liquid-ajax-cart-cart/) object.

The `data-ajax-cart-property-input` input fields become `disabled` when there is a Shopify Cart API Ajax request in progress.

The `data-ajax-cart-property-input` supports text input fields, checkboxes, radio buttons, `select` and `textarea` elements.

## Cart item property

The value of the `data-ajax-cart-property-input` attribute should be `line_item_index[property_name]` or `line_item_key[property_name]` for a line-item property input:

{%- capture highlight_code -%}
{% raw %}
<div class="my-cart" data-ajax-cart-section>
  <h2>Cart</h2>

  <div class="my-cart__items">
    {% for item in cart.items %}
      {% assign item_index = forloop.index %}
      <div><a href="{{ item.url }}">{{ item.title }}</a></div>
      <div>Price: {{ item.final_price | money }}</div>

      {% for property in item.properties %}
        <div>
          {{ property.first }}:
          {% if property.first == 'Engraving' %}
  
            <!-- Ajaxified line item property text input -->
            <input type="text"
              value="{{ property.last }}" 
              data-ajax-cart-property-input="{{ item_index }}[{{ property.first }}]"/>
  
          {% elsif property.first == 'Position' %}
  
            <!-- Ajaxified line item property select -->
            <select 
              id="engraving_position" 
              data-ajax-cart-property-input="{{ item_index }}[{{ property.first }}]">
                <option value="">Not selected</option>
                {% assign suggested_positions = 'Left|Center|Right' | split: '|' %}
                {% for position in suggested_positions %}
                  <option value="{{ position }}" {% if position == property.last %} selected {% endif %}>{{ position }}</option>
                {% endfor %}
            </select>
  
          {% elsif property.first == 'Package' %}
  
            <!-- Ajaxified line item property radio group -->
            {% assign suggested_packages = 'Red|Green|Blue' | split: '|' %}
            {% for package in suggested_packages %}
              <label>
                <input 
                  type="radio" 
                  name="{{ item_index }}[{{ property.first }}]" 
                  value="{{ package }}" 
                  data-ajax-cart-property-input="{{ item_index }}[{{ property.first }}]"
                  {% if package == property.last %} checked {% endif %} /> 
                {{ package }}
              </label>
            {% endfor %}
  
          {% elsif property.first == 'Is a gift' %}
  
            <!-- Ajaxified line item property checkbox -->
            <label>
              <!-- Value when the checkbox unchecked -->
              <input type="hidden" value="No" data-ajax-cart-property-input="{{ item_index }}[{{ property.first }}]">
              <!-- The checkbox itself -->
              <input 
                type="checkbox" 
                value="Yes"
                data-ajax-cart-property-input="{{ item_index }}[{{ property.first }}]"
                {% if property.last == 'Yes' %} checked {% endif %} />
              Is a gift
            </label>
  
          {% else %}
            {{ property.last }}
          {% endif %}
        </div>
      {% endfor %}

      <!-- ... -->
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/my-ajax-cart.liquid" language="liquid" code=highlight_code highlight_lines="16-18,23-25,39-44,54,56-60" %}


## Cart attribute

The value of the `data-ajax-cart-property-input` attribute should be `attributes[attribute_name]`. 
If you apply the `data-ajax-cart-property-input` attribute to a form control with a correct `name` attribute 
then you can leave the `data-ajax-cart-property-input` value empty:

{%- capture highlight_code -%}
{% raw %}
<div class="my-cart" data-ajax-cart-section>
  <h2>Cart</h2>

  <div class="my-cart__items">
    <!-- Cart items HTML -->
  </div>

  <div>
    <label for="cartAttributePackageText">Package text</label>

    <!-- Ajaxified cart attribute text input.
    The data-ajax-cart-property-input is empty 
    because there is a correct input name attribute -->
    <input data-ajax-cart-property-input
      type="text" 
      id="cartAttributePackageText"
      name="attributes[Package text]" 
      form="my-ajax-cart-form"
      value="{{ cart.attributes['Package text'] }}"
      class="my-cart__input my-cart__input--property" />
  </div>

  <div>
    <label for="cartAttributeDeliveryDay">Delivery day</label>

    <!-- Ajaxified cart attribute select.
    The data-ajax-cart-property-input is empty 
    because there is a correct input name attribute -->
    <select data-ajax-cart-property-input
      name="attributes[Delivery day]" 
      form="my-ajax-cart-form"
      id="cartAttributeDeliveryDay">
        {% assign suggested_days = 'Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday' | split: '|' %}
        <option value=""
          {% unless suggested_days contains cart.attributes['Delivery day'] %} selected {% endunless %}>
          Any day
        </option>
        {% for day in suggested_days %}
          <option 
            value="{{ day }}" 
            {% if day == cart.attributes['Delivery day'] %} selected {% endif %}>
            {{ day }}
          </option>
        {% endfor %}
    </select>
  </div>

  <div>
    <div>Delivery time</div>

    <!-- Ajaxified cart attribute radio group.
    The data-ajax-cart-property-input are empty 
    because there are correct input name attributes -->
    {% assign suggested_time = 'Any time|Day time|Evening' | split: '|' %}
    {% for time in suggested_time %}
      <label>
        <input data-ajax-cart-property-input
          name="attributes[Delivery time]" 
          form="my-ajax-cart-form"
          type="radio" 
          value="{{ time }}" 
          {% if cart.attributes['Delivery time'] == time %} checked {% endif %}>
        {{ time }}
      </label>
    {% endfor %}
  </div>

  <div>
    <!-- Ajaxified cart attribute checkbox.
    The data-ajax-cart-property-input are empty 
    because there are correct input name attributes -->
    <label>
      <!-- Value when the checkbox unchecked -->
      <input data-ajax-cart-property-input
        name="attributes[Leave at the door]"
        type="hidden" 
        value="">
      <!-- The checkbox itself -->
      <input data-ajax-cart-property-input
        type="checkbox" 
        name="attributes[Leave at the door]" 
        form="my-ajax-cart-form"
        value="Yes"
        {% if cart.attributes['Leave at the door'] == 'Yes' %} checked {% endif %}>
      Leave at the door
    </label>
  </div>

  <form id="my-ajax-cart-form" action="{{ routes.cart_url }}" method="post">
    <button type="submit" name="checkout">
      Checkout — {{ cart.total_price | money_with_currency }}
    </button> 
  </form>
</div>

{% schema %} { "name": "My Ajax cart" } {% endschema %}

{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/my-ajax-cart.liquid" language="liquid" code=highlight_code highlight_lines="14-20,29-32,57-62,74-77,79-84" %}

If the form controls in the above example didn't have the correct `name` attributes, 
then `data-ajax-cart-property-input` attributes should have values:

{%- capture highlight_code -%}
<!-- Ajaxified cart attribute text input -->
<input data-ajax-cart-property-input="attributes[Package text]"
  type="text"
  id="cartAttributePackageText"
  value="{{ cart.attributes['Package text'] }}"
  class="my-cart__input my-cart__input--property" />
{%- endcapture -%}
{% include v2/codeblock.html language="liquid" code=highlight_code %}

{%- capture highlight_code -%}
<!-- Ajaxified cart attribute select -->
<select data-ajax-cart-property-input="attributes[Delivery day]"
  id="cartAttributeDeliveryDay">
  <!-- ... -->
</select>
{%- endcapture -%}
{% include v2/codeblock.html language="liquid" code=highlight_code %}

{%- capture highlight_code -%}
{% raw %}
<!-- Ajaxified cart attribute radio button -->
<input data-ajax-cart-property-input="attributes[Delivery time]"
  name="random_name"
  type="radio"
  value="{{ time }}"
  {% if cart.attributes['Delivery time'] == time %} checked {% endif %}>
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html language="liquid" code=highlight_code %}

{%- capture highlight_code -%}
{% raw %}
<!-- Ajaxified cart attribute checkbox -->
<input data-ajax-cart-property-input="attributes[Leave at the door]"
  type="hidden"
  value="">
<input data-ajax-cart-property-input="attributes[Leave at the door]"
  type="checkbox"
  value="Yes"
  {% if cart.attributes['Leave at the door'] == 'Yes' %} checked {% endif %}>
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html language="liquid" code=highlight_code %}

## Cart note

The value of the `data-ajax-cart-property-input` attribute should be `note`. 
If you apply the `data-ajax-cart-property-input` attribute to a form control with the `name="note"` attribute 
then you can leave the `data-ajax-cart-property-input` value empty:

{%- capture highlight_code -%}
{% raw %}
<div class="my-cart" data-ajax-cart-section>
  <h2>Cart</h2>

  <div class="my-cart__items">
    <!-- Cart items HTML -->
  </div>

  <label for="cartNote">Cart note</label>
  
  <!-- Ajaxified cart note textarea.
  The data-ajax-cart-property-input is empty 
  because there is correct textarea name attribute -->
  <textarea data-ajax-cart-property-input
    name="note"
    form="my-ajax-cart-form"
    id="cartNote">
    {{ cart.note }}
  </textarea>

  <form id="my-ajax-cart-form" action="{{ routes.cart_url }}" method="post">
    <button type="submit" name="checkout">
      Checkout — {{ cart.total_price | money_with_currency }}
    </button> 
  </form>
</div>

{% schema %} { "name": "My Ajax cart" } {% endschema %}

{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/my-ajax-cart.liquid" language="liquid" code=highlight_code highlight_lines="13-16" %}

If the form controls in the above example didn't have the correct `name` attribute ,
then the `data-ajax-cart-property-input` attribute should have the `note` value:

{%- capture highlight_code -%}
{% raw %}
<!-- Ajaxified cart note textarea -->
<textarea data-ajax-cart-property-input="note" id="cartNote">
  {{ cart.note }}
</textarea>
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html language="liquid" code=highlight_code %}