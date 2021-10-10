---
layout: full
disable_anchors: true
title: Releases
---

{%- assign release_slice = '/releases/liquid-ajax-cart-v' -%}

{%- for file in site.static_files -%}
	{%- assign file_release_slice = file.path | slice: 0, release_slice.size -%}
	{%- if release_slice == file_release_slice -%}
		{%- assign file_release_version = file.path | slice: release_slice.size | replace: ".js", "" -%}
		<h3>{{ file_release_version }}</h3>
		<p><a href="{{ file.path }}">{{ file.name }}</a></p>
		{%- if file_release_version == '0.1.0' -%}
			<ul>
				<li>`data-ajax-cart-quantity-button` is removed.</li>
				<li>`data-ajax-cart-request-button` is added.</li>
				<li>`cartRequestAdd` and `cartRequestUpdate` functions are added.</li>
			</ul>
		{%- endif -%}
	{%- endif -%}
{%- endfor -%}
