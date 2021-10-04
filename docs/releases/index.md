---
layout: full
disable_anchors: true
title: Liquid Ajax Cart — Releases
---

{% assign release_slice = '/releases/liquid-ajax-cart-v' %}

<ul>
{% for file in site.static_files %}
	{% assign file_release_slice = file.path | slice: 0, release_slice.size %}
	{% if release_slice == file_release_slice %}
		<li><a href="{{ file.path }}">{{ file.name }}</a></li>
	{% endif %}
{% endfor %}
</ul>