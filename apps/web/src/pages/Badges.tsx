/** Credentials. Each carries its own honesty label, because a badge whose basis is not
 *  stated is exactly the kind of unearned authority this project exists to argue against.
 *
 *  `earned`        — the repository or CI demonstrably satisfies it, verifiable by anyone.
 *  `self-assessed` — we answered a public questionnaire truthfully; nobody audited it.
 *  `not-held`      — listed precisely so the absence is visible rather than implied away.
 */
export type BadgeBasis = 'earned' | 'self-assessed' | 'not-held';

export interface Badge {
  id: string;
  name: string;
  basis: BadgeBasis;
  what: string;
  how: string;
  href?: string;
}

export const BADGE_BASIS_LABEL: Record<BadgeBasis, string> = {
  earned: 'verifiable',
  'self-assessed': 'self-declared',
  'not-held': 'not held',
};

export const BADGES: Badge[] = [
  {
    id: 'no-tracking', name: 'No tracking, by construction', basis: 'earned',
    what: 'No cookies, no analytics, no telemetry, no accounts, no third-party requests at runtime.',
    how: 'Verifiable by anyone: open developer tools, watch the network panel, inspect storage. The built bundle contains no analytics SDK. Nothing is sent anywhere.',
  },
  {
    id: 'no-personal-data', name: 'No personal data processed', basis: 'earned',
    what: 'The public application holds no data about identifiable people.',
    how: 'Every published figure is a country-level or corridor-level aggregate. The placement module, which is the only component with person-shaped types, is excluded from the public build by an enforced test.',
  },
  {
    id: 'open-data', name: 'Open data, attributed', basis: 'earned',
    what: 'Every dataset is openly licensed and attributed in full, with its vintage.',
    how: 'CC BY-4.0 and public domain only. Nothing under a non-commercial or no-derivatives licence is redistributed. See the source ledger.',
    href: '#/sources',
  },
  {
    id: 'reproducible', name: 'Reproducible build', basis: 'earned',
    what: 'A clean clone rebuilds the shipped dataset byte-for-byte from published sources.',
    how: 'npm run fetch && npm run snapshot. No hidden inputs, no manual steps, no private data.',
  },
  {
    id: 'offline', name: 'Runs fully offline', basis: 'earned',
    what: 'After install, the whole world renders with networking disabled.',
    how: 'All data ships as a committed static snapshot. No runtime API calls, so nothing about your session can leak to a data provider.',
  },
  {
    id: 'agpl', name: 'AGPL-3.0-or-later', basis: 'earned',
    what: 'Copyleft: anyone running a modified version over a network must offer its source.',
    how: 'Chosen over a permissive licence deliberately, so an institution cannot fork this into a closed migration-control tool.',
  },
  {
    id: 'openssf', name: 'OpenSSF Best Practices', basis: 'self-assessed',
    what: 'The Open Source Security Foundation’s public questionnaire on project practices.',
    how: 'Self-certified against the published criteria. Nobody audits these answers — the badge records what a project claims about itself, and ours is filled in honestly.',
    href: 'https://www.bestpractices.dev/',
  },
  {
    id: 'iso', name: 'ISO 27001 / SOC 2 / GDPR certification', basis: 'not-held',
    what: 'Audited information-security and privacy certifications.',
    how: 'We hold none of these and do not display their marks. They require a paid independent audit. Any project showing such a seal without one is misrepresenting itself — and this page exists so our absence is stated rather than left ambiguous.',
  },
];
