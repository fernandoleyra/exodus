<!--
SPDX-FileCopyrightText: Exodus contributors
SPDX-License-Identifier: CC-BY-4.0
-->

# Contributing

```bash
cd apps/web
npm install
npm run fetch      # geometry, World Bank indicators, both bilateral models (~210 MB)
npm run snapshot   # builds the committed snapshot
npm run dev
npm run verify     # typecheck + tests, and what CI runs
```

## The one rule

**Never render a number the repository cannot source.** If a figure has no traceable origin,
show an em-dash and say why. Every number on screen carries its source, its vintage and its
estimate kind, and a missing value is never a zero. A pull request that adds an unsourced
figure will be declined however good it looks.

## Adding a data source

A source is only acceptable if its licence permits redistribution of a derived dataset. CC BY
and public domain are fine. Non-commercial or no-derivatives clauses are not, however useful
the data — several obvious sources are deliberately absent for exactly this reason, and they
are listed on the sources page so their absence is visible.

Add the attribution the licence requires, including a statement of what you changed, and say
plainly whether the values are observed or modelled.

## The placement module

`apps/web/src/placement/` holds person-shaped types and is excluded from the public build by
two enforced tests. Do not import it from anywhere outside that directory, and do not add a
legal-basis value that could express a removal. Both are checked in CI, and both checks exist
because the alternative is a tool that can be quietly repurposed.

## Style

Match what is there. Comments explain *why*, never *what*. If a decision looks strange, the
comment should say what it prevents.
