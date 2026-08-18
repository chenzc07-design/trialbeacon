#!/usr/bin/env node
/**
 * Validate GitHub App credentials without printing secret values.
 *
 * Local checks:
 *   GITHUB_APP_CLIENT_ID or TRIALBEACON_APP_ID
 *   GITHUB_APP_PRIVATE_KEY or TRIALBEACON_APP_PRIVATE_KEY
 *
 * API checks:
 *   GITHUB_TOKEN (an installation token created by actions/create-github-app-token)
 *   GITHUB_REPOSITORY, default: chenzc07-design/trialbeacon
 *
 * The script never prints a token, private key, fingerprint, or secret length.
 */
import crypto from 'node:crypto';

const repository = process.env.GITHUB_REPOSITORY || 'chenzc07-design/trialbeacon';
const [owner, repo] = repository.split('/');
const clientId = process.env.GITHUB_APP_CLIENT_ID || process.env.TRIALBEACON_APP_ID || '';
const privateKey = process.env.GITHUB_APP_PRIVATE_KEY || process.env.TRIALBEACON_APP_PRIVATE_KEY || '';
const installationToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const apiBase = process.env.GITHUB_API_URL || 'https://api.github.com';
const apiVersion = '2022-11-28';

if (!owner || !repo || repository.split('/').length !== 2) {
  fail('GITHUB_REPOSITORY must have the form owner/repository.');
}

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

function checkClientId() {
  if (!clientId) {
    fail('GitHub App Client ID is missing from GITHUB_APP_CLIENT_ID/TRIALBEACON_APP_ID.');
    return false;
  }
  // GitHub App Client IDs use the Iv1. prefix; a numeric value is the App ID,
  // which is not accepted by the action's client-id input.
  if (!/^Iv1\./.test(clientId)) {
    fail('Value does not look like a GitHub App Client ID (expected the Iv1. prefix, not the numeric App ID).');
    return false;
  }
  pass('GitHub App Client ID is present and has the expected format.');
  return true;
}

function checkPrivateKey() {
  if (!privateKey) {
    fail('GitHub App private key is missing from GITHUB_APP_PRIVATE_KEY/TRIALBEACON_APP_PRIVATE_KEY.');
    return false;
  }
  try {
    const key = crypto.createPrivateKey({ key: privateKey, format: 'pem' });
    if (key.asymmetricKeyType !== 'rsa') {
      fail('Private key is valid PEM but is not an RSA key.');
      return false;
    }
    pass('GitHub App private key is a parseable RSA PEM key.');
    return true;
  } catch {
    fail('GitHub App private key is not a valid parseable PEM key; check line breaks and App pairing.');
    return false;
  }
}

async function githubRequest(path, options = {}) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': apiVersion,
    'User-Agent': 'TrialBeacon-secret-verifier',
    ...(options.headers || {}),
  };
  const response = await fetch(`${apiBase}${path}`, { ...options, headers });
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  return { response, body };
}

async function checkInstallationToken() {
  if (!installationToken) {
    console.log('INFO: GITHUB_TOKEN/GH_TOKEN is absent; skipped API permission checks.');
    return true;
  }

  const authHeaders = { Authorization: `Bearer ${installationToken}` };
  const { response, body } = await githubRequest(`/repos/${owner}/${repo}`, {
    headers: authHeaders,
  });
  if (!response.ok) {
    fail(`Installation token cannot access ${repository} (HTTP ${response.status}).`);
    return false;
  }

  const permissions = body?.permissions || {};
  if (permissions.contents !== 'write') {
    fail('Installation token does not report Contents: write permission.');
    return false;
  }
  pass(`Installation token can access ${repository} with Contents: write.`);
  return true;
}

async function main() {
  const localOk = checkClientId() && checkPrivateKey();
  const apiOk = await checkInstallationToken();
  if (localOk && apiOk) {
    pass('GitHub App Secret validation completed without exposing secret values.');
  } else {
    process.exitCode = 1;
  }
}

main().catch(() => {
  fail('Unexpected validation error while contacting GitHub API.');
});
