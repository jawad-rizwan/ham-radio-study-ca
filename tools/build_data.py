#!/usr/bin/env python3
import csv
import json
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = REPO_ROOT / "data"
SOURCE_BANK = Path("/mnt/c/Users/jawad/Desktop/HAM Radio Exam Information/amat_basic_quest/amat_basic_quest_delim.txt")


MAJOR_TOPICS = {
    "B-001": {
        "slug": "regulations",
        "title": "Regulations and Policies",
        "short_title": "Regulations",
        "color": "#2563eb",
        "summary": "Licensing, certificates, station identification, operating limits, interference, international operation, RF exposure, and land-use rules.",
    },
    "B-002": {
        "slug": "operating",
        "title": "Operating and Procedures",
        "short_title": "Operating",
        "color": "#059669",
        "summary": "Voice, CW, repeater, simplex, emergency, logging, signal reports, Q signals, and courteous operating procedures.",
    },
    "B-003": {
        "slug": "station",
        "title": "Station Assembly, Practice and Safety",
        "short_title": "Station and Safety",
        "color": "#dc2626",
        "summary": "Station blocks, transmitters, receivers, power supplies, digital systems, batteries, antennas, electrical safety, and RF safety.",
    },
    "B-004": {
        "slug": "components",
        "title": "Circuit Components",
        "short_title": "Components",
        "color": "#7c3aed",
        "summary": "Amplifiers, diodes, bipolar transistors, field-effect transistors, vacuum tubes, and resistor colour codes.",
    },
    "B-005": {
        "slug": "theory",
        "title": "Basic Electronics and Theory",
        "short_title": "Electronics",
        "color": "#ca8a04",
        "summary": "Metric prefixes, current, voltage, resistance, power, Ohm's law, AC, decibels, capacitance, inductance, resonance, and measurement.",
    },
    "B-006": {
        "slug": "antennas",
        "title": "Feedlines and Antenna Systems",
        "short_title": "Antennas",
        "color": "#0891b2",
        "summary": "Feedline impedance, coax, balanced lines, baluns, line loss, SWR, matching, polarization, wavelength, gain, verticals, Yagis, wires, and loops.",
    },
    "B-007": {
        "slug": "propagation",
        "title": "Radio Wave Propagation",
        "short_title": "Propagation",
        "color": "#9333ea",
        "summary": "Line-of-sight, ground wave, sky wave, ionosphere, skip, solar activity, MF/HF/VHF/UHF propagation, aurora, ducting, and scatter.",
    },
    "B-008": {
        "slug": "interference",
        "title": "Interference and Suppression",
        "short_title": "Interference",
        "color": "#ea580c",
        "summary": "Front-end overload, cross-modulation, audio rectification, ferrites, intermodulation, spurious emissions, key clicks, harmonics, splatter, and filters.",
    },
}


TOPIC_NAMES = {
    "B-001": [
        "Radio licences, applicability, eligibility of licence holder",
        "Licence fee, term, posting requirements, change of address",
        "Licence suspension or revocation, powers of radio inspectors, offences and punishments",
        "Operator certificates, applicability, eligibility, equivalents, reciprocal recognition",
        "Operation, repair and maintenance of radio apparatus on behalf of other persons",
        "Operation of radio apparatus, terms of licence, applicable standards, exempt apparatus",
        "Content restrictions: non-superfluous, profanity, secret code, music, non-commercial",
        "Installation and operating restrictions: number of stations, repeaters, home-built, club stations",
        "Participation in communications by visitors, use of station by others",
        "Interference, determination, protection from interference",
        "Emergency communications, simulated emergencies, communication with non-amateur stations",
        "Non-remuneration and privacy of communications",
        "Station identification, call signs, prefixes",
        "Foreign amateur operation in Canada, banned countries, third-party messages",
        "Frequency bands and qualification requirements",
        "Maximum bandwidth by frequency bands",
        "Restrictions on capacity and power output by qualifications",
        "Unmodulated carriers and retransmission",
        "Amplitude modulation, frequency stability, measurements",
        "International Telecommunication Union Radio Regulations, applicability",
        "Operation outside Canada, ITU regions, reciprocal privileges, international licences",
        "Examinations, delegated examinations, disabled accommodation",
        "Antenna structure approval, neighbour and land-use authority consultation",
        "Radio frequency electromagnetic field limits",
        "Criteria for resolution of radio frequency interference complaints",
    ],
    "B-002": [
        "Voice operating procedures: channelized VHF/UHF repeater",
        "Phonetic alphabet",
        "Voice operating procedures: simplex VHF/UHF and HF",
        "Tuneups and testing, use of dummy load, courteous operation",
        "Morse CW operating procedures, procedural signs",
        "RST system of signal reporting, use of S meter",
        "Q signals",
        "Emergency operating procedures",
        "Record keeping, confirmation practices, maps/charts, antenna orientation",
    ],
    "B-003": [
        "Functional layout of HF stations",
        "Functional layout of FM transmitters",
        "Functional layout of FM receivers",
        "Functional layout of CW transmitters",
        "Functional layout of SSB/CW receivers",
        "Functional layout of SSB transmitters",
        "Functional layout of digital systems",
        "Functional layout of regulated power supplies",
        "Functional layout of Yagi-Uda antennas",
        "Receiver fundamentals",
        "Transmitter, carrier, keying, and amplitude modulation fundamentals",
        "Carrier suppression and SSB fundamentals",
        "Frequency and phase modulation fundamentals",
        "Station accessories for telegraphy, radiotelephony, digital modes",
        "Digital mode fundamentals: RTTY, ASCII, AMTOR, packet",
        "Cells and batteries: types, ratings, charging",
        "Power supply fundamentals",
        "Electrical hazards, electrical safety, security",
        "Electrical safety ground, capacitor discharge, fuse replacement",
        "Antenna and tower safety, lightning protection",
        "Exposure of human body to RF, safety precautions",
    ],
    "B-004": [
        "Amplifier fundamentals",
        "Diode fundamentals",
        "Bipolar transistor fundamentals",
        "Field-effect transistor fundamentals",
        "Triode vacuum tube fundamentals",
        "Resistor colour codes, tolerances, temperature coefficient",
    ],
    "B-005": [
        "Metric prefixes: pico, micro, milli, centi, kilo, mega, giga",
        "Concepts of current, voltage, conductor, insulator, resistance",
        "Concepts of energy and power, open and short circuits",
        "Ohm's law: single resistors",
        "Series and parallel resistors",
        "Power law, resistor power dissipation",
        "AC, sinewave, frequency, frequency units",
        "Ratios, logarithms, decibels",
        "Introduction to inductance and capacitance",
        "Introduction to reactance and impedance",
        "Introduction to magnetics and transformers",
        "Introduction to resonance and tuned circuits",
        "Introduction to meters and measurements",
    ],
    "B-006": [
        "Feed line characteristics, characteristic impedance",
        "Balanced and unbalanced feed lines, baluns",
        "Popular antenna feed line and coaxial connector types",
        "Line losses by line type, length and frequency",
        "Standing waves, standing wave ratio meter",
        "Concept of impedance matching",
        "Isotropic source, polarization via element orientation",
        "Wavelength vs physical length",
        "Gain, directivity, radiation pattern, antenna bandwidth",
        "Vertical antennas: types, dimensions, characteristics",
        "Yagi antennas: types, dimensions, characteristics",
        "Wire antennas: types, dimensions, characteristics",
        "Quad/loop antennas: types, dimensions, characteristics",
    ],
    "B-007": [
        "Line of sight, ground wave, ionospheric wave",
        "Ionosphere and ionospheric regions",
        "Propagation hops, skip zone, skip distance",
        "Ionospheric absorption, causes and variation, fading, phase shift, Faraday rotation",
        "Solar activity, sunspots, sunspot cycle",
        "MF and HF, critical and maximum usable frequencies, solar flux",
        "VHF and UHF, sporadic-E, aurora, ducting",
        "Scatter: HF, VHF, UHF",
    ],
    "B-008": [
        "Front-end overload, cross-modulation",
        "Audio rectification, bypass capacitors, ferrites",
        "Intermodulation, spurious emissions, key clicks",
        "Harmonics, splatter, transmitter adjustments",
        "Use of filters: low-pass, high-pass, band-pass, band-reject",
    ],
}


