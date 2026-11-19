#!/usr/bin/env python3
"""
scripts/writer.py - High-retention scriptwriting, hook scoring, and anti-slop engine for Faceless Shorts.

Combines proven methodologies from instagram-agent-skill (ig-reel, ig-human, ig-viral)
and marketingskills (copywriting, marketing-psychology):
  - 26 Hook Formulas & 5-factor Hook Scoring
  - Anti-slop Lexicon & Invisible Character Cleaner
  - 5-Signal Human Detection Panel
  - Timed Beat Sheet Analyzer (150-165 WPM, <= 3.5s cuts, abstract runs)
  - Seamless Loop Verification (last word echoes opening hook)

Usage:
  python scripts/writer.py score-hook "Six years. Then you find the messages."
  python scripts/writer.py suggest-hooks "breakup betrayal"
  python scripts/writer.py humanize draft.txt [--report]
  python scripts/writer.py detect-slop draft.txt
  python scripts/writer.py audit-script script.json [--target 55]
"""

import argparse
import json
import os
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HOOKS_FILE = ROOT / "assets" / "hooks.json"
SLOP_FILE = ROOT / "assets" / "slop.json"

WORD_RE = re.compile(r"[A-Za-z0-9$%'’-]+")
SENT_RE = re.compile(r"[^.!?\n]+[.!?]*")
URL_RE = re.compile(r"https?://\S+|www\.\S+|\S+@\S+\.\S+")

SPOKEN_NUMBERS = {
    "zero", "two", "three", "four", "five", "six", "seven", "eight", "nine",
    "ten", "eleven", "twelve", "fifteen", "twenty", "thirty", "forty", "fifty",
    "sixty", "seventy", "eighty", "ninety", "hundred", "thousand", "million",
    "billion", "dozen", "half", "twice", "triple",
}
MONEY_WORDS = {
    "dollars", "dollar", "bucks", "grand", "percent", "cents",
    "millionaire", "billionaire", "revenue", "profit", "salary", "rent",
}
STAKES = {
    "stop", "never", "wrong", "mistake", "mistakes", "lost", "lose", "losing",
    "cost", "costs", "broke", "broken", "failed", "failure", "fail", "nobody",
    "no", "not", "don't", "dont", "doesn't", "didn't", "can't", "won't",
    "quit", "quitting", "fired", "deleted", "delete", "killed", "kills", "kill",
    "replaced", "replaces", "cut", "beat", "free", "paid", "charged", "hired",
    "saved", "first", "banned", "illegal", "worst", "hate", "hated", "wasted",
    "waste", "scam", "lie", "lied", "lying", "truth", "secret", "hidden",
    "stole", "stolen", "before", "until", "instead", "but", "except", "unless",
    "problem", "risk", "danger", "warning", "regret", "wish", "should", "shouldn't",
    "still", "already", "only", "without", "versus", "vs", "actually", "choice",
    "cheated", "betrayal", "wound", "shatter", "beg", "deserve",
}
WEAK_OPENERS = [
    "so", "ok", "okay", "hey", "hi", "hello", "guys", "yo", "alright",
    "welcome", "today", "basically", "honestly", "look", "listen", "um",
    "just", "let", "lets", "let's", "i wanted", "i want", "one of",
    "have you", "did you", "do you", "are you", "in this", "in today",
    "the thing", "a lot", "there is", "there are", "this is", "it is",
]
IMPERATIVES = {
    "stop", "steal", "copy", "delete", "try", "watch", "read", "save",
    "use", "build", "make", "write", "send", "take", "start", "quit",
    "never", "always", "don't", "dont", "do", "put", "run", "check", "tell",
}
DEALBREAKERS = [
    (re.compile(r"(?i)^\s*(?:stop scrolling|don'?t scroll)"),
     "Opens with 'stop scrolling'. Asking for attention proves you haven't earned it."),
    (re.compile(r"(?i)\bwait (?:for it|till the end|until the end)\b"),
     "Uses 'wait until the end'. Teasing payoff without delivering upfront causes swipe-away."),
    (re.compile(r"(?i)\bin this video\b"),
     "Uses 'in this video'. Viewers know they are watching a video; start inside the action."),
]

STOPWORDS = {
    "the", "a", "an", "and", "or", "but", "if", "of", "to", "in", "on", "for",
    "with", "that", "this", "it", "is", "are", "was", "were", "be", "been",
    "you", "your", "i", "my", "me", "we", "our", "they", "them", "he", "she",
    "so", "just", "not", "no", "do", "did", "does", "have", "has", "had",
    "will", "can", "at", "as", "by", "from", "out", "up", "off", "one", "all",
}


