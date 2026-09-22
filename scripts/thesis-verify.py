import json, re, urllib.request, urllib.parse, difflib, time, html

s = open('/Users/gai/personal/works/daerachoen/public/thesis/index.html', encoding='utf-8').read()
raw = re.search(r'<script id="PAPERS" type="application/json">(.*?)</script>', s, re.S).group(1)
data = json.loads(raw)

def norm(t):
    t = html.unescape(t or '')
    t = re.sub(r'<[^>]+>', '', t)
    t = re.sub(r'[^a-z0-9]+', ' ', t.lower()).strip()
    return t

def get(url):
    req = urllib.request.Request(url, headers={'User-Agent':'daerachoen-thesis-verify/1.0 (mailto:gai@try-n.com)'})
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.status, json.loads(r.read().decode())

results = []
for n, p in enumerate(data):
    doi = (p.get('doi') or '').strip()
    stored_title = p.get('title','')
    rec = {'i': n, 'doi': doi, 'stored_title': stored_title[:120],
           'stored_journal': p.get('journal',''), 'stored_year': (p.get('published_date','') or '')[:4],
           'resolved': False, 'source': None, 'api_title': None,
           'sim': None, 'retracted': None, 'type': None, 'api_year': None, 'err': None}
    if not doi:
        rec['err'] = 'no_doi'; results.append(rec); continue
    ok = False
    try:
        st, j = get(f"https://api.openalex.org/works/https://doi.org/{doi}")
        if st == 200 and j.get('id'):
            rec['resolved'] = True; rec['source'] = 'OpenAlex'
            rec['api_title'] = (j.get('title') or '')[:160]
            rec['retracted'] = bool(j.get('is_retracted'))
            rec['type'] = j.get('type')
            rec['api_year'] = j.get('publication_year')
            rec['sim'] = round(difflib.SequenceMatcher(None, norm(stored_title), norm(j.get('title'))).ratio(), 3)
            ok = True
    except Exception as e:
        rec['err'] = f'OA:{type(e).__name__}'
    if not ok:
        try:
            st, j = get(f"https://api.crossref.org/works/{doi}")
            if st == 200:
                m = j.get('message', {})
                t = (m.get('title') or [''])[0]
                rec['resolved'] = True; rec['source'] = 'Crossref'
                rec['api_title'] = t[:160]
                rec['type'] = m.get('type')
                rec['api_year'] = (m.get('published',{}).get('date-parts',[[None]])[0][0])
                rec['sim'] = round(difflib.SequenceMatcher(None, norm(stored_title), norm(t)).ratio(), 3)
                ok = True
        except Exception as e:
            rec['err'] = (rec['err'] or '') + f' CR:{type(e).__name__}'
    results.append(rec)
    if n % 25 == 0:
        json.dump(results, open('/tmp/verify_results.json','w'), ensure_ascii=False, indent=1)
        print(f"{n}/{len(data)} done", flush=True)
    time.sleep(0.12)

json.dump(results, open('/tmp/verify_results.json','w'), ensure_ascii=False, indent=1)
resolved = [r for r in results if r['resolved']]
low = [r for r in resolved if (r['sim'] or 0) < 0.6]
retr = [r for r in resolved if r['retracted']]
notfound = [r for r in results if not r['resolved']]
print("=== DONE ===")
print("총:", len(results), "| resolved:", len(resolved), "| not resolved:", len(notfound),
      "| title 유사도<0.6:", len(low), "| retracted:", len(retr))
json.dump({'total':len(results),'resolved':len(resolved),
           'notfound':[{'doi':r['doi'],'title':r['stored_title'],'err':r['err']} for r in notfound],
           'low_sim':[{'doi':r['doi'],'sim':r['sim'],'stored':r['stored_title'],'api':r['api_title']} for r in low],
           'retracted':[{'doi':r['doi'],'title':r['stored_title']} for r in retr]},
          open('/tmp/verify_summary.json','w'), ensure_ascii=False, indent=1)
print("summary saved")