MAJOR_REVIEW_NOTES = {
    "B-001": "For regulation questions, memorize exact legal documents, powers, prohibitions, privileges, limits, and time/frequency values. Many distractors are plausible because they name a real radio concept but not the rule asked.",
    "B-002": "For operating procedure questions, focus on standard amateur practice: concise calls, correct identification, signal reports, Q signals, repeater/simplex behaviour, and emergency priority.",
    "B-003": "For station and safety questions, think in block diagrams and hazards. Identify what each stage does, what failure mode is dangerous, and which safety practice removes the risk.",
    "B-004": "For component questions, identify the device, the terminals, the direction or control mechanism, and the normal job of the component in a circuit.",
    "B-005": "For electronics theory questions, write the relationship first, keep units straight, and check whether the question asks for voltage, current, resistance, power, frequency, ratio, or a measurement concept.",
    "B-006": "For antenna and feedline questions, keep impedance, loss, wavelength, polarization, radiation pattern, matching, and standing-wave behaviour separate.",
    "B-007": "For propagation questions, first identify the frequency range and path: line of sight, ground wave, sky wave, ionospheric layer, solar condition, or special VHF/UHF mode.",
    "B-008": "For interference questions, separate receiver overload, audio rectification, transmitter harmonics, spurious emissions, splatter, key clicks, and the filters used to reduce them.",
}


def slugify(value):
    return "".join(ch.lower() if ch.isalnum() else "-" for ch in value).strip("-").replace("--", "-")


def topic_note(major_id, section_title):
    return f"{MAJOR_REVIEW_NOTES[major_id]} This specific topic is {section_title.lower()}."


def build_topics():
    sections = []
    for major_id, names in TOPIC_NAMES.items():
        for index, title in enumerate(names, start=1):
            section_id = f"{major_id}-{index:03d}"
            sections.append({
                "id": section_id,
                "major_id": major_id,
                "major_slug": MAJOR_TOPICS[major_id]["slug"],
                "major_title": MAJOR_TOPICS[major_id]["title"],
                "number": f"{int(major_id.split('-')[1])}-{index}",
                "title": title,
                "slug": slugify(f"{section_id}-{title}"),
                "study_note": topic_note(major_id, title),
            })
    return {
        "version": "1.0",
        "source": "RIC-3, Information on the Amateur Radio Service, Issue 5, March 2022",
        "major_topics": [{"id": key, **value} for key, value in MAJOR_TOPICS.items()],
        "sections": sections,
    }


def normalize_header(row):
    return {key.strip(): value.strip() for key, value in row.items()}


def build_questions(topics):
    section_lookup = {section["id"]: section for section in topics["sections"]}
    questions = []
    with SOURCE_BANK.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle, delimiter=";")
        for raw_row in reader:
            row = normalize_header(raw_row)
            qid = row["question_id"]
            parts = qid.split("-")
            major_id = "-".join(parts[:2])
            section_id = "-".join(parts[:3])
            section = section_lookup[section_id]
            choices = [
                row["correct_answer_english"],
                row["incorrect_answer_1_english"],
                row["incorrect_answer_2_english"],
                row["incorrect_answer_3_english"],
            ]
            questions.append({
                "id": qid,
                "question": row["question_english"],
                "choices": choices,
                "correct_index": 0,
                "correct_answer": choices[0],
                "incorrect_answers": choices[1:],
                "major_id": major_id,
                "major_slug": section["major_slug"],
                "major_title": section["major_title"],
                "section_id": section_id,
                "section_number": section["number"],
                "section_title": section["title"],
                "source": "Official Government of Canada Basic Qualification question bank",
            })
    return {
        "version": "2025-08-26",
        "source": "Basic Qualification Question Bank for Amateur Radio Operator Certificate Examinations, Innovation, Science and Economic Development Canada, 26 August 2025",
        "language": "en",
        "questions": questions,
    }


def build_explanations(questions, topics):
    section_lookup = {section["id"]: section for section in topics["sections"]}
    explanations = {}
    for question in questions["questions"]:
        section = section_lookup[question["section_id"]]
        correct = question["correct_answer"]
        explanations[question["id"]] = {
            "question_id": question["id"],
            "summary": f"The official answer is \"{correct}\".",
            "detail": (
                f"This question is from {section['number']}: {section['title']}. "
                f"{section['study_note']} The safest way to review it is to connect the wording of the question "
                f"to the exact rule, procedure, component, formula, or operating concept being tested, then eliminate "
                f"answers that belong to a different topic or change a required value."
            ),
            "wrong_answer_guidance": (
                "If your selected answer was one of the distractors, compare it directly with the official answer. "
                "The distractor may be a real radio term or number, but it is not the response required for this exact question."
            ),
            "guide_module": question["major_slug"],
            "reference_query": section["title"],
        }
    return {
        "version": "1.0",
        "source": "App-authored explanations derived from the official syllabus and question bank.",
        "explanations": explanations,
    }