def load_json(path):
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


# ── HOOK SCORING ─────────────────────────────────────────────────────────────

def score_hook(text):
    text = text.strip()
    words = WORD_RE.findall(text)
    word_count = len(words)

    # 1. Length check: optimal 5 to 12 words (~1.5s to 3.0s spoken)
    if word_count == 0:
        length_score = 0
    elif 5 <= word_count <= 11:
        length_score = 100.0
    elif word_count < 5:
        length_score = max(20.0, 100.0 - (5 - word_count) * 20.0)
    else:
        length_score = max(10.0, 100.0 - (word_count - 11) * 15.0)

    # 2. Specificity (numbers, money, time, proper nouns)
    markers = 0
    for w in words:
        wl = w.lower()
        if wl in SPOKEN_NUMBERS or wl in MONEY_WORDS:
            markers += 1
        elif re.match(r"^\$?\d+", w):
            markers += 1
    spec_score = min(100.0, markers * 50.0)
    if markers == 0:
        spec_score = 25.0

    # 3. Stakes check (conflict, tension, risk, gain/loss)
    stakes_hits = [w for w in words if w.lower() in STAKES]
    stakes_score = min(100.0, len(stakes_hits) * 50.0)

    # 4. Frontloaded payload check
    first_three = [w.lower() for w in words[:3]]
    front_score = 100.0
    for opener in WEAK_OPENERS:
        if opener in first_three:
            front_score -= 35.0
    front_score = max(0.0, front_score)

    # 5. Direct address / Audience orientation
    has_you = any(w.lower() in {"you", "your", "you're", "you've", "we"} for w in words)
    has_imperative = len(words) > 0 and words[0].lower() in IMPERATIVES
    address_score = 100.0 if (has_you or has_imperative) else 40.0

    # Dealbreakers
    dealbreakers = []
    for pattern, reason in DEALBREAKERS:
        if pattern.search(text):
            dealbreakers.append(reason)

    composite = (
        length_score * 0.25 +
        spec_score * 0.20 +
        stakes_score * 0.25 +
        front_score * 0.15 +
        address_score * 0.15
    )
    if dealbreakers:
        composite = min(composite, 30.0)

    verdict = "STRONG" if composite >= 75 else ("PASS" if composite >= 60 else "NEEDS REWRITE")

    return {
        "text": text,
        "word_count": word_count,
        "composite": round(composite, 1),
        "verdict": verdict,
        "signals": {
            "length": round(length_score, 1),
            "specificity": round(spec_score, 1),
            "stakes": round(stakes_score, 1),
            "frontload": round(front_score, 1),
            "address": round(address_score, 1),
        },
        "dealbreakers": dealbreakers,
        "stakes_hits": stakes_hits,
        "markers_count": markers
    }


def suggest_hooks(topic, count=3):
    hooks_data = load_json(HOOKS_FILE)
    if not hooks_data:
        print(f"Hooks file not found at {HOOKS_FILE}")
        return []

    formulas = hooks_data.get("hooks", [])
    results = []
    
    # Keyword-based relevance or diverse top selections
    topic_words = set(w.lower() for w in WORD_RE.findall(topic) if w.lower() not in STOPWORDS)
    scored = []
    for h in formulas:
        score = 0
        text_corpus = (h.get("name", "") + " " + h.get("template", "") + " " + h.get("best_for", "") + " " + h.get("example", "")).lower()
        for tw in topic_words:
            if tw in text_corpus:
                score += 2
        scored.append((score, h))
    
    scored.sort(key=lambda x: x[0], reverse=True)
    results = [h for _, h in scored[:count]]
    return results


# ── ANTI-SLOP & HUMANIZATION ────────────────────────────────────────────────

