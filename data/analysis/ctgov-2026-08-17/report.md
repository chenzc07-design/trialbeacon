# TrialBeacon ClinicalTrials.gov Snapshot Analysis

The analysis covers **832 records** from `data/snapshots/ctgov-latest.json`. The API data timestamp is `2026-08-17T09:00:05` and the snapshot was generated at `2026-08-17T14:22:47Z`.

> Counts are descriptive statistics for this bounded snapshot; they are not estimates of all cancer trials in ClinicalTrials.gov.

## Recruitment status

| Status | Count | Share |
|---|---:|---:|
| Recruiting | 521 | 62.6% |
| Active, not recruiting | 174 | 20.9% |
| Not yet recruiting | 123 | 14.8% |
| Enrolling by invitation | 14 | 1.7% |

## Cancer type

| Cancer type | Count | Share of records |
|---|---:|---:|
| Breast cancer | 100 | 12.0% |
| Colorectal cancer | 100 | 12.0% |
| Esophageal cancer | 100 | 12.0% |
| Gastric cancer | 100 | 12.0% |
| Leukemia | 100 | 12.0% |
| Liver cancer | 100 | 12.0% |
| Lung cancer | 100 | 12.0% |
| Lymphoma | 100 | 12.0% |
| Ovarian cancer | 100 | 12.0% |
| Pancreatic cancer | 100 | 12.0% |
| Prostate cancer | 100 | 12.0% |

## Interpretation

The largest recruitment-status group is **Recruiting** with 521 records (62.6%). The largest cancer-type query group is **Breast cancer** with 100 records.

Because the snapshot was collected separately for each cancer query and records may carry more than one cancer tag, cancer-type totals should be interpreted as query coverage rather than a mutually exclusive partition. The status totals are mutually exclusive for each deduplicated record.

## Generated files

- `recruitment-status.png` — recruitment status bar chart
- `cancer-type-distribution.png` — cancer type bar chart
- `cancer-status-heatmap.png` — cancer type by recruitment status heatmap
- `summary.json` — machine-readable summary