def build_guide():
    modules = [
        {
            "id": "regulations",
            "title": "Regulations and Policies",
            "description": "The legal and administrative rules behind the Basic Qualification.",
            "major_id": "B-001",
            "sections": [
                {
                    "type": "text",
                    "title": "What the Basic Qualification authorizes",
                    "content": "Authority to operate in the amateur radio service is issued through the Amateur Radio Operator Certificate with Basic Qualification. The Basic exam is the entry point. A pass is 70 percent, and a score of 80 percent or higher grants Basic with Honours privileges, including access to amateur bands below 30 MHz under RBR-4.",
                },
                {
                    "type": "key_points",
                    "title": "Exam facts",
                    "points": [
                        "The Basic examination has 100 questions.",
                        "The exam is built by drawing one question from each of the 100 RIC-3 Basic topic areas.",
                        "The pass mark is 70 percent.",
                        "A score of 80 percent or higher grants Basic with Honours privileges.",
                        "RIC-3 specifies no fixed time limit; most exams are completed within one hour and normally not more than two hours.",
                        "Examinations are closed book.",
                    ],
                },
                {
                    "type": "text",
                    "title": "Rules, privileges and limits",
                    "content": "Regulation questions often turn on exact wording. Know which document gives authority, who administers the Act, what must be retained or produced, when a change of address must be reported, what transmissions are prohibited, and which qualifications unlock which privileges. Basic operators have access to amateur bands above 30 MHz, may use 250 W DC input power, may assemble commercially available transmitter kits of professional design, may reprogram equipment by computer program for amateur-band operation, and may use repeaters. Advanced and Morse qualifications add further privileges.",
                },
                {
                    "type": "table",
                    "title": "Qualification summary",
                    "columns": ["Qualification", "High-yield privileges"],
                    "rows": [
                        ["Basic", "All amateur bands above 30 MHz; 250 W DC input; commercial kit assembly; computer reprogramming for amateur bands; repeater operation."],
                        ["Basic with Honours", "Basic privileges plus access to all amateur bands below 30 MHz."],
                        ["Morse Code with Basic", "Access to all amateur bands."],
                        ["Advanced", "Below-30 MHz access, 1000 W DC input, build/modify transmitters, establish repeaters and club stations, remote control fixed stations."],
                    ],
                },
                {
                    "type": "text",
                    "title": "Call signs and identification",
                    "content": "A Canadian call sign is assigned using the prefix for the operator's Canadian address. Station identification rules, prefix areas, special-event prefixes, and foreign operation rules are frequent exam targets. For call sign questions, identify whether the question is asking about prefix area, suffix eligibility, station identification timing, special events, or operation by visitors.",
                },
            ],
        },
        {
            "id": "operating",
            "title": "Operating and Procedures",
            "description": "On-air procedure, repeaters, simplex, CW, signal reports, Q signals and emergencies.",
            "major_id": "B-002",
            "sections": [
                {
                    "type": "text",
                    "title": "Clear operating habits",
                    "content": "Good amateur procedure is concise, identifiable and courteous. Listen before transmitting, identify correctly, use standard phonetics when spelling, keep tuneups brief, use a dummy load where possible, and choose the appropriate mode and frequency for the contact. Repeater questions often test offset, courtesy tones, time-out timers, and why a short pause between transmissions matters.",
                },
                {
                    "type": "table",
                    "title": "Common Q signals",
                    "columns": ["Signal", "Meaning as a question or statement"],
                    "rows": [
                        ["QRL", "Is this frequency in use? / This frequency is in use."],
                        ["QRM", "Man-made interference."],
                        ["QRN", "Natural static/noise interference."],
                        ["QRP", "Reduce power / low power operation."],
                        ["QRS", "Send more slowly."],
                        ["QRT", "Stop sending."],
                        ["QRZ", "Who is calling me?"],
                        ["QSL", "Can you acknowledge receipt? / I acknowledge receipt."],
                        ["QSY", "Change frequency."],
                        ["QTH", "Location."],
                    ],
                },
                {
                    "type": "key_points",
                    "title": "Emergency priorities",
                    "points": [
                        "Emergency communications may involve non-amateur stations when immediate safety requires it.",
                        "A false or fraudulent distress signal is prohibited.",
                        "In an emergency, the communication should be brief, clear, and directed at getting assistance.",
                        "Simulated emergency tests must not mislead other stations into believing a real emergency exists.",
                    ],
                },
            ],
        },
        {
            "id": "station",
            "title": "Station Assembly, Practice and Safety",
            "description": "How station blocks work and how to avoid electrical, tower and RF hazards.",
            "major_id": "B-003",
            "sections": [
                {
                    "type": "text",
                    "title": "Station block diagrams",
                    "content": "Most station-layout questions ask what a stage does or where it belongs. Transmitters generate, modulate, amplify and filter RF before it reaches the antenna system. Receivers select, amplify, mix, detect/demodulate and recover audio or data. Power supplies convert AC or DC into regulated voltages, while accessories such as keyers, microphones, TNCs, filters, meters and tuners support the operating mode.",
                },
                {
                    "type": "key_points",
                    "title": "Safety rules",
                    "points": [
                        "Disconnect power before servicing equipment.",
                        "High-voltage capacitors can remain charged after power is removed; discharge them safely.",
                        "Use the correct fuse rating. Never install a larger fuse to stop nuisance blowing.",
                        "Grounding reduces shock risk and helps control static and lightning effects.",
                        "Keep people away from energized antennas and observe RF exposure limits.",
                        "Tower and antenna work requires fall protection, safe distances from power lines, and weather awareness.",
                    ],
                },
            ],
        },
        {
            "id": "components",
            "title": "Circuit Components",
            "description": "The parts used in amateur radio circuits and what they do.",
            "major_id": "B-004",
            "sections": [
                {
                    "type": "text",
                    "title": "Component recognition",
                    "content": "Component questions usually test a device's purpose, terminals or behaviour. Diodes conduct mainly in one direction and are used for rectification and switching. Bipolar transistors are current-controlled devices with emitter, base and collector. Field-effect transistors are voltage-controlled devices with source, gate and drain. Vacuum tubes such as triodes use cathode, grid and plate. Amplifiers increase voltage, current or power, but can distort or oscillate if biased or driven incorrectly.",
                },
                {
                    "type": "table",
                    "title": "Resistor colour digits",
                    "columns": ["Colour", "Digit"],
                    "rows": [
                        ["Black", "0"],
                        ["Brown", "1"],
                        ["Red", "2"],
                        ["Orange", "3"],
                        ["Yellow", "4"],
                        ["Green", "5"],
                        ["Blue", "6"],
                        ["Violet", "7"],
                        ["Grey", "8"],
                        ["White", "9"],
                    ],
                },
            ],
        },
        {
            "id": "theory",
            "title": "Basic Electronics and Theory",
            "description": "The formulas and concepts behind voltage, current, resistance, power and resonance.",
            "major_id": "B-005",
            "sections": [
                {
                    "type": "text",
                    "title": "Solving calculation questions",
                    "content": "Start by identifying the unknown. Ohm's law is E = I x R, so I = E / R and R = E / I. Power can be found with P = E x I, P = I squared x R, or P = E squared / R. Keep units consistent before calculating. Many wrong answers result from mixing milliamps with amps, kilohms with ohms, or using the right formula in the wrong direction.",
                },
                {
                    "type": "table",
                    "title": "Metric prefixes",
                    "columns": ["Prefix", "Symbol", "Multiplier"],
                    "rows": [
                        ["pico", "p", "0.000000000001"],
                        ["micro", "u", "0.000001"],
                        ["milli", "m", "0.001"],
                        ["centi", "c", "0.01"],
                        ["kilo", "k", "1000"],
                        ["mega", "M", "1000000"],
                        ["giga", "G", "1000000000"],
                    ],
                },
                {
                    "type": "key_points",
                    "title": "Resonance and reactance",
                    "points": [
                        "Inductive reactance rises as frequency rises.",
                        "Capacitive reactance falls as frequency rises.",
                        "Resonance occurs when inductive and capacitive reactance are equal in magnitude.",
                        "A tuned circuit can select or reject a range of frequencies.",
                    ],
                },
            ],
        },
        {
            "id": "antennas",
            "title": "Feedlines and Antenna Systems",
            "description": "Transmission lines, SWR, impedance matching and common antenna types.",
            "major_id": "B-006",
            "sections": [
                {
                    "type": "text",
                    "title": "Feedlines and matching",
                    "content": "A feedline transfers RF between the transmitter and antenna. Coaxial cable is unbalanced and commonly 50 ohms in amateur stations. Open-wire and ladder line are balanced. A balun connects balanced and unbalanced systems. High SWR indicates a mismatch; it does not mean power disappears, but it can increase line loss and stress equipment. An antenna tuner matches impedances so the transmitter sees a suitable load.",
                },
                {
                    "type": "text",
                    "title": "Wavelength and antenna length",
                    "content": "Wavelength in metres is approximately 300 divided by frequency in MHz. A half-wave dipole is roughly one-half wavelength long overall, and each side is about one-quarter wavelength. Real antennas are shortened by end effects and environment, so exam answers often use approximate textbook relationships.",
                },
            ],
        },
        {
            "id": "propagation",
            "title": "Radio Wave Propagation",
            "description": "How radio waves move through ground, air and ionosphere.",
            "major_id": "B-007",
            "sections": [
                {
                    "type": "text",
                    "title": "Choosing the propagation model",
                    "content": "Line-of-sight dominates VHF and UHF. Ground wave follows the earth but is strongest at lower frequencies. Sky wave uses the ionosphere and is central to HF. The D layer absorbs, especially during daylight. E and F layers can refract signals. Solar activity, time of day, season and frequency determine whether a band is open.",
                },
                {
                    "type": "key_points",
                    "title": "High-yield terms",
                    "points": [
                        "Skip zone: area between the end of ground-wave coverage and the first sky-wave return.",
                        "MUF: maximum usable frequency for a path.",
                        "Critical frequency: highest frequency returned vertically by an ionospheric layer.",
                        "Sporadic-E: VHF propagation caused by dense E-layer patches.",
                        "Aurora: VHF propagation using ionized auroral regions, often distorted.",
                        "Ducting: VHF/UHF propagation through atmospheric layers.",
                    ],
                },
            ],
        },
        {
            "id": "interference",
            "title": "Interference and Suppression",
            "description": "How interference is created, diagnosed and reduced.",
            "major_id": "B-008",
            "sections": [
                {
                    "type": "text",
                    "title": "Diagnosing interference",
                    "content": "Identify whether the unwanted signal is caused by the receiver, the transmitter, or external wiring acting as an antenna. Front-end overload and cross-modulation happen in receivers. Audio rectification happens when RF is detected in audio wiring. Harmonics and spurious emissions come from transmitters. Splatter is often caused by overmodulation or overdriven stages.",
                },
                {
                    "type": "table",
                    "title": "Filter choices",
                    "columns": ["Filter", "Use"],
                    "rows": [
                        ["Low-pass", "Passes lower frequencies, attenuates higher frequencies; common at transmitter outputs to reduce harmonics."],
                        ["High-pass", "Passes higher frequencies, attenuates lower frequencies; can help protect TV receivers from HF energy."],
                        ["Band-pass", "Passes a selected range and rejects energy outside it."],
                        ["Band-reject/notch", "Rejects a selected frequency or range while passing others."],
                    ],
                },
            ],
        },
    ]
    return {"version": "1.0", "source": "Study guide derived from RIC-3, RBR-4, RIC-9 and the official Basic question bank.", "modules": modules}