def humanize_text(text):
    slop_data = load_json(SLOP_FILE) or {"invisible": [], "typography": [], "lexicon": {}, "structural": []}
    original = text
    report = {"invisible_hits": 0, "typo_hits": 0, "lexicon_hits": [], "structural_tells": []}

    # 1. Clean invisible characters
    for entry in slop_data.get("invisible", []):
        cp_spec = entry.get("cp", "")
        if "-" in cp_spec:
            a, b = cp_spec.split("-")
            pat = "[" + chr(int(a[2:], 16)) + "-" + chr(int(b[2:], 16)) + "]"
        else:
            pat = chr(int(cp_spec[2:], 16))
        count = len(re.findall(pat, text))
        if count > 0:
            report["invisible_hits"] += count
            text = re.sub(pat, "", text)

    # 2. Typography substitutions (em-dash to comma, curly quotes to straight)
    typo_map = {
        "—": ", ",
        "–": "-",
        "“": '"',
        "”": '"',
        "‘": "'",
        "’": "'",
        "…": "...",
    }
    for orig_char, clean_char in typo_map.items():
        if orig_char in text:
            report["typo_hits"] += text.count(orig_char)
            text = text.replace(orig_char, clean_char)

    # 3. Clean double punctuation
    text = re.sub(r",\s*,+", ",", text)
    text = re.sub(r"\s+", " ", text).strip()

    # 4. Lexicon substitutions (case-preserving)
    lexicon = slop_data.get("lexicon", {})
    # Flatten categories
    all_lex = {}
    for cat, mapping in lexicon.items():
        if isinstance(mapping, dict):
            all_lex.update(mapping)

    for slop_phrase, replacement in all_lex.items():
        pattern = re.compile(r"\b" + re.escape(slop_phrase) + r"\b", re.IGNORECASE)
        matches = pattern.findall(text)
        if matches:
            report["lexicon_hits"].append((slop_phrase, replacement, len(matches)))
            text = pattern.sub(replacement, text)

    # 5. Flag structural tells
    structural = [
        (re.compile(r"(?i)\bit'?s not just [^,]+, it'?s\b"), "Triad: 'It's not just X, it's Y'"),
        (re.compile(r"(?i)\bin today'?s (?:fast-paced|digital|modern) world\b"), "Preamble cliché"),
        (re.compile(r"(?i)\bthe result\?\b"), "Rhetorical prompt: 'The result?'"),
    ]
    for pat, label in structural:
        if pat.search(text):
            report["structural_tells"].append(label)

    return text, report


