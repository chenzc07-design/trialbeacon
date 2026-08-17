#!/usr/bin/env python3
"""Filter recruiting ClinicalTrials.gov snapshot records for targeted/immunotherapy projects."""
from __future__ import annotations

import argparse
import csv
import json
import re
from collections import Counter
from pathlib import Path

TARGETED = {
    "targeted therapy", "targeted treatment", "precision medicine", "precision oncology",
    "kinase inhibitor", "inhibitor", "parp", "egfr", "alk", "ros1", "ret inhibitor",
    "met inhibitor", "kras", "g12c", "braf", "her2", "her-2", "pi3k", "akt inhibitor",
    "mtor", "fgfr", "vegf", "cdk4/6", "cdk4", "cdk6", "idh1", "idh2", "flt3", "btk",
    "bcl-2", "bcl2", "menin", "antibody-drug conjugate", "antibody drug conjugate", "adc",
    "bispecific antibody", "monoclonal antibody", "radioligand", "radioimmunotherapy",
}
IMMUNE = {
    "immunotherapy", "immune checkpoint", "checkpoint inhibitor", "pd-1", "pd1", "pd-l1",
    "pdl1", "ctla-4", "ctla4", "lag-3", "lag3", "tigit", "pembrolizumab", "nivolumab",
    "atezolizumab", "durvalumab", "cemiplimab", "dostarlimab", "tislelizumab", "toripalimab",
    "camrelizumab", "sintilimab", "ipilimumab", "car-t", "car t", "t-cell therapy",
    "t cell therapy", "tumor infiltrating lymphocyte", "tumour infiltrating lymphocyte", "til therapy",
    "oncolytic virus", "cancer vaccine", "tumor vaccine", "tumour vaccine", "bispecific t-cell engager",
}
BIOMARKER = {
    "biomarker", "molecularly selected", "mutation", "mutant", "fusion", "rearrangement",
    "amplification", "expression", "genomic", "genotype", "molecular profiling", "liquid biopsy",
}
FRONTIER = {
    "car-t", "car t", "t-cell therapy", "til therapy", "tumor infiltrating lymphocyte",
    "bispecific", "antibody-drug conjugate", "radioligand", "oncolytic virus", "cancer vaccine",
    "first-in-human", "first in human", "novel", "mrna", "crispr", "gene therapy",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("snapshot", type=Path)
    parser.add_argument("--output-dir", type=Path, default=Path("data/analysis/frontier-trials-2026-08-17"))
    parser.add_argument("--top", type=int, default=100)
    return parser.parse_args()


def find_hits(text: str, terms: set[str]) -> list[str]:
    lowered = text.casefold()
    return sorted(term for term in terms if term in lowered)


def phase_rank(phase: str | None) -> int:
    if not phase:
        return 0
    match = re.search(r"Phase (\d)", phase)
    return int(match.group(1)) if match else 0


def main() -> int:
    args = parse_args()
    payload = json.loads(args.snapshot.read_text(encoding="utf-8"))
    records = payload.get("records", [])
    recruiting = [record for record in records if record.get("statusCode") == "RECRUITING"]
    candidates: list[dict] = []
    for record in recruiting:
        evidence_fields = {
            "title": record.get("title", ""),
            "interventions": " ".join(record.get("interventions") or []),
            "conditions": " ".join(record.get("cancers") or []),
            "sponsor": record.get("sponsor", ""),
        }
        evidence_text = " | ".join(str(value) for value in evidence_fields.values())
        target_hits = find_hits(evidence_text, TARGETED)
        immune_hits = find_hits(evidence_text, IMMUNE)
        biomarker_hits = find_hits(evidence_text, BIOMARKER)
        frontier_hits = find_hits(evidence_text, FRONTIER)
        if not target_hits and not immune_hits:
            continue
        modality = []
        if target_hits:
            modality.append("targeted")
        if immune_hits:
            modality.append("immunotherapy")
        score = len(set(target_hits)) + len(set(immune_hits)) + min(len(set(frontier_hits)), 3) + (1 if biomarker_hits else 0)
        candidates.append({
            "id": record.get("id"),
            "title": record.get("title"),
            "url": record.get("url"),
            "cancers": record.get("cancers", []),
            "phase": record.get("phase"),
            "status": record.get("status"),
            "date": record.get("date"),
            "sponsor": record.get("sponsor"),
            "interventions": record.get("interventions", []),
            "modality": modality,
            "targetedEvidence": target_hits,
            "immuneEvidence": immune_hits,
            "biomarkerEvidence": biomarker_hits,
            "frontierEvidence": frontier_hits,
            "score": score,
        })

    candidates.sort(key=lambda item: (-item["score"], -phase_rank(item.get("phase")), item.get("date", ""), item.get("id", "")), reverse=False)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    summary = {
        "snapshot": str(args.snapshot),
        "generatedAt": payload.get("generatedAt"),
        "dataTimestamp": payload.get("dataTimestamp"),
        "recruitingRecords": len(recruiting),
        "matchedRecords": len(candidates),
        "targetedOnly": sum(item["modality"] == ["targeted"] for item in candidates),
        "immunotherapyOnly": sum(item["modality"] == ["immunotherapy"] for item in candidates),
        "bothModalities": sum(len(item["modality"]) == 2 for item in candidates),
        "cancerCounts": dict(Counter(cancer for item in candidates for cancer in item["cancers"])),
        "phaseCounts": dict(Counter(item.get("phase") or "Not specified" for item in candidates)),
        "method": "Keyword evidence from title, interventions, cancer tags and sponsor; manual review recommended.",
    }
    (args.output_dir / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (args.output_dir / "candidates.json").write_text(json.dumps(candidates, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    columns = ["id", "title", "url", "cancers", "phase", "status", "date", "sponsor", "interventions", "modality", "targetedEvidence", "immuneEvidence", "biomarkerEvidence", "frontierEvidence", "score"]
    with (args.output_dir / "candidates.csv").open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns)
        writer.writeheader()
        for item in candidates:
            writer.writerow({column: ", ".join(item[column]) if isinstance(item[column], list) else item[column] for column in columns})

    top = candidates[: args.top]
    lines = [
        "# Recruiting targeted and immunotherapy candidates",
        "",
        f"This index filters **{len(recruiting)} Recruiting records** and returns **{len(candidates)} candidates** based on explicit keyword evidence in titles, intervention names, cancer tags and sponsor fields.",
        "",
        "> This is a research-index filter, not a clinical recommendation. Keyword matching can produce false positives and miss projects whose mechanism is described only in the full registry record.",
        "",
        "## Summary",
        "",
        f"- Targeted therapy only: **{summary['targetedOnly']}**",
        f"- Immunotherapy only: **{summary['immunotherapyOnly']}**",
        f"- Both modalities: **{summary['bothModalities']}**",
        f"- API data timestamp: `{payload.get('dataTimestamp', 'n/a')}`",
        "",
        f"## Top {len(top)} candidates",
        "",
        "| Rank | NCT | Modality | Phase | Cancer | Evidence | Title |",
        "|---:|---|---|---|---|---|---|",
    ]
    for rank, item in enumerate(top, 1):
        evidence = "; ".join(item["targetedEvidence"] + item["immuneEvidence"] + item["frontierEvidence"][:2])
        title = str(item.get("title", "")).replace("|", "—")
        lines.append(f"| {rank} | [{item['id']}]({item['url']}) | {', '.join(item['modality'])} | {item.get('phase', '—')} | {', '.join(item.get('cancers', []))} | {evidence} | {title} |")
    lines += [
        "",
        "## Interpretation and limitations",
        "",
        "The ranking is an evidence score, not a measure of clinical efficacy, safety, novelty, or likelihood of benefit. Terms such as `inhibitor`, `mutation`, or `monoclonal antibody` can be broad and may not prove a study is a precision-targeted or immune-checkpoint project. Full registry review is required before publication or patient-facing use.",
        "",
        "The current snapshot is bounded at up to 100 recently updated records per cancer query. It therefore represents a recent index sample, not every Recruiting study in ClinicalTrials.gov.",
    ]
    (args.output_dir / "report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"recruiting={len(recruiting)} matched={len(candidates)} output={args.output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
