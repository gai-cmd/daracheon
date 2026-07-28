import json, re, sys

OUT = "/Users/gai/personal/works/daerachoen/marketing/blog-rewrite/work/out/vietnam-vs-indonesia-agarwood-origin.json"
IN  = "/Users/gai/personal/works/daerachoen/marketing/blog-rewrite/work/in/vietnam-vs-indonesia-agarwood-origin.json"

d = json.load(open(OUT, encoding="utf-8"))
src = json.load(open(IN, encoding="utf-8"))
c = d["content"]

def strip_svg(h):
    return re.sub(r"<svg.*?</svg>", "", h, flags=re.S)

def text_only(h):
    h = strip_svg(h)
    h = re.sub(r"<[^>]+>", "", h)
    return h

def hangul(s):
    return len(re.findall(r"[가-힣]", s))

body = text_only(c)
print("hangul chars (content, svg excluded):", hangul(body))
print("hangul chars (source):", hangul(text_only(src["content"])))
print("excerpt len:", len(d["excerpt"]), "| hangul:", hangul(d["excerpt"]))
print("title len:", len(d["title"]))

# allowed tags
allowed = set("p h2 h3 ul ol li strong em a table thead tbody tr th td figure figcaption img svg hr br span div blockquote".split())
svg_children = set("rect text line circle path g polygon polyline defs title desc tspan".split())
tags = set(t.lower() for t in re.findall(r"<\s*/?\s*([a-zA-Z0-9]+)", c))
bad = sorted(t for t in tags if t not in allowed and t not in svg_children)
print("DISALLOWED TAGS:", bad)

# H2 sections
parts = re.split(r"<h2>", c)
print("\nH2 count:", len(parts) - 1)
for p in parts[1:]:
    title = p.split("</h2>")[0]
    n = hangul(text_only(p))
    flag = "" if 400 <= n <= 800 else "  <-- OUT OF 400~800"
    print(f"  {n:5d}  {title}{flag}")

# lead
print("\nlead ok:", c.startswith('<p class="lead"><strong>결론부터.</strong>'))
lead = text_only(c.split("</p>")[0])
print("lead hangul:", hangul(lead))

# tokens / svg / images
print("\nIMG tokens:", re.findall(r"\{\{IMG:([^}]+)\}\}", c))
print("image keys :", [i["key"] for i in d["images"]])
print("svg count:", c.count("<svg"))
print("table count:", c.count("<table"))

# links
internal = re.findall(r'href="(/[^"]+)"', c)
external = re.findall(r'href="(https?://[^"]+)"', c)
print("\ninternal links:", internal)
print("external links:", external)

# voice checks
for bad_w in ["저희", "제가", "우리", "알려져 있", "전해집니다", "여겨집니다", "보고되고 있", "한다고 합니다", "평가받"]:
    if bad_w in body:
        print("VOICE HIT:", bad_w)

subj = len(re.findall(r"(대라천은|조엘라이프는|조엘라이프\(주\)는|조엘라이프\(주\)\(브랜드 대라천\)는)", body))
print("brand-subject sentences:", subj)

# compliance
for w in ["치료", "완치", "부작용 없", "즉시 효과", "반드시 좋아"]:
    if w in body:
        print("COMPLIANCE HIT:", w)

# preserved items
for w in ["disclaimer-marker", "일반식품(또는 건강식품)", "158헥타르", "130년생", "50년생", "20~30년", "2~10년", "노니", "현무암", "Aquilaria Malaccensis", "100% 일치"]:
    print(f"preserved[{w}]:", w in c)

print("\nquestion H2s:", len([p for p in parts[1:] if re.search(r"(까요|무엇|어떻게|왜)", p.split('</h2>')[0])]))
