import json, re, sys, os, collections
BASE = os.path.dirname(os.path.abspath(__file__))
slug = sys.argv[1]
src = json.load(open(os.path.join(BASE, "in", slug + ".json"), encoding="utf-8"))
out = json.load(open(os.path.join(BASE, "out", slug + ".json"), encoding="utf-8"))
c = out["content"]
txt = re.sub(r"<[^>]+>", "", c)
ok = lambda b: "PASS" if b else "**FAIL**"
print("slug            ", out["slug"], ok(out["slug"] == src["slug"]))
print("title len       ", len(out["title"]), ok(len(out["title"]) <= 60))
print("excerpt len     ", len(out["excerpt"]), ok(120 <= len(out["excerpt"]) <= 156))
print("body chars      ", len(txt), ok(len(txt) >= 3000))
print("lead first      ", ok(c.lstrip().startswith('<p class="lead"><strong>결론부터.</strong>')))
h2 = re.findall(r"<h2>(.*?)</h2>", c)
print("H2 count        ", len(h2), h2)
qh2 = [h for h in h2 if re.search(r"무엇|왜|어떻게|언제|까요|나요|가요|인가요", h)]
print("question H2     ", len(qh2), ok(len(qh2) >= 2))
# per-H2 length
segs = re.split(r"<h2>", c)[1:]
for h, s in zip(h2, segs):
    n = len(re.sub(r"<[^>]+>", "", s)) - len(h)
    flag = "" if 400 <= n <= 800 else "  <-- out of 400~800"
    print("   H2 %4d  %s%s" % (n, h[:40], flag))
print("table           ", c.count("<table"), ok(c.count("<table") >= 1))
print("svg             ", c.count("<svg"), ok(c.count("<svg") >= 1))
img = re.findall(r"\{\{IMG:([^}]+)\}\}", c)
print("IMG tokens      ", img, ok(len(img) >= 2 and "cover" not in img))
print("images[] match  ", ok(sorted(img) == sorted(i["key"] for i in out["images"])))
internal = sorted(set(re.findall(r'href="(/[^"]+)"', c)))
print("internal links  ", len(internal), internal, ok(len(internal) >= 2))
ext = sorted(set(re.findall(r'href="(https?://[^"]+)"', c)))
print("external links  ", ext, ok(len(ext) >= 1))
print("noopener all    ", ok(all('target="_blank" rel="noopener"' in m for m in re.findall(r'<a href="https?://[^>]*>', c))))
print("근거·출처 links  ", ok("근거·출처" in c))
subj = len(re.findall(r"대라천(은|이|의|도|과|,)|조엘라이프(는|가|은|이)", c))
print("brand-subject    ", subj, ok(subj >= 3))
bad = [w for w in ["저희", "알려져 있습니다", "전해집니다", "여겨집니다", "보고되고 있습니다", "한다고 합니다", "평가받습니다"] if w in c]
bad += re.findall(r"(?<![가-힣])제가(?![가-힣])", c) + re.findall(r"(?<![가-힣])우리(?![가-힣])", c)
print("banned voice    ", bad, ok(not bad))
med = [w for w in ["치료", "완치", "부작용 없음", "즉시 효과", "반드시 좋아집니다", "예방·치료를 위한"] if w in c]
print("compliance words", med, "(disclaimer 문구 내 '예방·치료를 위한 의약품이 아니며'는 정상)")
print("disclaimer      ", ok("본 콘텐츠는 정보 제공을 목적으로 하며" in c and "개인차가 있습니다" in c))
print("-요체 잔존       ", ok(not re.search(r"(예요|에요|이에요|거예요|해요|지요\.|어요)\s*<", c)))


def nums(d):
    return collections.Counter(re.findall(r"\d{3,}", d["title"] + " " + d["excerpt"] + " " + d["content"]))
s, o = nums(src), nums(out)
missing = {k: v for k, v in s.items() if k not in o}
print("numberDiff      ", ok(not missing), missing or "clean")
# scientific names
for name in ["Aquilaria malaccensis", "AQUILARIAE LIGNUM", "Aquilaria agallocha", "아퀼라리아 아갈로차 록스버그", "아퀼라리아 아갈로차", "아퀼라리아 말라켄시스"]:
    if name in src["content"]:
        print("   name %-28s in-src -> out %s" % (name, ok(name in c)))
