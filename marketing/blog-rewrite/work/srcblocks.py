# -*- coding: utf-8 -*-
"""Pull preserve-verbatim blocks (table / figure / svg / disclaimer) straight out of
in/<slug>.json so they are copied byte-for-byte instead of retyped by hand.
SPEC section D: <svg> internals, <table> numerics, image URLs and the disclaimer are
byte-preserve targets."""
import json, os, re

BASE = os.path.dirname(os.path.abspath(__file__))


def source(slug):
    return json.load(open(os.path.join(BASE, 'in', slug + '.json'), encoding='utf-8'))


def blocks(slug):
    c = source(slug)['content']
    return {
        'tables': re.findall(r'<table.*?</table>', c, re.S),
        'figures': re.findall(r'<figure>.*?</figure>', c, re.S),
        'svgs': re.findall(r'<div style="background:#FBF7F0.*?</div>|<svg.*?</svg>', c, re.S),
        'disclaimer': re.findall(r'<hr />.*$', c, re.S)[0],
    }


def hangul(s):
    return len(re.findall(r'[가-힣]', s))


def strip_html(s):
    s = (s.replace('&middot;', '·').replace('&nbsp;', ' ').replace('&ldquo;', '"')
          .replace('&rdquo;', '"').replace('&hellip;', '…')
          .replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>'))
    s = re.sub(r'<[^>]*>', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()


def emit(art):
    src = source(art['slug'])
    art['changelog']['charsBefore'] = hangul(strip_html(src['content']))
    art['changelog']['charsAfter'] = hangul(strip_html(art['content']))
    path = os.path.join(BASE, 'out', art['slug'] + '.json')
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(art, f, ensure_ascii=False, indent=2)
    print('wrote', path, '| title', len(art['title']), '| excerpt', len(art['excerpt']),
          '| chars', art['changelog']['charsBefore'], '->', art['changelog']['charsAfter'])