def build_course():
    def sections(*ids):
        return list(ids)

    source_links = {
        "question_bank": {
            "label": "Official Basic question bank",
            "url": "https://ised-isde.canada.ca/site/amateur-radio-operator-certificate-services/en/amateur-radio-exam-generator/print-all-basic-questions",
        },
        "ric3": {
            "label": "RIC-3 amateur radio information",
            "url": "https://ised-isde.canada.ca/site/spectrum-management-telecommunications/en/node/41",
        },
        "rbr4": {
            "label": "RBR-4 station operation standards",
            "url": "https://ised-isde.canada.ca/site/spectrum-management-telecommunications/en/licences-and-certificates/regulations-reference-rbr/rbr-4-standards-operation-radio-stations-amateur-radio-service",
        },
        "ric9": {
            "label": "RIC-9 call sign policy",
            "url": "https://ised-isde.canada.ca/site/spectrum-management-telecommunications/en/licences-and-certificates/radiocom-information-circulars-ric/ric-9-call-sign-policy-and-special-event-prefixes",
        },
    }

    units = [
        {
            "id": "unit-01-regulations-i",
            "order": 1,
            "title": "Regulations I",
            "description": "Licensing authority, certificate validity, fees, address changes and eligibility.",
            "guide_module": "regulations",
            "section_ids": sections("B-001-001", "B-001-002", "B-001-003", "B-001-004"),
            "source_keys": ["ric3", "question_bank"],
            "study_tasks": ["Read the regulation guide summary.", "Drill sections 1-1 through 1-4.", "Bookmark every exact-value question you miss."],
        },
        {
            "id": "unit-02-regulations-ii",
            "order": 2,
            "title": "Regulations II",
            "description": "Operation on behalf of others, apparatus standards, content restrictions and station limits.",
            "guide_module": "regulations",
            "section_ids": sections("B-001-005", "B-001-006", "B-001-007", "B-001-008"),
            "source_keys": ["ric3", "rbr4", "question_bank"],
            "study_tasks": ["Separate Basic privileges from Advanced privileges.", "Review prohibited content and non-commercial operation.", "Drill the unit until you can explain why each distractor is wrong."],
        },
        {
            "id": "unit-03-guidelines-i",
            "order": 3,
            "title": "Guidelines I",
            "description": "Visitors, interference, emergency communications and privacy/non-remuneration.",
            "guide_module": "regulations",
            "section_ids": sections("B-001-009", "B-001-010", "B-001-011", "B-001-012"),
            "source_keys": ["ric3", "question_bank"],
            "study_tasks": ["Learn the emergency exceptions.", "Memorize privacy and non-remuneration limits.", "Run a section drill for interference rules."],
        },
        {
            "id": "unit-04-guidelines-ii",
            "order": 4,
            "title": "Guidelines II",
            "description": "Identification, prefixes, foreign operation, bands, bandwidth and power restrictions.",
            "guide_module": "regulations",
            "section_ids": sections("B-001-013", "B-001-014", "B-001-015", "B-001-016", "B-001-017"),
            "source_keys": ["ric3", "rbr4", "ric9", "question_bank"],
            "study_tasks": ["Review call sign prefixes.", "Use the cram sheet for qualification privileges.", "Drill bands and bandwidth questions."],
        },
        {
            "id": "unit-05-policies-i",
            "order": 5,
            "title": "Policies I",
            "description": "Unmodulated carriers, retransmission, AM, frequency stability and ITU rules.",
            "guide_module": "regulations",
            "section_ids": sections("B-001-018", "B-001-019", "B-001-020", "B-001-021"),
            "source_keys": ["ric3", "rbr4", "question_bank"],
            "study_tasks": ["Treat ITU-region and operation-outside-Canada questions as exact-rule questions.", "Drill until the country/region distractors are easy to eliminate."],
        },
        {
            "id": "unit-06-policies-ii",
            "order": 6,
            "title": "Policies II",
            "description": "Exams, antenna consultation, RF exposure and interference complaint criteria.",
            "guide_module": "regulations",
            "section_ids": sections("B-001-022", "B-001-023", "B-001-024", "B-001-025"),
            "source_keys": ["ric3", "rbr4", "question_bank"],
            "study_tasks": ["Memorize pass and honours thresholds.", "Review RF exposure and antenna consultation triggers.", "Drill all remaining B-001 policy sections."],
        },
        {
            "id": "unit-07-policies-iii",
            "order": 7,
            "title": "Policies III Review",
            "description": "Cumulative regulation review with emphasis on weak and bookmarked questions.",
            "guide_module": "regulations",
            "section_ids": sections("B-001-001", "B-001-002", "B-001-013", "B-001-017", "B-001-022", "B-001-024"),
            "source_keys": ["ric3", "rbr4", "ric9", "question_bank"],
            "study_tasks": ["Run adaptive study.", "Review bookmarked regulation questions.", "Take a custom B-001 practice set."],
        },
        {
            "id": "unit-08-routine-operations-i",
            "order": 8,
            "title": "Routine Operations I",
            "description": "Repeater and voice operating procedures, phonetics, simplex and HF calling.",
            "guide_module": "operating",
            "section_ids": sections("B-002-001", "B-002-002", "B-002-003", "B-002-004"),
            "source_keys": ["ric3", "question_bank"],
            "study_tasks": ["Study call structure and phonetics.", "Drill repeater/simplex questions.", "Use flashcards for Q signals and operating terms."],
        },
        {
            "id": "unit-09-routine-operations-ii",
            "order": 9,
            "title": "Routine Operations II",
            "description": "CW, RST, Q signals, emergency procedure and record keeping.",
            "guide_module": "operating",
            "section_ids": sections("B-002-005", "B-002-006", "B-002-007", "B-002-008", "B-002-009"),
            "source_keys": ["ric3", "question_bank"],
            "study_tasks": ["Memorize common Q signals.", "Understand RST signal reports.", "Drill emergency operating questions."],
        },
        {
            "id": "unit-10-equipping-a-station",
            "order": 10,
            "title": "Equipping A Station",
            "description": "Block diagrams for HF, FM, CW, SSB, digital systems and Yagi antennas.",
            "guide_module": "station",
            "section_ids": sections("B-003-001", "B-003-002", "B-003-003", "B-003-004", "B-003-005", "B-003-006", "B-003-007", "B-003-009"),
            "source_keys": ["ric3", "question_bank"],
            "study_tasks": ["Draw transmitter and receiver block diagrams.", "Drill station assembly sections.", "Explain the purpose of each major block."],
        },
        {
            "id": "unit-11-power-supplies",
            "order": 11,
            "title": "Power Supplies",
            "description": "Regulated supplies, cells, batteries, charging, power supply fundamentals and fuse safety.",
            "guide_module": "station",
            "section_ids": sections("B-003-008", "B-003-016", "B-003-017", "B-003-019"),
            "source_keys": ["ric3", "question_bank"],
            "study_tasks": ["Practice battery series/parallel rules.", "Review rectifier/filter/regulator stages.", "Drill fuse and capacitor-discharge safety."],
        },
        {
            "id": "unit-12-antennas-i",
            "order": 12,
            "title": "Antennas I",
            "description": "Antenna safety, polarization, wavelength, feedline basics and impedance.",
            "guide_module": "antennas",
            "section_ids": sections("B-003-020", "B-003-021", "B-006-001", "B-006-002", "B-006-007", "B-006-008"),
            "source_keys": ["ric3", "rbr4", "question_bank"],
            "study_tasks": ["Use the wavelength formula drill.", "Review RF exposure and tower safety.", "Drill feedline characteristic questions."],
        },
        {
            "id": "unit-13-antennas-ii",
            "order": 13,
            "title": "Antennas II",
            "description": "Coax, connectors, SWR, matching, gain, verticals, Yagis, wire antennas and loops.",
            "guide_module": "antennas",
            "section_ids": sections("B-006-003", "B-006-004", "B-006-005", "B-006-006", "B-006-009", "B-006-010", "B-006-011", "B-006-012", "B-006-013"),
            "source_keys": ["ric3", "question_bank"],
            "study_tasks": ["Separate SWR from impedance matching.", "Review line-loss patterns.", "Drill antenna-type questions."],
        },
        {
            "id": "unit-14-digital",
            "order": 14,
            "title": "Digital",
            "description": "Digital system layout, station accessories and digital-mode fundamentals.",
            "guide_module": "station",
            "section_ids": sections("B-003-007", "B-003-014", "B-003-015"),
            "source_keys": ["ric3", "question_bank"],
            "study_tasks": ["Review where digital interfaces fit in a station.", "Learn the high-level purpose of RTTY, ASCII, AMTOR and packet.", "Drill all digital sections."],
        },
        {
            "id": "unit-15-safety",
            "order": 15,
            "title": "Safety",
            "description": "Electrical hazards, grounding, capacitors, fuses, tower safety, lightning and RF exposure.",
            "guide_module": "station",
            "section_ids": sections("B-003-018", "B-003-019", "B-003-020", "B-003-021"),
            "source_keys": ["ric3", "rbr4", "question_bank"],
            "study_tasks": ["Read the safety cram sheet.", "Memorize fuse and capacitor safety.", "Drill safety questions until every hazard-control pairing is clear."],
        },
        {
            "id": "unit-16-basic-electronics-i",
            "order": 16,
            "title": "Basic Electronics I",
            "description": "Metric prefixes, current, voltage, resistance, energy, power, open/short circuits and Ohm's law.",
            "guide_module": "theory",
            "section_ids": sections("B-005-001", "B-005-002", "B-005-003", "B-005-004", "B-005-005", "B-005-006"),
            "source_keys": ["ric3", "question_bank"],
            "study_tasks": ["Run formula drills for Ohm's law and power.", "Convert prefixes before calculating.", "Drill B-005-001 through B-005-006."],
        },
        {
            "id": "unit-17-basic-electronics-ii",
            "order": 17,
            "title": "Basic Electronics II",
            "description": "AC, frequency, decibels, inductance, capacitance, reactance, impedance, resonance and meters.",
            "guide_module": "theory",
            "section_ids": sections("B-005-007", "B-005-008", "B-005-009", "B-005-010", "B-005-011", "B-005-012", "B-005-013"),
            "source_keys": ["ric3", "question_bank"],
            "study_tasks": ["Practice dB and reactance trend drills.", "Review resonance and tuned circuits.", "Drill measurement questions."],
        },
        {
            "id": "unit-18-active-devices",
            "order": 18,
            "title": "Active Devices",
            "description": "Amplifiers, diodes, BJTs, FETs, triodes and resistor colour codes.",
            "guide_module": "components",
            "section_ids": sections("B-004-001", "B-004-002", "B-004-003", "B-004-004", "B-004-005", "B-004-006"),
            "source_keys": ["ric3", "question_bank"],
            "study_tasks": ["Memorize component terminals.", "Review control mechanisms for BJTs and FETs.", "Drill component recognition questions."],
        },
        {
            "id": "unit-19-interference",
            "order": 19,
            "title": "Interference",
            "description": "Overload, cross-modulation, audio rectification, ferrites, intermodulation, spurious emissions, harmonics and filters.",
            "guide_module": "interference",
            "section_ids": sections("B-008-001", "B-008-002", "B-008-003", "B-008-004", "B-008-005"),
            "source_keys": ["ric3", "question_bank"],
            "study_tasks": ["Use the interference troubleshooting cram sheet.", "Match each symptom to a cause.", "Drill all B-008 sections."],
        },
        {
            "id": "unit-20-inductors-capacitors",
            "order": 20,
            "title": "Inductors And Capacitors",
            "description": "Inductance, capacitance, reactance, impedance, transformers, resonance and tuned circuits.",
            "guide_module": "theory",
            "section_ids": sections("B-005-009", "B-005-010", "B-005-011", "B-005-012"),
            "source_keys": ["ric3", "question_bank"],
            "study_tasks": ["Memorize opposite reactance trends.", "Review resonance at a concept level.", "Drill inductor/capacitor sections."],
        },
        {
            "id": "unit-21-feed-lines-i",
            "order": 21,
            "title": "Feed Lines I",
            "description": "Characteristic impedance, balanced/unbalanced lines, baluns, coax and connectors.",
            "guide_module": "antennas",
            "section_ids": sections("B-006-001", "B-006-002", "B-006-003"),
            "source_keys": ["ric3", "question_bank"],
            "study_tasks": ["Review coax vs ladder line.", "Learn what a balun does.", "Drill connector/feedline questions."],
        },
        {
            "id": "unit-22-feed-lines-ii",
            "order": 22,
            "title": "Feed Lines II",
            "description": "Line loss, SWR, matching, polarization, wavelength, gain and antenna bandwidth.",
            "guide_module": "antennas",
            "section_ids": sections("B-006-004", "B-006-005", "B-006-006", "B-006-007", "B-006-008", "B-006-009"),
            "source_keys": ["ric3", "question_bank"],
            "study_tasks": ["Understand what SWR can and cannot tell you.", "Practice wavelength questions.", "Drill feedline-loss and matching questions."],
        },
        {
            "id": "unit-23-propagation-i",
            "order": 23,
            "title": "Propagation I",
            "description": "Line of sight, ground wave, sky wave, ionosphere, hops, skip zone and absorption.",
            "guide_module": "propagation",
            "section_ids": sections("B-007-001", "B-007-002", "B-007-003", "B-007-004"),
            "source_keys": ["ric3", "question_bank"],
            "study_tasks": ["Identify the propagation path first.", "Separate D-layer absorption from E/F refraction.", "Drill skip-zone questions."],
        },
        {
            "id": "unit-24-propagation-ii",
            "order": 24,
            "title": "Propagation II",
            "description": "Solar activity, MUF, solar flux, sporadic-E, aurora, ducting and scatter.",
            "guide_module": "propagation",
            "section_ids": sections("B-007-005", "B-007-006", "B-007-007", "B-007-008"),
            "source_keys": ["ric3", "question_bank"],
            "study_tasks": ["Memorize MUF and critical frequency.", "Review solar-cycle effects.", "Drill VHF/UHF special propagation modes."],
        },
        {
            "id": "unit-25-transmitters-i",
            "order": 25,
            "title": "Transmitters I",
            "description": "FM, CW and SSB transmitter layout plus carrier, keying and AM fundamentals.",
            "guide_module": "station",
            "section_ids": sections("B-003-002", "B-003-004", "B-003-006", "B-003-011", "B-003-012"),
            "source_keys": ["ric3", "question_bank"],
            "study_tasks": ["Draw transmitter block paths.", "Review carrier/keying/modulation terms.", "Drill transmitter layout sections."],
        },
        {
            "id": "unit-26-transmitters-ii",
            "order": 26,
            "title": "Transmitters II",
            "description": "FM/PM fundamentals, accessories, digital modes, spurious emissions, harmonics and splatter.",
            "guide_module": "station",
            "section_ids": sections("B-003-013", "B-003-014", "B-003-015", "B-008-003", "B-008-004"),
            "source_keys": ["ric3", "question_bank"],
            "study_tasks": ["Review transmitter interference causes.", "Separate FM, PM, SSB and digital mode concepts.", "Drill transmitter adjustment questions."],
        },
        {
            "id": "unit-27-receivers",
            "order": 27,
            "title": "Receivers",
            "description": "FM and SSB/CW receiver layout, receiver fundamentals, overload and filtering.",
            "guide_module": "station",
            "section_ids": sections("B-003-003", "B-003-005", "B-003-010", "B-008-001", "B-008-005"),
            "source_keys": ["ric3", "question_bank"],
            "study_tasks": ["Review receiver block diagrams.", "Match filters to receiver problems.", "Drill overload and receiver-fundamentals questions."],
        },
        {
            "id": "unit-28-ohms-law-power-law",
            "order": 28,
            "title": "Ohm's Law / Power Law",
            "description": "Calculation-heavy review for Ohm's law, power law, series/parallel resistors and units.",
            "guide_module": "theory",
            "section_ids": sections("B-005-001", "B-005-004", "B-005-005", "B-005-006"),
            "source_keys": ["ric3", "question_bank"],
            "study_tasks": ["Complete every formula drill.", "Redo missed B-005 calculation questions.", "Take a custom electronics practice set."],
        },
    ]

    resources = [
        {
            "id": "official-bank",
            "title": "ISED official Basic question bank",
            "type": "official",
            "url": source_links["question_bank"]["url"],
            "description": "Official Government of Canada page for the Basic question bank.",
        },
        {
            "id": "practice-exam-help",
            "title": "ISED practice exam help",
            "type": "official",
            "url": "https://ised-isde.canada.ca/site/amateur-radio-operator-certificate-services/en/help/help-practice-exam",
            "description": "How the official online practice exam tool works.",
        },
        {
            "id": "accredited-examiners",
            "title": "Find an accredited examiner",
            "type": "official",
            "url": "https://ised-isde.canada.ca/site/amateur-radio-operator-certificate-services/en/accredited-examiners",
            "description": "ISED page for finding examiners and examiner services.",
        },
        {
            "id": "ric3",
            "title": "RIC-3 information circular",
            "type": "official",
            "url": source_links["ric3"]["url"],
            "description": "ISED overview of amateur radio certification, examinations and privileges.",
        },
        {
            "id": "rbr4",
            "title": "RBR-4 operation standards",
            "type": "official",
            "url": source_links["rbr4"]["url"],
            "description": "Official standards for operation of amateur radio stations.",
        },
        {
            "id": "clares-basic",
            "title": "CLARES Basic course",
            "type": "recommended",
            "url": "https://www.clares.ca/course/basic",
            "description": "Recommended external self-paced course with slides, videos and questions.",
        },
        {
            "id": "clares-videos",
            "title": "CLARES video list",
            "type": "video",
            "url": "https://www.clares.ca/va6hal%20training%20basic.html",
            "description": "External video sections for regulations, operations, antennas, electronics, propagation and more.",
        },
        {
            "id": "clares-basics",
            "title": "Basic electricity and radio videos",
            "type": "video",
            "url": "https://www.clares.ca/va6hal%20training%20basics.html",
            "description": "External video links for electricity, radio waves, Ohm's law, power, circuits and wavelength.",
        },
    ]

    next_steps = [
        {
            "title": "Pass multiple 100-question mocks",
            "description": "Aim for at least 80 percent on several fresh mock exams so you are in Basic with Honours territory, not merely pass territory.",
            "action": "Start a mock exam",
            "action_type": "app",
            "action_target": "start-mock",
        },
        {
            "title": "Use the official ISED practice exam",
            "description": "After this app feels easy, run the official practice exam so the government interface is familiar.",
            "action": "Open ISED practice exam help",
            "action_type": "link",
            "action_target": "https://ised-isde.canada.ca/site/amateur-radio-operator-certificate-services/en/help/help-practice-exam",
        },
        {
            "title": "Book with an accredited examiner",
            "description": "Find a local or virtual accredited examiner and confirm the exam format, fee, ID requirements and scheduling.",
            "action": "Find an examiner",
            "action_type": "link",
            "action_target": "https://ised-isde.canada.ca/site/amateur-radio-operator-certificate-services/en/accredited-examiners",
        },
        {
            "title": "Keep studying weak areas",
            "description": "Use adaptive study and missed-question drills until regulation details and formula questions are no longer fragile.",
            "action": "Start adaptive study",
            "action_type": "app",
            "action_target": "start-adaptive",
        },
    ]

    for unit in units:
        unit["sources"] = [source_links[key] for key in unit.pop("source_keys")]
        unit["estimated_minutes"] = 30 if unit["order"] in {7, 19, 28} else 25

    return {
        "version": "1.0",
        "source": "Original 28-unit course path inspired by common Canadian Basic training sequences and mapped to RIC-3 topic areas.",
        "units": units,
        "resources": resources,
        "next_steps": next_steps,
    }


