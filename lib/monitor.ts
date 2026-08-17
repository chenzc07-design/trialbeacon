import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

type JsonRecord = Record<string, unknown>;

type GitHubRun = {
  id: number;
  name: string;
  workflowPath?: string;
  status: string;
  conclusion: string | null;
  event: string;
  branch: string;
  runNumber: number;
  createdAt: string;
  updatedAt: string;
  url: string;
};

export type MonitorSnapshot = {
  generatedAt: string;
  github: {
    configured: boolean;
    repository: string;
    fetchedAt: string;
    runs: GitHubRun[];
    error?: string;
  };
  sync: {
    status: 'healthy' | 'stale' | 'degraded' | 'missing';
    generatedAt: string | null;
    dataTimestamp: string | null;
    ageHours: number | null;
    records: number;
    recruitingRecords: number;
    validationErrors: number;
    failedScopes: number;
    errors: string[];
  };
  frontier: {
    status: 'healthy' | 'stale' | 'missing';
    generatedAt: string | null;
    candidates: number;
    targetedOnly: number;
    immunotherapyOnly: number;
    bothModalities: number;
  };
};

const repoRoot = process.cwd();
const now = () => new Date().toISOString();

async function readJson(relativePath: string): Promise<JsonRecord | null> {
  try {
    const content = await readFile(path.join(repoRoot, relativePath), 'utf8');
    const parsed: unknown = JSON.parse(content);
    return parsed && typeof parsed === 'object' ? (parsed as JsonRecord) : null;
  } catch {
    return null;
  }
}

async function readLatestFrontierSummary(): Promise<JsonRecord | null> {
  try {
    const entries = await readdir(path.join(repoRoot, 'data/analysis'), { withFileTypes: true });
    const directories = entries
      .filter((entry) => entry.isDirectory() && /^frontier-trials-\\d{4}-\\d{2}-\\d{2}$/.test(entry.name))
      .map((entry) => entry.name)
      .sort()
      .reverse();
    return directories.length > 0
      ? readJson(`data/analysis/${directories[0]}/summary.json`)
      : null;
  } catch {
    return null;
  }
}

function numberValue(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function ageInHours(timestamp: string | null): number | null {
  if (!timestamp) return null;
  const time = Date.parse(timestamp);
  if (!Number.isFinite(time)) return null;
  return Math.max(0, (Date.now() - time) / 3_600_000);
}

async function getGitHubRuns(): Promise<MonitorSnapshot['github']> {
  const repository = process.env.GITHUB_REPOSITORY || 'chenzc07-design/trialbeacon';
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'TrialBeacon-monitor',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const response = await fetch(
      `https://api.github.com/repos/${repository}/actions/runs?per_page=20`,
      { headers, next: { revalidate: 120 } },
    );
    if (!response.ok) {
      return {
        configured: Boolean(token),
        repository,
        fetchedAt: now(),
        runs: [],
        error: `GitHub API 返回 HTTP ${response.status}`,
      };
    }
    const body = (await response.json()) as { workflow_runs?: Array<Record<string, unknown>> };
    const runs = (body.workflow_runs || []).map((run) => ({
      id: numberValue(run.id),
      name: stringValue(run.name) || 'Unknown workflow',
      workflowPath: stringValue(run.path) || undefined,
      status: stringValue(run.status) || 'unknown',
      conclusion: stringValue(run.conclusion),
      event: stringValue(run.event) || 'unknown',
      branch: stringValue(run.head_branch) || 'unknown',
      runNumber: numberValue(run.run_number),
      createdAt: stringValue(run.created_at) || '',
      updatedAt: stringValue(run.updated_at) || '',
      url: stringValue(run.html_url) || `https://github.com/${repository}/actions`,
    }));
    return { configured: Boolean(token), repository, fetchedAt: now(), runs };
  } catch (error) {
    return {
      configured: Boolean(token),
      repository,
      fetchedAt: now(),
      runs: [],
      error: error instanceof Error ? error.message : '无法连接 GitHub API',
    };
  }
}

export async function getMonitorSnapshot(): Promise<MonitorSnapshot> {
  const [report, frontier, github] = await Promise.all([
    readJson('data/snapshots/ctgov-latest.report.json'),
    readLatestFrontierSummary(),
    getGitHubRuns(),
  ]);
  const generatedAt = stringValue(report?.generatedAt);
  const dataTimestamp = stringValue(report?.dataTimestamp);
  const ageHours = ageInHours(generatedAt);
  const validationErrors = numberValue(report?.validationErrors);
  const failedScopes = numberValue(report?.failedScopes);
  const errors = Array.isArray(report?.errors)
    ? report.errors.filter((error): error is string => typeof error === 'string').slice(0, 8)
    : [];
  const syncStatus = !report
    ? 'missing'
    : validationErrors > 0 || failedScopes > 0 || errors.length > 0
      ? 'degraded'
      : ageHours !== null && ageHours > 240
        ? 'stale'
        : 'healthy';
  const frontierGeneratedAt = stringValue(frontier?.generatedAt);
  const frontierAge = ageInHours(frontierGeneratedAt);

  return {
    generatedAt: now(),
    github,
    sync: {
      status: syncStatus,
      generatedAt,
      dataTimestamp,
      ageHours,
      records: numberValue(report?.records),
      recruitingRecords: numberValue(
        (report?.statusCounts as JsonRecord | undefined)?.RECRUITING,
      ),
      validationErrors,
      failedScopes,
      errors,
    },
    frontier: {
      status: !frontier ? 'missing' : frontierAge !== null && frontierAge > 240 ? 'stale' : 'healthy',
      generatedAt: frontierGeneratedAt,
      candidates: numberValue(frontier?.matchedRecords),
      targetedOnly: numberValue(frontier?.targetedOnly),
      immunotherapyOnly: numberValue(frontier?.immunotherapyOnly),
      bothModalities: numberValue(frontier?.bothModalities),
    },
  };
}
