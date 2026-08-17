#!/usr/bin/env python3
"""Rebuild TrialBeacon's frontend frontier-trial assets from the latest CT.gov snapshot."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SNAPSHOT = ROOT / "data" / "snapshots" / "ctgov-latest.json"
DEFAULT_ANALYSIS_ROOT = ROOT / "data" / "analysis"
FRONTEND_DATA = ROOT / "lib" / "data"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--snapshot", type=Path, default=DEFAULT_SNAPSHOT)
    parser.add_argument("--analysis-root", type=Path, default=DEFAULT_ANALYSIS_ROOT)
    parser.add_argument("--skip-charts", action="store_true", help="Skip PNG chart generation in CI.")
    return parser.parse_args()


def run(command: list[str]) -> None:
    print("$", " ".join(command), flush=True)
    subprocess.run(command, cwd=ROOT, check=True)


def build_matrix(candidates_path: Path, output_path: Path) -> None:
    candidates = json.loads(candidates_path.read_text(encoding="utf-8"))
    cancer_labels = {
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
    phases = [
        "Early Phase 1", "Phase 1", "Phase 1/2", "Phase 2", "Phase 2/3",
        "Phase 3", "Not applicable", "Not specified",
    ]
    rows = []
    for cancer, label in cancer_labels.items():
        row = {"cancer": cancer, "label": label, **{phase: 0 for phase in phases}}
        for candidate in candidates:
            if cancer in candidate.get("cancers", []):
                row[candidate.get("phase") or "Not specified"] = row.get(candidate.get("phase") or "Not specified", 0) + 1
        row["total"] = sum(row[phase] for phase in phases)
        rows.append(row)
    payload = {
        "candidates": len(candidates),
        "cancers": rows,
        "phaseTotals": {phase: sum(row[phase] for row in rows) for phase in phases},
        "phases": phases,
    }
    output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    args = parse_args()
    snapshot = args.snapshot if args.snapshot.is_absolute() else ROOT / args.snapshot
    if not snapshot.exists():
        raise SystemExit(f"Snapshot not found: {snapshot}")

    run_date = datetime.now(timezone.utc).date().isoformat()
    analysis_dir = args.analysis_root / f"frontier-trials-{run_date}"
    filter_dir = analysis_dir
    matrix_dir = analysis_dir / "phase-matrix"
    filter_dir.mkdir(parents=True, exist_ok=True)
    matrix_dir.mkdir(parents=True, exist_ok=True)

    run([sys.executable, "scripts/filter_frontier_trials.py", str(snapshot), "--output-dir", str(filter_dir)])
    if args.skip_charts:
        candidates = filter_dir / "candidates.json"
        matrix_path = matrix_dir / "matrix.json"
        build_matrix(candidates, matrix_path)
    else:
        run([sys.executable, "scripts/analyze_frontier_phase_matrix.py", str(filter_dir / "candidates.json"), "--output-dir", str(matrix_dir)])
        matrix_path = matrix_dir / "matrix.json"

    FRONTEND_DATA.mkdir(parents=True, exist_ok=True)
    shutil.copy2(filter_dir / "candidates.json", FRONTEND_DATA / "frontier-trials.json")
    shutil.copy2(matrix_path, FRONTEND_DATA / "frontier-phase-matrix.json")

    summary = json.loads((filter_dir / "summary.json").read_text(encoding="utf-8"))
    print(f"frontend assets updated: candidates={summary.get('matched', len(json.loads((filter_dir / 'candidates.json').read_text())))}, analysis={analysis_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