def build_reference():
    sections = [
        {
            "id": "exam_rules",
            "title": "Basic Exam Rules",
            "topic": "regulations",
            "type": "table",
            "columns": ["Item", "Value"],
            "rows": [
                ["Questions", "100, one from each RIC-3 Basic topic area"],
                ["Pass mark", "70 percent"],
                ["Honours", "80 percent or higher"],
                ["Time limit", "No fixed time limit specified in RIC-3"],
                ["Reference material", "Closed book"],
            ],
        },
        {
            "id": "privileges",
            "title": "Qualification Privileges",
            "topic": "regulations",
            "type": "table",
            "columns": ["Qualification", "Main privileges"],
            "rows": [
                ["Basic", "Amateur bands above 30 MHz; 250 W DC input; commercial kit assembly; repeater use."],
                ["Basic with Honours", "Basic plus amateur bands below 30 MHz."],
                ["Basic plus Morse", "Access to all amateur bands."],
                ["Advanced", "1000 W DC input; build/modify transmitters; establish repeaters and club stations; remote control fixed stations."],
            ],
        },
        {
            "id": "call_prefixes",
            "title": "Canadian Amateur Call Sign Prefixes",
            "topic": "regulations",
            "type": "table",
            "columns": ["Prefix", "Area"],
            "rows": [
                ["VE1 / VA1", "Nova Scotia"],
                ["VE2 / VA2", "Quebec"],
                ["VE3 / VA3", "Ontario"],
                ["VE4 / VA4", "Manitoba"],
                ["VE5 / VA5", "Saskatchewan"],
                ["VE6 / VA6", "Alberta"],
                ["VE7 / VA7", "British Columbia"],
                ["VE8", "Northwest Territories"],
                ["VE9", "New Brunswick"],
                ["VE0", "International waters, vessel use"],
                ["VO1", "Newfoundland"],
                ["VO2", "Labrador"],
                ["VY1", "Yukon"],
                ["VY2", "Prince Edward Island"],
                ["VY0", "Nunavut"],
            ],
        },
        {
            "id": "formula_sheet",
            "title": "Formula Sheet",
            "topic": "theory",
            "type": "table",
            "columns": ["Concept", "Formula or rule"],
            "rows": [
                ["Ohm's law", "E = I x R; I = E / R; R = E / I"],
                ["Power", "P = E x I; P = I^2 x R; P = E^2 / R"],
                ["Wavelength", "metres = 300 / frequency in MHz"],
                ["Series resistors", "Add directly"],
                ["Parallel resistors", "1/Rtotal = 1/R1 + 1/R2 + ..."],
                ["Battery series", "Voltage adds, amp-hour capacity stays the same"],
                ["Battery parallel", "Voltage stays the same, amp-hour capacity adds"],
                ["3 dB", "About double or half power"],
                ["10 dB", "Ten times or one-tenth power"],
            ],
        },
        {
            "id": "safety_sheet",
            "title": "Safety Cram Sheet",
            "topic": "station",
            "type": "ordered_list",
            "items": [
                "Disconnect power before service.",
                "Discharge capacitors before touching high-voltage circuits.",
                "Replace fuses with the correct type and rating.",
                "Keep antennas and towers clear of power lines.",
                "Use proper grounding and lightning protection.",
                "Respect RF exposure limits and prevent people from contacting energized antennas.",
            ],
        },
        {
            "id": "interference_sheet",
            "title": "Interference Troubleshooting",
            "topic": "interference",
            "type": "table",
            "columns": ["Symptom", "Likely concept"],
            "rows": [
                ["TV or receiver overload from a strong nearby signal", "Front-end overload"],
                ["Voice heard in audio equipment", "Audio rectification / RF pickup"],
                ["Signals on multiples of your transmit frequency", "Harmonics"],
                ["Wide adjacent-channel interference on voice", "Splatter / overmodulation"],
                ["Unwanted signals generated by nonlinear mixing", "Intermodulation"],
                ["CW clicks heard near the signal", "Poor keying waveform / key clicks"],
            ],
        },
    ]
    return {"version": "1.0", "source": "Reference sheets derived from official study documents.", "sections": sections}


