#!/usr/bin/env python3
import csv
import html
import json
import re
import subprocess
import sys
from collections import defaultdict
from pathlib import Path
from xml.etree import ElementTree as ET


REPO_ROOT = Path(__file__).resolve().parents[1]
PDF_BANK = Path("/mnt/c/Users/jawad/Desktop/HAM Radio Exam Information/amateur_basic_questions_en.pdf")
TXT_BANK = Path("/mnt/c/Users/jawad/Desktop/HAM Radio Exam Information/amat_basic_quest/amat_basic_quest_delim.txt")
REPORT_PATH = REPO_ROOT / "data" / "bank-comparison-report.json"
HEADER_RE = re.compile(r"^(B-\d{3}-\d{3}-\d{3})\s+\(([A-D])\)$")
CHOICE_RE = re.compile(r"^([A-D])\s+(.+)$")


def normalize(value):
    value = html.unescape(str(value))
    value = value.replace("\u2019", "'").replace("\u2018", "'")
    value = value.replace("\u201c", '"').replace("\u201d", '"')
    value = value.replace("\u2013", "-").replace("\u2014", "-")
    value = value.replace("\u00a0", " ")
    value = re.sub(r"-\s+", "-", value)
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def material_normalize(value):
    return normalize(value).replace('"', "")


def load_txt_records():
    records = {}
    with TXT_BANK.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle, delimiter=";")
        for raw in reader:
            row = {key.strip(): value.strip() for key, value in raw.items()}
            qid = row["question_id"]
            choices = [
                row["correct_answer_english"],
                row["incorrect_answer_1_english"],
                row["incorrect_answer_2_english"],
                row["incorrect_answer_3_english"],
            ]
            records[qid] = {
                "id": qid,
                "question": row["question_english"],
                "correct_answer": row["correct_answer_english"],
                "choices": choices,
            }
    return records


