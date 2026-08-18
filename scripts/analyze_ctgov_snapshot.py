#!/usr/bin/env python3
"""Analyze a TrialBeacon ClinicalTrials.gov snapshot and render charts."""
from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib import font_manager

STATUS_LABELS = {
    "RECRUITING": "Recruiting",
    "NOT_YET_RECRUITING": "Not yet recruiting",
    "ENROLLING_BY_INVITATION": "Enrolling by invitation",
    "ACTIVE_NOT_RECRUITING": "Active, not recruiting",
}
CANCER_LABELS = {
    "lung": "Lung cancer",
    "breast": "Breast cancer",
    "colorectal": "Colorectal cancer",
    "liver": "Liver cancer",
    "gastric": "Gastric cancer",
    "pancreatic": "Pancreatic cancer",
    "prostate": "Prostate cancer",
    "ovarian": "Ovarian cancer",
    "esophageal": "Esophageal cancer",
    "lymphoma": "Lymphoma",
    "leukemia": "Leukemia",
}


def choose_font() -> str:
    candidates = [
        "Noto Sans CJK SC",
        "Noto Sans CJK JP",
        "Noto Sans CJK KR",
        "DejaVu Sans",
    ]
    installed = {font.name for font in font_manager.fontManager.ttflist}
    return next((name for name in candidates if name in installed), "DejaVu Sans")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("snapshot", type=Path)
    parser.add_argument("--output-dir", type=Path, default=Path("data/analysis/ctgov-2026-08-17"))
    args = parser.parse_args()
    repo_root = Path(__file__).resolve().parents[1]
    snapshot_path = args.snapshot.resolve()
    try:
        snapshot_label = snapshot_path.relative_to(repo_root).as_posix()
    except ValueError:
        # Do not leak an absolute path when analyzing a snapshot outside the repo.
        snapshot_label = snapshot_path.name
    payload = json.loads(args.snapshot.read_text(encoding="utf-8"))
    records = payload["records"]
    args.output_dir.mkdir(parents=True, exist_ok=True)

    font_name = choose_font()
    plt.rcParams.update({
        "font.family": font_name,
        "axes.unicode_minus": False,
        "figure.dpi": 150,
        "savefig.dpi": 180,
    })

    status_counts = Counter(record.get("statusCode", "UNKNOWN") for record in records)
    cancer_counts = Counter(cancer for record in records for cancer in record.get("cancers", []))
    total = len(records)

    status_rows = []
    for code, count in sorted(status_counts.items(), key=lambda item: (-item[1], item[0])):
        status_rows.append({"code": code, "label": STATUS_LABELS.get(code, code.replace("_", " ").title()), "count": count, "share": count / total})
    cancer_rows = []
    for slug, count in sorted(cancer_counts.items(), key=lambda item: (-item[1], item[0])):
        cancer_rows.append({"slug": slug, "label": CANCER_LABELS.get(slug, slug), "count": count, "share": count / total})

    (args.output_dir / "summary.json").write_text(json.dumps({
        "snapshot": snapshot_label,
        "generatedAt": payload.get("generatedAt"),
        "dataTimestamp": payload.get("dataTimestamp"),
        "records": total,
        "status": status_rows,
        "cancers": cancer_rows,
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    # Status bar chart.
    fig, ax = plt.subplots(figsize=(10, 5.8))
    labels = [row["label"] for row in status_rows][::-1]
    values = [row["count"] for row in status_rows][::-1]
    bars = ax.barh(labels, values, color=["#1f6f8b", "#56a3a6", "#8bc6c5", "#c9e4de"][::-1])
    ax.set_title("TrialBeacon — Recruitment status distribution", loc="left", fontsize=16, fontweight="bold", pad=16)
    ax.set_xlabel("Number of studies")
    ax.grid(axis="x", alpha=0.2)
    ax.set_axisbelow(True)
    for bar, value in zip(bars, values):
        ax.text(value + max(values) * 0.015, bar.get_y() + bar.get_height() / 2, f"{value} ({value / total:.1%})", va="center", fontsize=10)
    ax.spines[["top", "right", "left"]].set_visible(False)
    fig.text(0.01, 0.01, f"n={total:,} · API data timestamp: {payload.get('dataTimestamp', 'n/a')}", fontsize=8, color="#5c6770")
    fig.tight_layout(rect=(0, 0.03, 1, 1))
    fig.savefig(args.output_dir / "recruitment-status.png", bbox_inches="tight")
    plt.close(fig)

    # Cancer bar chart.
    fig, ax = plt.subplots(figsize=(11, 6.8))
    labels = [row["label"] for row in cancer_rows][::-1]
    values = [row["count"] for row in cancer_rows][::-1]
    bars = ax.barh(labels, values, color="#31688e")
    ax.set_title("TrialBeacon — Studies by cancer type", loc="left", fontsize=16, fontweight="bold", pad=16)
    ax.set_xlabel("Number of studies")
    ax.grid(axis="x", alpha=0.2)
    ax.set_axisbelow(True)
    for bar, value in zip(bars, values):
        ax.text(value + max(values) * 0.015, bar.get_y() + bar.get_height() / 2, f"{value}", va="center", fontsize=10)
    ax.spines[["top", "right", "left"]].set_visible(False)
    fig.text(0.01, 0.01, "Each study is assigned to the cancer query that returned it; duplicate NCT IDs were merged.", fontsize=8, color="#5c6770")
    fig.tight_layout(rect=(0, 0.03, 1, 1))
    fig.savefig(args.output_dir / "cancer-type-distribution.png", bbox_inches="tight")
    plt.close(fig)

    # Cross-tab heatmap, useful because records can carry multiple cancer tags.
    matrix = []
    for cancer in [row["slug"] for row in cancer_rows]:
        row = []
        for status in [item["code"] for item in status_rows]:
            row.append(sum(1 for record in records if cancer in record.get("cancers", []) and record.get("statusCode") == status))
        matrix.append(row)
    fig, ax = plt.subplots(figsize=(10.5, 7))
    image = ax.imshow(matrix, cmap="Blues", aspect="auto")
    ax.set_title("TrialBeacon — Cancer type × recruitment status", loc="left", fontsize=16, fontweight="bold", pad=16)
    ax.set_xticks(range(len(status_rows)), [row["label"] for row in status_rows], rotation=28, ha="right")
    ax.set_yticks(range(len(cancer_rows)), [row["label"] for row in cancer_rows])
    for i, row in enumerate(matrix):
        for j, value in enumerate(row):
            ax.text(j, i, str(value), ha="center", va="center", color="white" if value > max(max(r) for r in matrix) * 0.55 else "#17324d", fontsize=9)
    fig.colorbar(image, ax=ax, label="Number of studies", fraction=0.03, pad=0.02)
    fig.text(0.01, 0.01, "Counts are based on the localized snapshot records and may sum above n when records carry multiple cancer tags.", fontsize=8, color="#5c6770")
    fig.tight_layout(rect=(0, 0.03, 1, 1))
    fig.savefig(args.output_dir / "cancer-status-heatmap.png", bbox_inches="tight")
    plt.close(fig)

    report = [
        "# TrialBeacon ClinicalTrials.gov Snapshot Analysis",
        "",
        f"The analysis covers **{total:,} records** from `{snapshot_label}`. The API data timestamp is `{payload.get('dataTimestamp', 'n/a')}` and the snapshot was generated at `{payload.get('generatedAt', 'n/a')}`.",
        "",
        "> Counts are descriptive statistics for this bounded snapshot; they are not estimates of all cancer trials in ClinicalTrials.gov.",
        "",
        "## Recruitment status",
        "",
        "| Status | Count | Share |",
        "|---|---:|---:|",
    ]
    report.extend(f"| {row['label']} | {row['count']:,} | {row['share']:.1%} |" for row in status_rows)
    report += ["", "## Cancer type", "", "| Cancer type | Count | Share of records |", "|---|---:|---:|"]
    report.extend(f"| {row['label']} | {row['count']:,} | {row['share']:.1%} |" for row in cancer_rows)
    report += [
        "",
        "## Interpretation",
        "",
        f"The largest recruitment-status group is **{status_rows[0]['label']}** with {status_rows[0]['count']:,} records ({status_rows[0]['share']:.1%}). The largest cancer-type query group is **{cancer_rows[0]['label']}** with {cancer_rows[0]['count']:,} records.",
        "",
        "Because the snapshot was collected separately for each cancer query and records may carry more than one cancer tag, cancer-type totals should be interpreted as query coverage rather than a mutually exclusive partition. The status totals are mutually exclusive for each deduplicated record.",
        "",
        "## Generated files",
        "",
        "- `recruitment-status.png` — recruitment status bar chart",
        "- `cancer-type-distribution.png` — cancer type bar chart",
        "- `cancer-status-heatmap.png` — cancer type by recruitment status heatmap",
        "- `summary.json` — machine-readable summary",
    ]
    (args.output_dir / "report.md").write_text("\n".join(report) + "\n", encoding="utf-8")
    print(f"records={total}; output={args.output_dir}; font={font_name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
