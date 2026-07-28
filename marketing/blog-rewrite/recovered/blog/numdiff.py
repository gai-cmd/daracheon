"""SPEC section H: extract every number of 3+ digits from in/ and out/ and confirm
no number present in the source is missing from the rewrite."""
import json, re, sys, os
from collections import Counter

BASE = os.path.dirname(os.path.abspath(__file__))

def nums(html):
    # strip HTML attributes (SVG coords, style px, hex colors, URLs) so only prose/table
    # numbers are compared; those are the "evidence" numbers spec D protects.
    t = re.sub(r'<svg.*?</svg>', ' ', html, flags=re.S)
    t = re.sub(r'<[^>]+>', ' ', t)
    return Counter(re.findall(r'\d{3,}', t))

def urlnums(html):
    return Counter(re.findall(r'\d{3,}', ' '.join(re.findall(r'href=["\']([^"\']+)', html))))

ok = True
for slug in sys.argv[1:]:
    s = json.load(open(os.path.join(BASE, 'in/%s.json' % slug)))['content']
    o = json.load(open(os.path.join(BASE, 'out/%s.json' % slug)))['content']
    sn, on = nums(s), nums(o)
    # a source number also counts as preserved if it survives inside an href (e.g. article id)
    on_all = on + urlnums(o)
    missing = {n: c for n, c in sn.items() if on_all.get(n, 0) < 1}
    added = {n: c for n, c in on.items() if sn.get(n, 0) < 1}
    print('=== %s' % slug)
    print('  source 3+digit numbers : %s' % sorted(sn))
    print('  MISSING from output    : %s' % (sorted(missing) or 'none'))
    print('  new in output          : %s' % (sorted(added) or 'none'))
    if missing:
        ok = False

print('\nnumberDiffClean:', ok)
sys.exit(0 if ok else 1)
