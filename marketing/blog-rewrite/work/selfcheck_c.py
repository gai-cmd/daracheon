import json, re, sys, os

BASE = os.path.dirname(os.path.abspath(__file__))
slug = sys.argv[1]
out = json.load(open(os.path.join(BASE, 'out/%s.json' % slug)))
src = json.load(open(os.path.join(BASE, 'in/%s.json' % slug)))
c = out['content']

def strip(html):
    t = re.sub(r'<svg.*?</svg>', '', html, flags=re.S)
    t = re.sub(r'<[^>]+>', '', t)
    return re.sub(r'\s+', '', t)

def prose(html):
    """Tag-stripped but whitespace-preserving. Word boundaries survive, so a
    check like 저희/제가 can tell 제가 from the 제가 inside 문제가·주제가·규제가."""
    t = re.sub(r'<svg.*?</svg>', '', html, flags=re.S)
    return re.sub(r'<[^>]+>', ' ', t)

fails = []
def chk(cond, msg):
    if not cond:
        fails.append(msg)

# H1 length
chk(len(strip(c)) >= 3000, 'body under 3000 Korean chars (%d)' % len(strip(c)))
# H2 lead-first
chk(c.startswith('<p class="lead"><strong>결론부터.</strong>'), 'lead paragraph missing 결론부터')
lead = re.match(r'<p class="lead">(.*?)</p>', c, re.S)
leadlen = len(strip(lead.group(1))) if lead else 0
# H3 근거·출처 clickable
m = re.search(r'<h2>근거·출처</h2>(.*)$', c, re.S)
chk(bool(m) and 'href=' in m.group(1), '근거·출처 has no clickable link')
# H4 whitelist citations
DOIS = {'10.3390/molecules23020342','10.1039/D0NP00042F','10.1055/s-2006-957784',
        '10.1080/10412905.2024.2447706','10.1021/acs.jnatprod.8b00635',
        '10.1007/s11101-025-10117-6','10.3390/molecules26247708','10.1007/s11418-007-0177-0',
        # A9 (SPEC §A) — Akerlof 1970 QJE "The Market for Lemons". CrossRef-verified
        # 2026-07-27: title/author/journal/year all match. Cited for information asymmetry.
        '10.2307/1879431'}
ALLOWED_HOSTS = {'doi.org','cites.org','encykorea.aks.ac.kr','www.kci.go.kr','db.history.go.kr',
                 'hkplus.dongguk.edu','zoellife.com','koreascience.kr',
                 # K8 (SPEC §A) — 한국학중앙연구원 디지털인문학 『이운지』 역주. Page fetched
                 # 2026-07-27; 蘇頌 quote "교지(交趾, 베트남 북부)의 밀향수(蜜香樹)이다" verbatim.
                 'dh.aks.ac.kr'}
ext = re.findall(r'href=["\']https?://([^/"\']+)([^"\']*)', c)
for host, path in ext:
    chk(host in ALLOWED_HOSTS, 'non-whitelisted external host: %s' % host)
    if host == 'doi.org':
        chk(path.lstrip('/') in DOIS, 'non-whitelisted DOI: %s' % path)
# H5 subject sentences
subj = len(re.findall(r'(대라천은|조엘라이프\(주\)는|대라천이|조엘라이프는)', strip(c)))
chk(subj >= 3, 'brand-as-subject occurrences only %d' % subj)
# H6 저희/제가 — must not fire on 문제가·주제가·규제가 (제가 preceded by a Hangul syllable)
fp = re.findall(r'(?<![가-힣])(?:저희|제가|우리는|우리가)', prose(c))
chk(not fp, 'first-person 저희/제가/우리 present: %s' % fp)
# H7 hedging
hedge = re.findall(r'(알려져 있|전해집니다|여겨집니다|보고되고 있|한다고 합니다|평가받습니다|평가돼요|평가됩니다)', re.sub(r'<[^>]+>','',c))
chk(not hedge, 'hedging phrases remain: %s' % hedge)
# H8 excerpt
chk(120 <= len(out['excerpt']) <= 156, 'excerpt length %d out of 120-156' % len(out['excerpt']))
chk(len(out['title']) <= 60, 'title over 60 chars')
# H9 links
internal = set(re.findall(r'href=["\'](/[^"\']+)', c))
chk(len(internal) >= 2, 'internal links %d < 2' % len(internal))
chk(any(h == 'doi.org' for h, _ in ext), 'no primary external source link')
# H10 svg + img tokens
chk(c.count('<svg') >= 1, 'no inline SVG')
tokens = re.findall(r'\{\{IMG:([^}]+)\}\}', c)
chk(len(tokens) >= 2, 'IMG tokens %d < 2' % len(tokens))
chk('cover' not in tokens, '{{IMG:cover}} used')
chk(sorted(tokens) == sorted(i['key'] for i in out['images']), 'IMG tokens do not match images array')
# H11 per-H2 length
parts = re.split(r'<h2>', c)
h2info = []
for p in parts[1:]:
    name = p.split('</h2>')[0]
    body = strip(p.split('</h2>', 1)[1]) if '</h2>' in p else ''
    h2info.append((name, len(body)))
    if name not in ('근거·출처', '자주 묻는 질문') and not (400 <= len(body) <= 800):
        fails.append('H2 length out of range: %s = %d' % (name, len(body)))
chk(6 <= len(h2info) <= 12, 'H2 count %d' % len(h2info))
# question-form H2 >= 2
qh2 = [n for n, _ in h2info if re.search(r'(무엇|왜|어떻게|언제|까요|나요)', n)]
chk(len(qh2) >= 2, 'question-form H2 %d < 2' % len(qh2))
# H12 preserved tokens
for tok in re.findall(r'(DA-260507-1|21889/QĐ-SHTT|#12835|TQC\.\d+\.\d+-?[AB]?|IIA-DNI-007|68/QĐ-UBND|TQC\.05\.1082)', src['content']):
    chk(tok in c, 'lost source token: %s' % tok)
for yr in set(re.findall(r'(19\d\d년|20\d\d년)', src['content'])):
    if yr not in c:
        fails.append('source year missing: %s' % yr)
# H13 disclaimer
src_disc = re.findall(r'<em>※.*?</em>', src['content'], re.S)
chk(bool(src_disc) and src_disc[-1] in c, 'source disclaimer not preserved verbatim')
chk('<hr />' in c, 'hr before disclaimer missing')
# compliance
bad = re.findall(r'(치료합니다|완치|부작용 없|즉시 효과|반드시 좋아)', strip(c))
chk(not bad, 'prohibited efficacy wording: %s' % bad)
chk(out['slug'] == src['slug'], 'slug changed')

print('slug:', slug)
print('chars:', len(strip(c)), '| lead:', leadlen, '| H2s:', len(h2info), '| internal:', sorted(internal))
print('H2 sizes:', h2info)
print('FAILURES:', json.dumps(fails, ensure_ascii=False, indent=1) if fails else 'NONE')
