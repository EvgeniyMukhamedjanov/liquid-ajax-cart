---
layout: full
disable_anchors: true
title: Liquid Ajax Cart — Releases
---

<ul>
{% for file in site.static_files %}
	{% assign release_slice = file.path | slice: 0, 28 %}
	{% if release_slice == '/releases/liquid-ajax-cart-v' %}
		<li><a href="{{ file.path }}">{{ file.name }}</a></li>
	{% endif %}
{% endfor %}
</ul>