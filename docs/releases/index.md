---
layout: full
disable_anchors: true
title: Liquid Ajax Cart — Releases
---

<ul>
{% for file in site.static_files %}
<li>{{ file.name }} {{ file.basename }} {{ file.extname }}</li>
{% endfor %}
</ul>