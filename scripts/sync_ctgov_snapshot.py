#!/usr/bin/env python3
"""Synchronize TrialBeacon's ClinicalTrials.gov v2 snapshot.

The script is intentionally dependency-free so it can run locally or in CI.
It fetches open studies for the cancer conditions used by the application,
validates the normalized snapshot contract, and writes timestamped JSON files.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import Counter, defaultdict
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

API_BASE = "https://clinicaltrials.gov/api/v2"
STUDIES_URL = f"{API_BASE}/studies"
VERSION_URL = f"{API_BASE}/version"
USER_AGENT = "TrialBeacon/ctgov-snapshot-sync (+https://trialbeacon.cn)"
PAGE_SIZE = 1000
RETRYABLE_STATUS = {408, 425, 429, 500, 502, 503, 504}
NCT_RE = re.compile(r"^NCT\d{8}$")
ISO_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

CANCERS = [
    ("lung", "lung cancer"),
    ("breast", "breast cancer"),
    ("colorectal", "colorectal cancer"),
    ("liver", "hepatocellular carcinoma OR liver cancer"),
    ("gastric", "gastric cancer"),
    ("pancreatic", "pancreatic cancer"),
    ("prostate", "prostate cancer"),
    ("ovarian", "ovarian cancer"),
    ("esophageal", "esophageal cancer"),
    ("lymphoma", "lymphoma"),
    ("leukemia", "leukemia"),
]

OPEN_STATUSES = {
    "RECRUITING",
    "NOT_YET_RECRUITING",
    "ENROLLING_BY_INVITATION",
    "ACTIVE_NOT_RECRUITING",
}
ALL_STATUSES = OPEN_STATUSES | {
    "SUSPENDED",
    "TERMINATED",
    "COMPLETED",
    "WITHDRAWN",
    "WITHHELD",
    "AVAILABLE",
    "NO_LONGER_AVAILABLE",
    "UNKNOWN",
}
STATUS_LABELS = {
    "RECRUITING": "Recruiting",
    "NOT_YET_RECRUITING": "Not yet recruiting",
    "ENROLLING_BY_INVITATION": "Enrolling by invitation",
    "ACTIVE_NOT_RECRUITING": "Active, not recruiting",
    "SUSPENDED": "Suspended",
    "TERMINATED": "Terminated",
    "COMPLETED": "Completed",
    "WITHDRAWN": "Withdrawn",
    "WITHHELD": "Withheld",
    "AVAILABLE": "Available",
    "NO_LONGER_AVAILABLE": "No longer available",
    "UNKNOWN": "Unknown status",
}
PHASE_LABELS = {
    "EARLY_PHASE1": "Early Phase 1",
    "PHASE1": "Phase 1",
    "PHASE2": "Phase 2",
    "PHASE3": "Phase 3",
    "PHASE4": "Phase 4",
    "NA": "Not applicable",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("data/snapshots"),
        help="Directory for timestamped and latest JSON snapshots.",
    )
    parser.add_argument(
        "--typescript-output",
        type=Path,
        help="Optional path for a generated UpdateItem[] TypeScript module.",
    )
    parser.add_argument(
        "--include-closed",
        action="store_true",
        help="Include all registry statuses instead of enrolment-relevant statuses.",
    )
    parser.add_argument(
        "--page-size",
        type=int,
        default=PAGE_SIZE,
        choices=range(1, PAGE_SIZE + 1),
        metavar="1..1000",
        help="Studies per API page (default: 1000).",
    )
    parser.add_argument(
        "--max-pages",
        type=int,
        default=0,
        help="Optional safety cap per cancer query; 0 means no cap.",
    )
    parser.add_argument("--timeout", type=float, default=30.0)
    parser.add_argument("--retries", type=int, default=3)
    return parser.parse_args()


def get_path(value: Any, *keys: str) -> Any:
    current = value
    for key in keys:
        if not isinstance(current, dict):
            return None
        current = current.get(key)
    return current


def fetch_json(url: str, timeout: float, retries: int) -> dict[str, Any]:
    last_error: Exception | None = None
    for attempt in range(retries + 1):
        try:
            request = Request(url, headers={"Accept": "application/json", "User-Agent": USER_AGENT})
            with urlopen(request, timeout=timeout) as response:
                return json.load(response)
        except HTTPError as error:
            last_error = error
            if error.code not in RETRYABLE_STATUS or attempt >= retries:
                raise
        except (URLError, TimeoutError, OSError, json.JSONDecodeError) as error:
            last_error = error
            if attempt >= retries:
                raise
        time.sleep(min(2**attempt, 8))
    raise RuntimeError(f"API request failed: {last_error}")


def phase_label(phases: Any) -> str | None:
    if not isinstance(phases, list) or not phases:
        return None
    labels = [PHASE_LABELS.get(str(phase), str(phase)) for phase in phases]
    if len(labels) == 1:
        return labels[0]
    numbers = [re.search(r"Phase (\d)", label) for label in labels]
    if all(numbers):
        return f"Phase {'/'.join(match.group(1) for match in numbers if match)}"
    return " / ".join(labels)


def region_for_country(country: str) -> str:
    normalized = country.casefold()
    if normalized in {
        "united states",
        "canada",
        "puerto rico",
        "guam",
        "american samoa",
        "us minor outlying islands",
    }:
        return "US"
    if normalized in {
        "china",
        "hong kong",
        "macao",
        "taiwan",
    }:
        return "CN"
    if normalized in {
        "austria", "belgium", "bulgaria", "croatia", "cyprus", "czechia",
        "denmark", "estonia", "finland", "france", "germany", "greece",
        "hungary", "ireland", "italy", "latvia", "lithuania", "luxembourg",
        "malta", "netherlands", "norway", "poland", "portugal", "romania",
        "slovakia", "slovenia", "spain", "sweden", "switzerland", "turkey",
        "turkiye", "united kingdom",
    }:
        return "EU"
    return "OTHER"


def normalize_study(study: dict[str, Any], cancer_slug: str) -> dict[str, Any] | None:
    protocol = study.get("protocolSection") or {}
    identification = protocol.get("identificationModule") or {}
    status_module = protocol.get("statusModule") or {}
    design = protocol.get("designModule") or {}
    conditions_module = protocol.get("conditionsModule") or {}
    contacts = protocol.get("contactsLocationsModule") or {}
    eligibility = protocol.get("eligibilityModule") or {}
    sponsor_module = protocol.get("sponsorCollaboratorsModule") or {}
    interventions_module = protocol.get("armsInterventionsModule") or {}

    nct_id = identification.get("nctId")
    title = identification.get("briefTitle")
    if not isinstance(nct_id, str) or not isinstance(title, str) or not title.strip():
        return None

    status_code = status_module.get("overallStatus")
    countries: list[str] = []
    for location in contacts.get("locations") or []:
        country = location.get("country") if isinstance(location, dict) else None
        if isinstance(country, str) and country.strip() and country.strip() not in countries:
            countries.append(country.strip())
    regions = [region_for_country(country) for country in countries]
    region = next((item for item in regions if item != "OTHER"), "OTHER")
    conditions = conditions_module.get("conditions") or []
    searchable_text = f"{title} {' '.join(str(item) for item in conditions)}"
    after_care = bool(re.search(
        r"\b(advanced|metastatic|refractory|relapsed|recurrent|unresectable|palliative|supportive care|second[- ]line|third[- ]line|later[- ]line|previously treated|castration[- ]resistant|platinum[- ]resistant|stage iv|end[- ]of[- ]life|quality of life|symptom)\b",
        searchable_text,
        re.IGNORECASE,
    ))
    interventions = [
        item.get("name", "").strip()
        for item in interventions_module.get("interventions") or []
        if isinstance(item, dict) and isinstance(item.get("name"), str) and item["name"].strip()
    ]
    age_values = [eligibility.get("minimumAge"), eligibility.get("maximumAge")]
    age_range = " – ".join(str(value) for value in age_values if value)
    raw_date = get_path(status_module, "lastUpdatePostDateStruct", "date")
    first_posted = get_path(status_module, "studyFirstPostDateStruct", "date")

    result: dict[str, Any] = {
        "id": nct_id,
        "title": title.strip(),
        "source": "ctgov",
        "region": region,
        "type": "trial",
        "date": raw_date if isinstance(raw_date, str) else None,
        "firstPosted": first_posted if isinstance(first_posted, str) else None,
        "url": f"https://clinicaltrials.gov/study/{nct_id}",
        "cancers": [cancer_slug],
        "status": STATUS_LABELS.get(status_code, str(status_code).replace("_", " ").title()) if status_code else None,
        "statusCode": status_code,
        "afterCare": after_care,
        "studyType": design.get("studyType"),
        "countries": countries or None,
        "enrollment": get_path(design, "enrollmentInfo", "count"),
        "phase": phase_label(design.get("phases")),
        "interventions": interventions or None,
        "sponsor": get_path(sponsor_module, "leadSponsor", "name"),
        "ageRange": age_range or None,
        "sex": eligibility.get("sex"),
        "eligibility": eligibility.get("eligibilityCriteria"),
        "hasPublicContact": bool(contacts.get("centralContacts")),
    }
    return {key: value for key, value in result.items() if value is not None}


def fetch_cancer(cancer_slug: str, condition: str, statuses: list[str], args: argparse.Namespace) -> tuple[list[dict[str, Any]], int]:
    records: list[dict[str, Any]] = []
    page_token: str | None = None
    pages = 0
    while True:
        params: dict[str, str] = {
            "query.cond": condition,
            "fields": "protocolSection.identificationModule|protocolSection.statusModule|protocolSection.designModule|protocolSection.conditionsModule|protocolSection.armsInterventionsModule|protocolSection.sponsorCollaboratorsModule|protocolSection.contactsLocationsModule",
            "pageSize": str(args.page_size),
            "sort": "LastUpdatePostDate:desc",
            "filter.overallStatus": "|".join(statuses),
        }
        if page_token:
            params["pageToken"] = page_token
        url = f"{STUDIES_URL}?{urlencode(params)}"
        payload = fetch_json(url, args.timeout, args.retries)
        studies = payload.get("studies") or []
        for study in studies:
            if isinstance(study, dict):
                normalized = normalize_study(study, cancer_slug)
                if normalized:
                    records.append(normalized)
        pages += 1
        page_token = payload.get("nextPageToken")
        if not page_token or (args.max_pages and pages >= args.max_pages):
            break
    return records, pages


def validate(records: list[dict[str, Any]], include_closed: bool) -> list[str]:
    errors: list[str] = []
    seen: set[str] = set()
    allowed = ALL_STATUSES if include_closed else OPEN_STATUSES
    today = date.today()
    for index, record in enumerate(records):
        prefix = f"records[{index}]"
        record_id = record.get("id")
        if not isinstance(record_id, str) or not NCT_RE.fullmatch(record_id):
            errors.append(f"{prefix}.id is not a valid NCT identifier")
        elif record_id in seen:
            errors.append(f"{prefix}.id is duplicated: {record_id}")
        else:
            seen.add(record_id)
        for field in ("title", "url", "source", "type"):
            if not record.get(field):
                errors.append(f"{prefix}.{field} is empty")
        if record.get("source") != "ctgov" or record.get("type") != "trial":
            errors.append(f"{prefix} has an unexpected source/type")
        status_code = record.get("statusCode")
        if status_code not in allowed:
            errors.append(f"{prefix}.statusCode is not allowed: {status_code}")
        update_date = record.get("date")
        if not isinstance(update_date, str) or not ISO_DATE_RE.fullmatch(update_date):
            errors.append(f"{prefix}.date is not ISO YYYY-MM-DD")
        elif update_date > today.isoformat():
            errors.append(f"{prefix}.date is in the future: {update_date}")
        if not isinstance(record.get("cancers"), list) or not record["cancers"]:
            errors.append(f"{prefix}.cancers is empty")
        if not isinstance(record.get("url"), str) or record_id not in record["url"]:
            errors.append(f"{prefix}.url does not contain its NCT identifier")
    return errors


def merge_records(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    merged: dict[str, dict[str, Any]] = {}
    for record in records:
        existing = merged.get(record["id"])
        if not existing:
            merged[record["id"]] = record
            continue
        existing["cancers"] = sorted(set(existing.get("cancers", [])) | set(record.get("cancers", [])))
    return sorted(merged.values(), key=lambda item: (item.get("date", ""), item["id"]), reverse=True)


def write_typescript(path: Path, records: list[dict[str, Any]], snapshot_date: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "// Generated by scripts/sync_ctgov_snapshot.py; do not edit manually.",
        "import type { UpdateItem } from '../types';",
        f"export const FRESH_SNAPSHOT_DATE = {json.dumps(snapshot_date)};",
        "export const FRESH_TRIAL_SNAPSHOT: UpdateItem[] = [",
    ]
    lines.extend("  " + json.dumps(record, ensure_ascii=False, separators=(",", ":")) + "," for record in records)
    lines.append("];" )
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    args = parse_args()
    statuses = sorted(ALL_STATUSES if args.include_closed else OPEN_STATUSES)
    run_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    snapshot_date = run_at[:10]
    args.output_dir.mkdir(parents=True, exist_ok=True)
    failures: list[dict[str, str]] = []
    all_records: list[dict[str, Any]] = []
    query_pages: dict[str, int] = {}

    try:
        version = fetch_json(VERSION_URL, args.timeout, args.retries)
        data_timestamp = version.get("dataTimestamp")
    except Exception as error:  # noqa: BLE001 - report and continue with null timestamp
        data_timestamp = None
        failures.append({"scope": "version", "error": str(error)})

    # Three concurrent condition queries keep the run practical without
    # hammering the public registry. Pagination inside each query remains
    # sequential so each nextPageToken is consumed in order.
    with ThreadPoolExecutor(max_workers=3) as executor:
        jobs = {
            executor.submit(fetch_cancer, cancer_slug, condition, statuses, args): cancer_slug
            for cancer_slug, condition in CANCERS
        }
        for job in as_completed(jobs):
            cancer_slug = jobs[job]
            try:
                records, pages = job.result()
                all_records.extend(records)
                query_pages[cancer_slug] = pages
                print(f"{cancer_slug}: {len(records)} records across {pages} page(s)", flush=True)
            except Exception as error:  # noqa: BLE001 - preserve per-cancer failures
                failures.append({"scope": cancer_slug, "error": str(error)})
                print(f"{cancer_slug}: FAILED: {error}", file=sys.stderr, flush=True)

    records = merge_records(all_records)
    validation_errors = validate(records, args.include_closed)
    if failures:
        validation_errors.extend(f"{item['scope']}: {item['error']}" for item in failures)

    status_counts = Counter(record.get("statusCode", "UNKNOWN") for record in records)
    cancer_counts: dict[str, int] = defaultdict(int)
    for record in records:
        for cancer in record.get("cancers", []):
            cancer_counts[cancer] += 1

    snapshot = {
        "schemaVersion": 1,
        "generatedAt": run_at,
        "dataTimestamp": data_timestamp,
        "source": "ClinicalTrials.gov API v2",
        "query": {
            "cancers": [{"slug": slug, "condition": condition} for slug, condition in CANCERS],
            "statuses": statuses,
            "pageSize": args.page_size,
            "maxPages": args.max_pages or None,
        },
        "summary": {
            "records": len(records),
            "uniqueRecords": len({record["id"] for record in records}),
            "statusCounts": dict(sorted(status_counts.items())),
            "cancerCounts": dict(sorted(cancer_counts.items())),
            "queryPages": query_pages,
            "validationErrors": len(validation_errors),
            "failedScopes": len(failures),
        },
        "records": records,
    }

    stamp = run_at.replace(":", "").replace("-", "")
    timestamped = args.output_dir / f"ctgov-{stamp}.json"
    latest = args.output_dir / "ctgov-latest.json"
    report = args.output_dir / "ctgov-latest.report.json"
    encoded = json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n"
    timestamped.write_text(encoded, encoding="utf-8")
    latest.write_text(encoded, encoding="utf-8")
    report.write_text(json.dumps({**snapshot["summary"], "generatedAt": run_at, "dataTimestamp": data_timestamp, "errors": validation_errors}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    if args.typescript_output:
        write_typescript(args.typescript_output, records, snapshot_date)

    print(f"snapshot: {latest}")
    print(f"records: {len(records)}; validation errors: {len(validation_errors)}")
    print(f"dataTimestamp: {data_timestamp or 'unavailable'}")
    if validation_errors:
        for error in validation_errors[:20]:
            print(f"ERROR: {error}", file=sys.stderr)
        if len(validation_errors) > 20:
            print(f"ERROR: ... and {len(validation_errors) - 20} more", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
