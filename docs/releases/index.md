---
layout: full
disable_anchors: true
title: Releases
---

{%- assign release_slice = '/releases/liquid-ajax-cart-v' -%}

{%- for file in site.static_files -%}
	{%- assign file_release_slice = file.path | slice: 0, release_slice.size -%}
	{%- if release_slice == file_release_slice -%}
		{%- assign file_release_version = file.path | slice: release_slice.size, 15 | replace: ".js", "" -%}
		
### {{ file_release_version }}
[{{ file.name }}]({{ file.path }})

{%- if file_release_version == '0.1.0' -%}
* `data-ajax-cart-quantity-button` is removed.</li>
* `data-ajax-cart-request-button` is added.</li>
* `cartRequestAdd` and `cartRequestUpdate` functions are added.</li>
{%- endif -%}

	{%- endif -%}
{%- endfor -%}