def build_formulas():
    drills = [
        {
            "id": "F-001",
            "topic": "ohms_law",
            "title": "Ohm's law: current",
            "question": "A 12 V source is connected across a 6 ohm resistor. What current flows?",
            "choices": ["2 A", "0.5 A", "18 A", "72 A"],
            "correct_index": 0,
            "explanation": "Use I = E / R. 12 V / 6 ohms = 2 A.",
        },
        {
            "id": "F-002",
            "topic": "ohms_law",
            "title": "Ohm's law: resistance",
            "question": "A circuit draws 0.5 A from a 12 V supply. What is the resistance?",
            "choices": ["24 ohms", "6 ohms", "12.5 ohms", "0.041 ohms"],
            "correct_index": 0,
            "explanation": "Use R = E / I. 12 V / 0.5 A = 24 ohms.",
        },
        {
            "id": "F-003",
            "topic": "power",
            "title": "Power from voltage and current",
            "question": "A device uses 13.8 V at 10 A. What is the power?",
            "choices": ["138 W", "1.38 W", "23.8 W", "3.8 W"],
            "correct_index": 0,
            "explanation": "Use P = E x I. 13.8 V x 10 A = 138 W.",
        },
        {
            "id": "F-004",
            "topic": "series_parallel",
            "title": "Series resistors",
            "question": "What is the total resistance of 10 ohms, 15 ohms and 25 ohms in series?",
            "choices": ["50 ohms", "8.3 ohms", "25 ohms", "3750 ohms"],
            "correct_index": 0,
            "explanation": "Series resistors add directly: 10 + 15 + 25 = 50 ohms.",
        },
        {
            "id": "F-005",
            "topic": "series_parallel",
            "title": "Parallel resistors",
            "question": "Two 100 ohm resistors are connected in parallel. What is the total resistance?",
            "choices": ["50 ohms", "100 ohms", "200 ohms", "10,000 ohms"],
            "correct_index": 0,
            "explanation": "Two equal resistors in parallel equal half one resistor: 100 / 2 = 50 ohms.",
        },
        {
            "id": "F-006",
            "topic": "wavelength",
            "title": "Wavelength",
            "question": "What is the approximate wavelength of a 150 MHz signal?",
            "choices": ["2 m", "0.5 m", "20 m", "300 m"],
            "correct_index": 0,
            "explanation": "Wavelength in metres is approximately 300 / frequency in MHz. 300 / 150 = 2 m.",
        },
        {
            "id": "F-007",
            "topic": "decibels",
            "title": "Decibels",
            "question": "A 3 dB increase in power is approximately what change?",
            "choices": ["Double the power", "Ten times the power", "Half the power", "No change"],
            "correct_index": 0,
            "explanation": "For power ratios, +3 dB is approximately x2. -3 dB is approximately half power.",
        },
        {
            "id": "F-008",
            "topic": "batteries",
            "title": "Batteries in series",
            "question": "Two 12 V, 20 Ah batteries are connected in series. What is the result?",
            "choices": ["24 V, 20 Ah", "12 V, 40 Ah", "24 V, 40 Ah", "6 V, 20 Ah"],
            "correct_index": 0,
            "explanation": "In series, voltage adds and amp-hour capacity stays the same: 12 + 12 = 24 V, still 20 Ah.",
        },
        {
            "id": "F-009",
            "topic": "batteries",
            "title": "Batteries in parallel",
            "question": "Two 12 V, 20 Ah batteries are connected in parallel. What is the result?",
            "choices": ["12 V, 40 Ah", "24 V, 20 Ah", "24 V, 40 Ah", "6 V, 20 Ah"],
            "correct_index": 0,
            "explanation": "In parallel, voltage stays the same and amp-hour capacity adds: 12 V, 20 + 20 = 40 Ah.",
        },
        {
            "id": "F-010",
            "topic": "reactance",
            "title": "Reactance trend",
            "question": "As frequency increases, what happens to inductive reactance?",
            "choices": ["It increases", "It decreases", "It becomes zero", "It is unrelated to frequency"],
            "correct_index": 0,
            "explanation": "Inductive reactance increases with frequency. Capacitive reactance moves the opposite way.",
        },
        {
            "id": "F-011",
            "topic": "reactance",
            "title": "Capacitive reactance trend",
            "question": "As frequency increases, what happens to capacitive reactance?",
            "choices": ["It decreases", "It increases", "It becomes infinite", "It is unrelated to frequency"],
            "correct_index": 0,
            "explanation": "Capacitive reactance decreases as frequency increases.",
        },
        {
            "id": "F-012",
            "topic": "prefixes",
            "title": "Metric prefixes",
            "question": "What multiplier does the prefix kilo represent?",
            "choices": ["1000", "1000000", "0.001", "0.000001"],
            "correct_index": 0,
            "explanation": "Kilo means 1000. Mega means 1,000,000; milli means 0.001; micro means 0.000001.",
        },
    ]
    return {"version": "1.0", "source": "App-authored formula drills for Basic electronics and theory.", "drills": drills}