def detect_human(text):
    clean, report = humanize_text(text)
    words = WORD_RE.findall(text)
    sents = [s.strip() for s in SENT_RE.findall(text) if s.strip()]

    # 1. Burstiness (sentence length variation)
    if len(sents) < 2:
        burst_score = 50.0
    else:
        lengths = [len(WORD_RE.findall(s)) for s in sents]
        mean_l = sum(lengths) / len(lengths)
        variance = sum((l - mean_l) ** 2 for l in lengths) / len(lengths)
        std_dev = variance ** 0.5
        cv = (std_dev / mean_l) if mean_l > 0 else 0
        # Healthy conversational speech has CV >= 0.45
        burst_score = min(100.0, max(20.0, cv * 160.0))

    # 2. Specificity
    concrete_hits = len(re.findall(r"\$\s?\d|\b\d[\d,.]*\b|(?<!^)\b[A-Z][a-z]{2,}\b", text))
    spec_per_100 = (concrete_hits / max(1, len(words))) * 100.0
    spec_score = min(100.0, max(20.0, spec_per_100 * 20.0))

    # 3. Slop density
    slop_count = sum(cnt for _, _, cnt in report["lexicon_hits"])
    slop_per_100 = (slop_count / max(1, len(words))) * 100.0
    slop_score = max(0.0, 100.0 - slop_per_100 * 40.0)

    # 4. Fingerprint (invisible & typography anomalies)
    fp_penalties = report["invisible_hits"] * 25.0 + report["typo_hits"] * 5.0
    fp_score = max(0.0, 100.0 - fp_penalties)

    # 5. Voice & rhythm (contractions present)
    contractions = len(re.findall(r"\b[A-Za-z]+['’](?:t|s|re|ve|m|ll|d)\b", text))
    has_contractions = contractions >= max(1, len(sents) // 3)
    voice_score = 90.0 if has_contractions else 55.0
    if report["structural_tells"]:
        voice_score -= len(report["structural_tells"]) * 20.0
    voice_score = max(10.0, voice_score)

    overall = (burst_score * 0.25 + spec_score * 0.20 + slop_score * 0.25 + fp_score * 0.15 + voice_score * 0.15)
    verdict = "HUMAN PASS" if overall >= 70.0 and min(burst_score, spec_score, slop_score, voice_score) >= 45.0 else "REVIEW"

    return {
        "overall": round(overall, 1),
        "verdict": verdict,
        "signals": {
            "burstiness": round(burst_score, 1),
            "specificity": round(spec_score, 1),
            "slop_density": round(slop_score, 1),
            "fingerprint": round(fp_score, 1),
            "voice": round(voice_score, 1),
        },
        "report": report
    }


# ── SCRIPT AUDITOR (BEATS, PACING, LOOP, EMOTION) ───────────────────────────

def audit_script(script_path, target_s=55.0, wpm=165.0):
    script_path = Path(script_path)
    if not script_path.exists():
        print(f"Error: Script file not found: {script_path}")
        return False

    with open(script_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if isinstance(data, list):
        lines = data
    else:
        lines = data.get("lines", [])
    if not lines:
        print("Error: No lines found in script.json")
        return False

    wps = wpm / 60.0
    total_words = 0
    total_est_s = 0.0
    issues = []
    warnings = []

    # 1. Audit Hook (Line 0)
    hook_text = lines[0].get("text", "")
    hook_res = score_hook(hook_text)
    if hook_res["composite"] < 60.0:
        issues.append(f"Hook line 0 scores {hook_res['composite']} ({hook_res['verdict']}). Weaker than recommended 60+ threshold.")
    if hook_res["dealbreakers"]:
        issues.extend(hook_res["dealbreakers"])

    # 2. Audit Beats & Pacing
    abstract_run = 0
    beat_timings = []

    for idx, line in enumerate(lines):
        txt = line.get("text", "")
        clean_txt, rep = humanize_text(txt)
        if rep["lexicon_hits"]:
            for slop, repl, _ in rep["lexicon_hits"]:
                warnings.append(f"Line {idx}: contains AI slop '{slop}' -> suggest '{repl}'")

        l_words = WORD_RE.findall(txt)
        w_cnt = len(l_words)
        total_words += w_cnt
        est_dur = w_cnt / wps
        beat_timings.append((idx, txt, w_cnt, est_dur))
        total_est_s += est_dur

        # Max beat constraint: no single cut > 3.5s without sub-cut
        if est_dur > 3.8 and not ("sub_cut" in line or "cut2" in line or "|" in line.get("caps", "")):
            warnings.append(f"Line {idx} ({est_dur:.1f}s): runs past 3.5s. Split into 2 visual cuts so frame changes every 2-3s.")

        # Check for concrete markers
        has_concrete = bool(re.search(r"\$\s?\d|\b\d[\d,.]*\b|(?<!^)\b[A-Z][a-z]{2,}\b", txt)) or any(w.lower() in SPOKEN_NUMBERS for w in l_words)
        if not has_concrete:
            abstract_run += 1
            if abstract_run >= 3:
                warnings.append(f"Lines {idx-2}–{idx}: 3 lines in a row with no concrete markers (numbers/names/tangibles).")
        else:
            abstract_run = 0

    # 3. Seamless Loop Check
    first_words = set(w.lower() for w in WORD_RE.findall(hook_text) if w.lower() not in STOPWORDS)
    last_text = lines[-1].get("text", "")
    last_words = set(w.lower() for w in WORD_RE.findall(last_text) if w.lower() not in STOPWORDS)
    common_loop_words = first_words.intersection(last_words)

    has_loop = len(common_loop_words) > 0
    if not has_loop:
        warnings.append(f"No loop detected: Last line '{last_text}' does not share any keyword with hook '{hook_text}'. Echoing a word creates seamless TikTok/Shorts replay.")

    # 4. Length comparison against target
    dur_diff = total_est_s - target_s

    # Print Report
    print("=" * 70)
    print(f"SCRIPT AUDIT REPORT: {script_path.name}")
    print("=" * 70)
    print(f"Total Lines:      {len(lines)} cuts")
    print(f"Total Words:      {total_words} words")
    print(f"Estimated Length: {total_est_s:.1f}s (Target: {target_s:.1f}s, Diff: {dur_diff:+.1f}s)")
    print(f"Pacing Rate:      {wpm} WPM ({wps:.2f} words/sec)")
    print("-" * 70)
    print(f"HOOK ANALYSIS (Line 0):")
    print(f"  Line:      \"{hook_text}\"")
    print(f"  Score:     {hook_res['composite']}/100 [{hook_res['verdict']}]")
    print(f"  Signals:   Len: {hook_res['signals']['length']} | Spec: {hook_res['signals']['specificity']} | Stakes: {hook_res['signals']['stakes']} | Front: {hook_res['signals']['frontload']} | You: {hook_res['signals']['address']}")
    print("-" * 70)
    print(f"LOOP INTEGRITY:")
    if has_loop:
        print(f"  [PASS] Loop words connected: {', '.join(common_loop_words)}")
    else:
        print(f"  [WARN] Open loop (no shared hook word in closing line)")
    print("-" * 70)

    if issues:
        print(f"BLOCKING ISSUES ({len(issues)}):")
        for iss in issues:
            print(f"  - [FAIL] {iss}")
    else:
        print("BLOCKING ISSUES: 0 (All gates passed)")

    if warnings:
        print(f"\nOPTIMIZATION SUGGESTIONS ({len(warnings)}):")
        for w in warnings[:8]:
            print(f"  - [OPT] {w}")
        if len(warnings) > 8:
            print(f"  ... and {len(warnings)-8} more")
    print("=" * 70)

    return len(issues) == 0


# ── CLI DISPATCHER ───────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="High-Retention Scriptwriting & Anti-Slop Tool")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # score-hook
    p_hook = subparsers.add_parser("score-hook", help="Score a single hook line")
    p_hook.add_argument("hook", type=str, help="Hook text to evaluate")

    # suggest-hooks
    p_sugg = subparsers.add_parser("suggest-hooks", help="Suggest hooks for a topic")
    p_sugg.add_argument("topic", type=str, help="Topic keywords")
    p_sugg.add_argument("--count", type=int, default=3, help="Number of formulas to suggest")

    # humanize
    p_hum = subparsers.add_parser("humanize", help="Clean text of slop and mechanical markers")
    p_hum.add_argument("input", type=str, help="File path or '-' for stdin")
    p_hum.add_argument("--report", action="store_true", help="Print detailed report")

    # detect-slop
    p_det = subparsers.add_parser("detect-slop", help="Run 5-check human detection panel")
    p_det.add_argument("input", type=str, help="File path or '-' for stdin")

    # audit-script
    p_aud = subparsers.add_parser("audit-script", help="Full audit of script.json (hooks, pacing, beats, loop)")
    p_aud.add_argument("script", type=str, help="Path to script.json")
    p_aud.add_argument("--target", type=float, default=55.0, help="Target duration in seconds")
    p_aud.add_argument("--wpm", type=float, default=165.0, help="Words per minute")

    args = parser.parse_args()

    if args.command == "score-hook":
        res = score_hook(args.hook)
        print(f"\nHook: \"{res['text']}\"")
        print(f"Score: {res['composite']}/100 [{res['verdict']}]")
        print("Signals:")
        for k, v in res["signals"].items():
            print(f"  - {k.capitalize()}: {v}")
        if res["dealbreakers"]:
            print("Dealbreakers:")
            for d in res["dealbreakers"]:
                print(f"  ! {d}")

    elif args.command == "suggest-hooks":
        items = suggest_hooks(args.topic, args.count)
        print(f"\nProven Hook Formulas for: '{args.topic}'\n" + "-" * 60)
        for i, h in enumerate(items, 1):
            print(f"#{i} {h.get('name')}")
            print(f"   Template:  {h.get('template')}")
            print(f"   Spoken:    \"{h.get('example')}\"")
            print(f"   On-Screen: \"{h.get('on_screen')}\"")
            print(f"   Best For:  {h.get('best_for')}")
            print(f"   Trap:      {h.get('trap')}")
            print()

    elif args.command == "humanize":
        content = sys.stdin.read() if args.input == "-" else open(args.input, encoding="utf-8").read()
        clean, rep = humanize_text(content)
        if args.report:
            print("\nHUMANIZE REPORT:")
            print(f"Invisible characters removed: {rep['invisible_hits']}")
            print(f"Typography normalised:        {rep['typo_hits']}")
            if rep["lexicon_hits"]:
                print("Slop lexicon substitutions:")
                for s, r, c in rep["lexicon_hits"]:
                    print(f"  - '{s}' -> '{r}' ({c}x)")
            if rep["structural_tells"]:
                print("Structural tells flagged:")
                for st in rep["structural_tells"]:
                    print(f"  - {st}")
            print("\nCleaned text:\n" + clean)
        else:
            print(clean)

    elif args.command == "detect-slop":
        content = sys.stdin.read() if args.input == "-" else open(args.input, encoding="utf-8").read()
        det = detect_human(content)
        print(f"\nHUMAN SCORE: {det['overall']}/100 [{det['verdict']}]")
        for k, v in det["signals"].items():
            print(f"  - {k.capitalize()}: {v}")

    elif args.command == "audit-script":
        ok = audit_script(args.script, args.target, args.wpm)
        sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
