<!--
SPDX-FileCopyrightText: Exodus contributors
SPDX-License-Identifier: CC-BY-4.0
-->

# Security policy

## Reporting a vulnerability

Report privately through GitHub's **Report a vulnerability** button under the Security tab
of this repository. That opens a channel visible only to maintainers.

Please do not open a public issue for anything exploitable.

We aim to acknowledge within 7 days and to publish a fix or a clear statement of why one is
not needed within 90 days. You will be credited unless you prefer otherwise.

## Scope

This is a static web application. It has no server, no database, no accounts, no session
handling and no user input that reaches a backend, which removes most of the usual attack
surface. What remains, and what we care about:

- **Supply chain.** A malicious or compromised dependency reaching the built bundle.
- **Data integrity.** Anything that causes the shipped snapshot to misrepresent its sources —
  a wrong join, a silent truncation, a mislabelled vintage. We treat a correctness defect
  that makes the product *lie* as a security issue, not merely a bug.
- **Cross-site scripting** via rendered data, if a future connector ingests a source we do
  not control.
- **Leakage.** Anything causing the application to transmit information about a visitor. It
  is designed to transmit nothing; a defect that breaks that promise is high severity.

## Out of scope

- Findings against a third party's copy of this software that they have modified.
- Missing security headers on a deployment we do not operate. Hosting is the operator's
  responsibility; we ship no server.
- Automated scanner output with no demonstrated impact.

## What we do not have

No paid security audit, no penetration test, no ISO 27001 or SOC 2 certification. If that
matters for your use, commission one — the source is public and the build is reproducible,
so anyone can.
