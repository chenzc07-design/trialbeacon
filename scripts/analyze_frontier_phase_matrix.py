#!/usr/bin/env python3
"""Render cancer type x study phase distributions for frontier candidates."""
from __future__ import annotations

import argparse
import csv
import json
from collections import Counter, defaultdict
from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib import font_manager

CANCER_LABELS = {
    "lung": "Lung cancer", "breast": "Breast cancer", "colorectal": "Colorectal cancer",
    "liver": "Liver cancer", "gastric": "Gastric cancer", "pancreatic": "Pancreatic cancer",
    "prostate": "Prostate cancer", "ovarian": "Ovarian cancer", "esophageal": "Esophageal cancer",
    "lymphoma": "Lymphoma", "leukemia": "Leukemia",
}
PHASE_ORDER = ["Early Phase 1", "Phase 1", "Phase 1/2", "Phase 2", "Phase 2/3", "Phase 3", "Phase 4", "Not applicable", "Not specified"]


def choose_font() -> str:
    installed = {font.name for font in font_manager.fontManager.ttflist}
    for candidate in ("Noto Sans CJK SC", "Noto Sans CJK JP", "Noto Sans CJK KR", "DejaVu Sans"):
        if candidate in installed:
            return candidate
    return "DejaVu Sans"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("candidates", type=Path)
    parser.add_argument("--output-dir", type=Path, default=Path("data/analysis/frontier-trials-2026-08-17/phase-matrix"))
    args = parser.parse_args()
    candidates = json.loads(args.candidates.read_text(encoding="utf-8"))
    args.output_dir.mkdir(parents=True, exist_ok=True)
    cancers = sorted({cancer for item in candidates for cancer in item.get("cancers", [])}, key=lambda item: list(CANCER_LABELS).index(item) if item in CANCER_LABELS else 99)
    phases = [phase for phase in PHASE_ORDER if any((item.get("phase") or "Not specified") == phase for item in candidates)]
    matrix = {cancer: {phase: 0 for phase in phases} for cancer in cancers}
    for item in candidates:
        phase = item.get("phase") or "Not specified"
        for cancer in item.get("cancers", []):
            matrix.setdefault(cancer, {p: 0 for p in phases})
            matrix[cancer][phase] = matrix[cancer].get(phase, 0) + 1
    rows = []
    for cancer in cancers:
        row = {"cancer": cancer, "label": CANCER_LABELS.get(cancer, cancer)}
        row.update(matrix[cancer])
        row["total"] = sum(matrix[cancer].values())
        rows.append(row)
    phase_totals = {phase: sum(row.get(phase, 0) for row in rows) for phase in phases}
    payload = {"candidates": len(candidates), "cancers": rows, "phaseTotals": phase_totals, "phases": phases}
    (args.output_dir / "matrix.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    with (args.output_dir / "matrix.csv").open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["cancer", "label", *phases, "total"])
        writer.writeheader()
        writer.writerows(rows)

    font = choose_font()
    plt.rcParams.update({"font.family": font, "axes.unicode_minus": False, "figure.dpi": 150, "savefig.dpi": 180})
    values = [[row.get(phase, 0) for phase in phases] for row in rows]
    fig, ax = plt.subplots(figsize=(12, 7.5))
    image = ax.imshow(values, cmap="Blues", aspect="auto")
    ax.set_title("TrialBeacon — Frontier candidates by cancer type and study phase", loc="left", fontsize=16, fontweight="bold", pad=16)
    ax.set_xticks(range(len(phases)), phases, rotation=28, ha="right")
    ax.set_yticks(range(len(rows)), [row["label"] for row in rows])
    max_value = max(max(row) for row in values) if values else 1
    for i, row in enumerate(values):
        for j, value in enumerate(row):
            ax.text(j, i, str(value), ha="center", va="center", color="white" if value > max_value * 0.55 else "#17324d", fontsize=9)
    fig.colorbar(image, ax=ax, label="Number of candidates", fraction=0.03, pad=0.02)
    fig.text(0.01, 0.01, f"n={len(candidates)} candidate records · Multi-cancer records appear in each relevant cancer row.", fontsize=8, color="#5c6770")
    fig.tight_layout(rect=(0, 0.03, 1, 1))
    fig.savefig(args.output_dir / "cancer-phase-heatmap.png", bbox_inches="tight")
    plt.close(fig)

    # Stacked bars show composition by phase while preserving total candidate counts.
    fig, ax = plt.subplots(figsize=(12, 7.5))
    bottoms = [0] * len(rows)
    colors = plt.get_cmap("Blues")( [0.35 + 0.55 * i / max(1, len(phases) - 1) for i in range(len(phases))] )
    for phase, color in zip(phases, colors):
        vals = [row.get(phase, 0) for row in rows]
        ax.bar([row["label"] for row in rows], vals, bottom=bottoms, label=phase, color=color)
        bottoms = [bottom + value for bottom, value in zip(bottoms, vals)]
    ax.set_title("TrialBeacon — Phase composition of frontier candidates", loc="left", fontsize=16, fontweight="bold", pad=16)
    ax.set_ylabel("Number of candidates")
    ax.tick_params(axis="x", rotation=42)
    ax.grid(axis="y", alpha=0.2)
    ax.set_axisbelow(True)
    ax.spines[["top", "right"]].set_visible(False)
    ax.legend(ncol=3, frameon=False, loc="upper center", bbox_to_anchor=(0.5, -0.18))
    fig.text(0.01, 0.01, "Counts can overlap across cancer rows when a candidate has multiple cancer tags.", fontsize=8, color="#5c6770")
    fig.tight_layout(rect=(0, 0.13, 1, 1))
    fig.savefig(args.output_dir / "cancer-phase-stacked-bar.png", bbox_inches="tight")
    plt.close(fig)

    lines = [
        "# Frontier candidate cancer type × Phase analysis", "",
        f"The matrix covers **{len(candidates)} candidate records** selected from the Recruiting snapshot. Because one record may carry multiple cancer tags, cancer-row totals can exceed the number of unique candidates.", "",
        "> Phase is a registry field, not a measure of efficacy or clinical value. The figures describe the distribution of the filtered research index only.", "",
        "## Phase totals", "", "| Phase | Candidate assignments |", "|---|---:|",
    ]
    lines.extend(f"| {phase} | {phase_totals[phase]:,} |" for phase in phases)
    lines += ["", "## Cancer type × Phase", "", "| Cancer type | " + " | ".join(phases) + " | Total |", "|---|" + "---:|" * (len(phases) + 1)]
    lines.extend("| " + row["label"] + " | " + " | ".join(str(row.get(phase, 0)) for phase in phases) + " | " + str(row["total"]) + " |" for row in rows)
    lines += ["", "## Interpretation", "", "The matrix makes it possible to distinguish mature late-phase candidates from early-stage exploratory candidates within each cancer type. It should not be interpreted as a ranking of treatments: the candidate list was generated through keyword evidence, and the underlying snapshot is capped at the most recently updated records per cancer query.", "", "## Generated files", "", "- `cancer-phase-heatmap.png` — annotated cancer type × Phase heatmap", "- `cancer-phase-stacked-bar.png` — stacked phase composition chart", "- `matrix.json` and `matrix.csv` — machine-readable matrices"]
    (args.output_dir / "report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"candidates={len(candidates)}; cancers={len(cancers)}; phases={len(phases)}; output={args.output_dir}; font={font}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
