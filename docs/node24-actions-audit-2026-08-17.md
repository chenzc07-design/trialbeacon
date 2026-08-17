# GitHub Actions Node.js 24 compatibility audit

The recent TrialBeacon runs completed successfully but were annotated because the runner forced actions targeting Node.js 20 to execute under Node.js 24. The affected workflow references were checkout@v4, setup-node@v4, setup-python@v5, upload-artifact@v4, and pnpm/action-setup@v4.

Official repository documentation confirms the current Node.js 24-compatible major lines at the time of audit: actions/checkout v5, actions/setup-node v5, actions/setup-python v6, and actions/upload-artifact v4. The action repositories also show newer major lines in their current documentation; upgrading beyond the first Node 24-compatible line is a separate change and should be tested independently. Node 24 action versions require GitHub Actions Runner v2.327.1 or newer, which is available on GitHub-hosted ubuntu-latest runners.

The application runtime remains Node.js 20 in CI; this is intentionally separate from the JavaScript runtime embedded inside the actions. The warning is an action-runtime deprecation annotation, not an application failure. The minimal remediation is to update the action references to their first Node 24-compatible major lines while keeping node-version: 20 for the TrialBeacon build until the Next.js runtime upgrade is separately planned.

Sources:
- https://github.com/actions/checkout
- https://github.com/actions/setup-node
- https://github.com/actions/setup-python
- https://github.com/actions/upload-artifact
- https://github.com/pnpm/action-setup/issues/209