def build_flashcards():
    decks = [
        {
            "deck_id": "regulation_must_know",
            "title": "Regulation Must-Know",
            "topic": "regulations",
            "cards": [
                {"id": "REG-01", "front": "Basic exam pass mark", "back": "70 percent."},
                {"id": "REG-02", "front": "Basic with Honours mark", "back": "80 percent or higher."},
                {"id": "REG-03", "front": "Number of Basic exam questions", "back": "100 questions, one from each RIC-3 Basic topic area."},
                {"id": "REG-04", "front": "Basic access", "back": "All amateur bands above 30 MHz."},
                {"id": "REG-05", "front": "Basic with Honours access", "back": "Basic privileges plus amateur bands below 30 MHz."},
                {"id": "REG-06", "front": "Address change", "back": "Notify ISED within 30 days of a mailing address change."},
                {"id": "REG-07", "front": "First Amateur Radio Operator Certificate fee", "back": "Free."},
                {"id": "REG-08", "front": "Certificate validity", "back": "Valid for life."},
            ],
        },
        {
            "deck_id": "operating_signals",
            "title": "Operating Signals",
            "topic": "operating",
            "cards": [
                {"id": "OP-01", "front": "QRM", "back": "Man-made interference."},
                {"id": "OP-02", "front": "QRN", "back": "Natural static/noise."},
                {"id": "OP-03", "front": "QRP", "back": "Reduce power / low-power operation."},
                {"id": "OP-04", "front": "QSL", "back": "Acknowledgement / confirmation."},
                {"id": "OP-05", "front": "QTH", "back": "Location."},
                {"id": "OP-06", "front": "RST report", "back": "Readability, Strength, Tone."},
                {"id": "OP-07", "front": "CQ", "back": "General call to any station."},
                {"id": "OP-08", "front": "Dummy load", "back": "A non-radiating load used for testing and tuneups."},
            ],
        },
        {
            "deck_id": "formulas",
            "title": "Formulas",
            "topic": "theory",
            "cards": [
                {"id": "FOR-01", "front": "Ohm's law", "back": "E = I x R."},
                {"id": "FOR-02", "front": "Power from voltage and current", "back": "P = E x I."},
                {"id": "FOR-03", "front": "Power from current and resistance", "back": "P = I^2 x R."},
                {"id": "FOR-04", "front": "Power from voltage and resistance", "back": "P = E^2 / R."},
                {"id": "FOR-05", "front": "Wavelength in metres", "back": "300 / frequency in MHz."},
                {"id": "FOR-06", "front": "+3 dB power", "back": "Approximately double power."},
                {"id": "FOR-07", "front": "+10 dB power", "back": "Ten times power."},
                {"id": "FOR-08", "front": "Two equal resistors in parallel", "back": "Total is half one resistor."},
            ],
        },
        {
            "deck_id": "antennas_propagation",
            "title": "Antennas and Propagation",
            "topic": "antennas",
            "cards": [
                {"id": "AP-01", "front": "Coaxial cable", "back": "Unbalanced feedline, commonly 50 ohms in amateur stations."},
                {"id": "AP-02", "front": "Balun", "back": "Connects balanced and unbalanced systems."},
                {"id": "AP-03", "front": "High SWR", "back": "Indicates impedance mismatch and can increase line loss and equipment stress."},
                {"id": "AP-04", "front": "Line of sight", "back": "Dominant VHF/UHF propagation mode."},
                {"id": "AP-05", "front": "Sky wave", "back": "Ionospheric propagation, central to HF communication."},
                {"id": "AP-06", "front": "Skip zone", "back": "Area between ground-wave coverage and first sky-wave return."},
                {"id": "AP-07", "front": "MUF", "back": "Maximum usable frequency for a radio path."},
                {"id": "AP-08", "front": "D layer", "back": "Absorbs HF, especially during daylight."},
            ],
        },
        {
            "deck_id": "interference_safety",
            "title": "Interference and Safety",
            "topic": "interference",
            "cards": [
                {"id": "IS-01", "front": "Harmonics", "back": "Unwanted signals at multiples of the operating frequency."},
                {"id": "IS-02", "front": "Splatter", "back": "Adjacent-channel interference often caused by overmodulation or overdrive."},
                {"id": "IS-03", "front": "Low-pass filter", "back": "Passes low frequencies and attenuates higher frequencies."},
                {"id": "IS-04", "front": "Ferrite choke", "back": "Can reduce RF pickup on leads and cables."},
                {"id": "IS-05", "front": "Fuse replacement", "back": "Use the correct type and rating."},
                {"id": "IS-06", "front": "Capacitor safety", "back": "High-voltage capacitors can retain charge after power is off."},
                {"id": "IS-07", "front": "Tower safety", "back": "Keep clear of power lines and use proper climbing/fall protection."},
                {"id": "IS-08", "front": "RF exposure", "back": "Observe limits and keep people away from energized antennas."},
            ],
        },
    ]
    return {"version": "1.0", "source": "App-authored flashcards derived from official syllabus areas.", "decks": decks}


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def validate(questions, topics, explanations):
    qlist = questions["questions"]
    sections = topics["sections"]
    ids = [question["id"] for question in qlist]
    if len(qlist) != 984:
        raise SystemExit(f"Expected 984 questions, found {len(qlist)}")
    if len(set(ids)) != len(ids):
        raise SystemExit("Question IDs are not unique")
    if len(sections) != 100:
        raise SystemExit(f"Expected 100 topic sections, found {len(sections)}")
    section_ids = {section["id"] for section in sections}
    question_sections = {question["section_id"] for question in qlist}
    if question_sections != section_ids:
        missing = sorted(section_ids - question_sections)
        extra = sorted(question_sections - section_ids)
        raise SystemExit(f"Question sections mismatch. Missing={missing} Extra={extra}")
    missing_explanations = [qid for qid in ids if qid not in explanations["explanations"]]
    if missing_explanations:
        raise SystemExit(f"Missing explanations: {missing_explanations[:5]}")
    bad_choices = [question["id"] for question in qlist if len(question["choices"]) != 4 or any(not choice for choice in question["choices"])]
    if bad_choices:
        raise SystemExit(f"Bad choices in questions: {bad_choices[:5]}")


def main():
    DATA_DIR.mkdir(exist_ok=True)
    topics = build_topics()
    questions = build_questions(topics)
    explanations = build_explanations(questions, topics)
    validate(questions, topics, explanations)
    write_json(DATA_DIR / "topics.json", topics)
    write_json(DATA_DIR / "questions.json", questions)
    write_json(DATA_DIR / "explanations.json", explanations)
    write_json(DATA_DIR / "guide.json", build_guide())
    write_json(DATA_DIR / "course.json", build_course())
    write_json(DATA_DIR / "reference.json", build_reference())
    write_json(DATA_DIR / "formulas.json", build_formulas())
    write_json(DATA_DIR / "flashcards.json", build_flashcards())
    print("Built HAM study data")
    print(f"Questions: {len(questions['questions'])}")
    print(f"Topic areas: {len(topics['sections'])}")


if __name__ == "__main__":
    main()
