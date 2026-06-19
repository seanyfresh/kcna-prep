#!/usr/bin/env python3
"""Verify the generated language packs in assets/js/i18n/<code>.js.

For each language pack it checks:
  - the file parses (I18n.register("code", { ...JSON... });)
  - every catalog string has a translation (coverage)
  - each translation preserves the source's {placeholders} and HTML tags
  - the translation actually differs from English (rough "did it translate" check)

Exits non-zero if any pack is missing or structurally broken.
"""
import json
import re
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LANGS = ["es", "pt", "fr", "de", "it", "zh", "ja", "hi", "ar"]

with open(os.path.join(ROOT, "tools", "i18n-catalog.json"), encoding="utf-8") as f:
    catalog = json.load(f)


def placeholders(s):
    return sorted(re.findall(r"\{\w+\}", s))


def tags(s):
    return sorted(re.sub(r"\s+", " ", t) for t in re.findall(r"<[^>]+>", s))


def load_pack(code):
    path = os.path.join(ROOT, "assets", "js", "i18n", code + ".js")
    if not os.path.exists(path):
        return None, "missing file"
    text = open(path, encoding="utf-8").read()
    m = re.search(r"I18n\.register\(\s*\"" + code + r"\"\s*,\s*(\{.*\})\s*\)\s*;",
                  text, re.DOTALL)
    if not m:
        return None, "could not find I18n.register({...}) block"
    try:
        return json.loads(m.group(1)), None
    except json.JSONDecodeError as e:
        return None, f"JSON parse error: {e}"


def main():
    ok = True
    print(f"Catalog: {len(catalog)} strings\n")
    for code in LANGS:
        d, err = load_pack(code)
        if err:
            print(f"[{code}] BROKEN — {err}")
            ok = False
            continue
        missing = [s for s in catalog if s not in d or not str(d.get(s, "")).strip()]
        fmt = [s for s in catalog if s in d and
               (placeholders(s) != placeholders(d[s]) or tags(s) != tags(d[s]))]
        untranslated = [s for s in catalog if d.get(s) == s and (s.isascii() and any(c.isalpha() for c in s))]
        status = "OK" if not missing and not fmt else "ISSUES"
        if missing or fmt:
            ok = False
        print(f"[{code}] {status} — {len(d)} keys | missing {len(missing)} | "
              f"format-breaks {len(fmt)} | identical-to-EN {len(untranslated)}")
        for s in fmt[:4]:
            print(f"        format: {s!r} -> {d[s]!r}")
        for s in missing[:4]:
            print(f"        missing: {s!r}")
    print()
    print("ALL PACKS OK" if ok else "SOME PACKS HAVE ISSUES")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
