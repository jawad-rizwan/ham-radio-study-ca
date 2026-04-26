# HAM Radio Study CA

A static GitHub Pages study app for the **Canadian Amateur Radio Operator Certificate - Basic Qualification**.

Live site: <https://jawad-rizwan.github.io/ham-radio-study-ca/>

## Features

- Official English Basic Qualification question bank from the Government of Canada
- 984 exact official questions and answer choices
- 100-question mock exams, one question from each RIC-3 Basic topic area
- Pass and honours scoring: 70% pass, 80% Basic with Honours range
- Detailed wrong-answer explanations tied to the RIC-3 syllabus topics
- Adaptive study mode for weak, missed, stale, and unseen questions
- Topic drills, missed-question drills, and searchable question bank
- Comprehensive study guide for the 8 major Basic syllabus areas
- Formula drills for Ohm's law, power, wavelength, dB, batteries, reactance, and metric prefixes
- Flashcards with smart review and confidence ratings
- Printable cram sheets
- Bookmarks
- Local progress storage, export/import, and reset
- Offline support after the first successful load

## Progress Storage

Progress is stored locally in the browser with the key:

```text
hamRadioStudyProgress:v1
```

Nothing is uploaded by the app. Clearing browser site data, switching browsers, or using another device can hide or remove saved progress. Use the Progress page to export a backup file.

## Local Development

This is a no-build static site. Serve the repository root with any static file server:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

Opening `index.html` directly from the filesystem is not recommended because the app loads JSON data with `fetch`.

## Rebuilding Study Data

The generated JSON files in `data/` are built from the official delimited question bank and local app-authored study material:

```bash
python3 tools/build_data.py
```

The script expects the official bank at:

```text
/mnt/c/Users/jawad/Desktop/HAM Radio Exam Information/amat_basic_quest/amat_basic_quest_delim.txt
```

## Official Content Source

Question text and official answers are parsed from:

- **Basic Qualification Question Bank for Amateur Radio Operator Certificate Examinations**, Innovation, Science and Economic Development Canada, 26 August 2025

Study guide material, explanations, flashcards, formulas, and cram sheets are independent study aids derived from:

- **RIC-3**, Information on the Amateur Radio Service, Issue 5, March 2022
- **RBR-4**, Standards for the Operation of Radio Stations in the Amateur Radio Service, Issue 3, July 2022
- **RIC-9**, Call Sign Policy and Special Event Prefixes

This project is not affiliated with or endorsed by Innovation, Science and Economic Development Canada or the Government of Canada.

## Deployment

The GitHub Actions workflow deploys the repository root to GitHub Pages on every push to `master`.

## License

MIT License. See [LICENSE](LICENSE).
