---
layout: full
disable_anchors: true
title: Releases
---

{%- assign release_slice = '/releases/liquid-ajax-cart-v' -%}

{%- assign versions_joined = '' -%}
{%- for file in site.static_files -%}
	{%- assign file_release_slice = file.path | slice: 0, release_slice.size -%}
	{%- if release_slice == file_release_slice -%}
		{%- assign file_release_version = file.path | slice: release_slice.size, 15 | replace: ".js", "" -%}
		{%- assign file_release_version_array = file_release_version | split: '.' -%}
		{%- assign versions_joined = versions_joined | append: '|' -%}
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

### {{ file_version }}
[{{ 'liquid-ajax-cart-v' | append: file_version | append: '.js' }}]({{ release_slice | append: file_version | append: '.js' }})

{% if file_version == '0.1.0' %}
* `data-ajax-cart-quantity-button` is removed.
* `data-ajax-cart-request-button` is added.
* `cartRequestAdd` and `cartRequestUpdate` functions are added.
{% endif %}

{% endfor %}
