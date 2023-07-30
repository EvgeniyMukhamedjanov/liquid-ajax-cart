---
title: liquidAjaxCart.conf() 
layout: docs-v2
disable_toc: true
---

# liquidAjaxCart.conf()

<p class="lead" markdown="1">
The method sets configuration parameter values.
</p>

The `conf` method takes a configuration parameter name and its new value as parameters:

{%- capture highlight_code -%}

liquidAjaxCart.conf("updateOnWindowFocus", false);
liquidAjaxCart.conf("requestErrorText", "My request error message");

{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

## Configuration parameters

{% for docs_section in site.links_v2.docs -%}
  {%- for docs_subsection in docs_section.subsections -%}
    {%- if docs_subsection.id == 'configuration-subsection' -%}
      {%- for docs_link in docs_subsection.links %}
* [`{{ docs_link.title | escape }}`](/v2/docs/{{ docs_link.file }}/)
      {%- endfor -%}
      {%- break -%}
    {%- endif -%}
  {%- endfor -%}
{%- endfor -%}