def run_pdftotext_bbox():
    try:
        completed = subprocess.run(
            ["pdftotext", "-bbox-layout", str(PDF_BANK), "-"],
            check=True,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
    except FileNotFoundError:
        raise SystemExit("pdftotext is required but was not found in PATH")
    except subprocess.CalledProcessError as error:
        raise SystemExit(error.stderr or "pdftotext failed")
    return completed.stdout


def parse_pdf_words():
    xml_text = run_pdftotext_bbox()
    root = ET.fromstring(xml_text)
    pages = []
    for page in root.findall(".//{http://www.w3.org/1999/xhtml}page"):
        words = []
        for word in page.findall(".//{http://www.w3.org/1999/xhtml}word"):
            words.append({
                "x": float(word.attrib["xMin"]),
                "y": float(word.attrib["yMin"]),
                "text": normalize(word.text or ""),
            })
        pages.append(words)
    return pages


def lines_for_column(words):
    rows = []
    for word in sorted(words, key=lambda item: (item["y"], item["x"])):
        if not word["text"]:
            continue
        for row in rows:
            if abs(row["y"] - word["y"]) <= 2.2:
                row["words"].append(word)
                row["y"] = min(row["y"], word["y"])
                break
        else:
            rows.append({"y": word["y"], "words": [word]})
    lines = []
    for row in sorted(rows, key=lambda item: item["y"]):
        sorted_words = sorted(row["words"], key=lambda item: item["x"])
        line = normalize(" ".join(word["text"] for word in sorted_words))
        if line:
            lines.append({
                "text": line,
                "words": sorted_words,
            })
    return lines


def parse_column_records(lines):
    records = {}
    current = None

    def finish():
        if not current:
            return
        parsed = parse_record_body(current["id"], current["answer_letter"], current["lines"])
        records[parsed["id"]] = parsed

    for line in lines:
        text = line["text"]
        header = HEADER_RE.match(text)
        if header:
            finish()
            current = {"id": header.group(1), "answer_letter": header.group(2), "lines": []}
            continue
        if current:
            current["lines"].append(line)
    finish()
    return records


def is_choice_line(line):
    words = line["words"]
    if not words or words[0]["text"] not in {"A", "B", "C", "D"}:
        return False
    if words[0]["x"] > 35 and words[0]["x"] < 250:
        return False
    if words[0]["x"] > 270:
        return False
    if len(words) == 1:
        return True
    return (words[1]["x"] - words[0]["x"]) > 12


def parse_record_body(qid, answer_letter, lines):
    question_lines = []
    choices = defaultdict(list)
    current_choice = None
    for line in lines:
        text = line["text"]
        if is_choice_line(line):
            current_choice = line["words"][0]["text"]
            rest = normalize(" ".join(word["text"] for word in line["words"][1:]))
            if rest:
                choices[current_choice].append(rest)
        elif current_choice:
            choices[current_choice].append(text)
        else:
            question_lines.append(text)
    parsed_choices = {letter: normalize(" ".join(choices[letter])) for letter in "ABCD"}
    missing = [letter for letter, value in parsed_choices.items() if not value]
    if missing:
        raise ValueError(f"{qid} missing choices {missing}: {lines}")
    return {
        "id": qid,
        "question": normalize(" ".join(question_lines)),
        "answer_letter": answer_letter,
        "correct_answer": parsed_choices[answer_letter],
        "choices": [parsed_choices[letter] for letter in "ABCD"],
    }


def load_pdf_records():
    pages = parse_pdf_words()
    records = {}
    for words in pages:
        if not any(re.match(r"B-\d{3}-\d{3}-\d{3}", word["text"]) for word in words):
            continue
        left_words = [word for word in words if word["x"] < 245]
        right_words = [word for word in words if word["x"] >= 245]
        for column_words in (left_words, right_words):
            column_records = parse_column_records(lines_for_column(column_words))
            overlap = set(records).intersection(column_records)
            if overlap:
                raise ValueError(f"Duplicate PDF records: {sorted(overlap)[:5]}")
            records.update(column_records)
    return records


def compare_records(txt_records, pdf_records, normalizer=normalize):
    mismatches = []
    txt_ids = set(txt_records)
    pdf_ids = set(pdf_records)
    for qid in sorted(txt_ids - pdf_ids):
        mismatches.append({"id": qid, "kind": "missing_in_pdf"})
    for qid in sorted(pdf_ids - txt_ids):
        mismatches.append({"id": qid, "kind": "missing_in_txt"})

    for qid in sorted(txt_ids & pdf_ids):
        txt = txt_records[qid]
        pdf = pdf_records[qid]
        if normalizer(txt["question"]) != normalizer(pdf["question"]):
            mismatches.append({
                "id": qid,
                "kind": "question_text",
                "txt": txt["question"],
                "pdf": pdf["question"],
            })
        if normalizer(txt["correct_answer"]) != normalizer(pdf["correct_answer"]):
            mismatches.append({
                "id": qid,
                "kind": "correct_answer",
                "txt": txt["correct_answer"],
                "pdf": pdf["correct_answer"],
                "pdf_answer_letter": pdf["answer_letter"],
            })
        txt_choices = sorted(normalizer(choice) for choice in txt["choices"])
        pdf_choices = sorted(normalizer(choice) for choice in pdf["choices"])
        if txt_choices != pdf_choices:
            mismatches.append({
                "id": qid,
                "kind": "choice_set",
                "txt": txt["choices"],
                "pdf": pdf["choices"],
            })
    return mismatches


def main():
    txt_records = load_txt_records()
    pdf_records = load_pdf_records()
    strict_mismatches = compare_records(txt_records, pdf_records, normalize)
    material_mismatches = compare_records(txt_records, pdf_records, material_normalize)
    report = {
        "pdf": str(PDF_BANK),
        "txt": str(TXT_BANK),
        "txt_records": len(txt_records),
        "pdf_records": len(pdf_records),
        "matched_records": len(set(txt_records) & set(pdf_records)),
        "strict_mismatch_count": len(strict_mismatches),
        "material_mismatch_count": len(material_mismatches),
        "strict_mismatches": strict_mismatches[:50],
        "material_mismatches": material_mismatches[:50],
    }
    REPORT_PATH.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"TXT records: {len(txt_records)}")
    print(f"PDF records: {len(pdf_records)}")
    print(f"Matched IDs: {report['matched_records']}")
    print(f"Strict punctuation/text mismatches: {len(strict_mismatches)}")
    print(f"Material mismatches ignoring quote-only punctuation: {len(material_mismatches)}")
    print(f"Report: {REPORT_PATH}")
    if material_mismatches:
        for item in material_mismatches[:10]:
            print(f"{item['id']}: {item['kind']}", file=sys.stderr)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
