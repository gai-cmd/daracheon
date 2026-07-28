#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json, re, sys

BASE = "/private/tmp/claude-501/-Users-gai-personal-works-daerachoen/cc30b3d8-184e-4e7d-8ef8-3bdd7b5648f2/scratchpad/blog"

def strip_html(h):
    h = re.sub(r'<svg.*?</svg>', '', h, flags=re.S)
    h = re.sub(r'<[^>]+>', '', h)
    h = re.sub(r'\{\{IMG:[^}]+\}\}', '', h)
    return h

def kchars(t):
    return len(re.findall(r'[가-힣]', t))

slug = sys.argv[1]
d = json.load(open(f"{BASE}/out/{slug}.json", encoding="utf-8"))
src = json.load(open(f"{BASE}/in/{slug}.json", encoding="utf-8"))
c = d["content"]
txt = strip_html(c)
fails = []

before = kchars(strip_html(src["content"]))
after = kchars(txt)
print(f"slug={slug}  charsBefore(ko)={before}  charsAfter(ko)={after}  totalTextLen={len(txt.strip())}")

if after < 3000: fails.append(f"본문 한글 {after}자 (<3000)")
if 'class="lead"' not in c or '결론부터' not in c[:400]: fails.append("결론 우선 리드 없음")
# sources section clickable
m = re.search(r'<h2>근거·출처</h2>(.*)$', c, flags=re.S)
if not m or '<a href=' not in m.group(1): fails.append("근거·출처 클릭 링크 없음")
# subject sentences
subj = len(re.findall(r'(대라천|조엘라이프\(주\)|조엘라이프)(은|는|이|가)\s', c))
print("  subject-led occurrences:", subj)
if subj < 3: fails.append("대라천/조엘라이프 주어 문장 3개 미만")
for bad in ["저희", "제가 ", "우리는", "우리 "]:
    if bad in txt: fails.append(f"1인칭 사용: {bad}")
hedge = ["알려져 있습니다","전해집니다","여겨집니다","보고되고 있습니다","한다고 합니다","평가받습니다","밝히고 있습니다","라고 봅니다"]
for hgd in hedge:
    if hgd in txt: fails.append(f"회피 화법: {hgd}")
el = len(d["excerpt"])
print("  excerpt len:", el, "| title len:", len(d["title"]))
if not (120 <= el <= 156): fails.append(f"excerpt {el}자")
if len(d["title"]) > 60: fails.append("title 60자 초과")
internal = re.findall(r'href="(/[^"]*)"', c)
print("  internal links:", internal)
if len(internal) < 2: fails.append("내부링크 2개 미만")
ext_primary = [u for u in re.findall(r'href="(https?://[^"]+)"', c) if 'zoellife.com' not in u]
print("  external primary:", ext_primary)
if not ext_primary: fails.append("외부 1차 출처 없음")
nsvg = c.count("<svg")
toks = re.findall(r'\{\{IMG:([^}]+)\}\}', c)
print("  svg:", nsvg, "| IMG tokens:", toks)
if nsvg < 1: fails.append("SVG 없음")
if len(toks) < 2: fails.append("IMG 토큰 2개 미만")
if 'cover' in toks: fails.append("{{IMG:cover}} 사용")
keys = [i["key"] for i in d["images"]]
if sorted(keys) != sorted(toks): fails.append(f"images keys {keys} != tokens {toks}")
# H2 section sizes
parts = re.split(r'<h2>', c)
h2info = []
for p in parts[1:]:
    name = p.split('</h2>')[0]
    body = kchars(strip_html(p.split('</h2>',1)[1]))
    h2info.append((name, body))
print("  H2 sections:")
for n, b in h2info:
    flag = "" if 400 <= b <= 800 else "  <-- out of 400~800"
    print(f"    {b:5d}  {n}{flag}")
q = sum(1 for n,_ in h2info if re.search(r'(무엇|왜|어떻게|언제|까요|나요|합니까|인가요)', n))
print("  question-form H2:", q, "| total H2:", len(h2info))
if q < 2: fails.append("질문형 H2 2개 미만")
if not (6 <= len(h2info) <= 12): fails.append(f"H2 개수 {len(h2info)}")
if '※ 본 콘텐츠는' not in c: fails.append("disclaimer 없음")
# preserved literals
for lit in re.findall(r'DA-\d{6}-\d', src["content"]):
    if lit not in c: fails.append(f"검사번호 유실 {lit}")
print("  FAILS:", fails if fails else "none")
