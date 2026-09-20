import { PageShell } from './PageShell';
import { BADGES, BADGE_BASIS_LABEL } from './Badges';
import { useStore } from '../state';
import { useEffect } from 'react';
import { ageDays } from '../vintage';

interface Src {
  id: string; title: string; author: string; licence: string; licenceUrl: string;
  locator: string; url: string; vintage: string; what: string; modified: string;
  /** Must equal the `vintage.producer` the adapters write, so the completeness test can join
   *  the ledger to what is actually shipping. A producer with layers and no row here is the
   *  failure this field exists to make impossible. */
  producer?: string;
  /** False where the publisher does not clearly grant commercial reuse. */
  commercialUseClear?: boolean;
}

/** CC BY 4.0 §3(a) requires: title, author, source, licence, and an indication of whether
 *  the material was modified. Every row below carries all five. */
export const SOURCES: Src[] = [
  {
    id: 'gaskin-abel',
    producer: 'Gaskin & Abel',
    title: 'Deep learning four decades of human migration: datasets',
    author: 'Thomas Gaskin, Guy J. Abel',
    licence: 'CC BY 4.0', licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
    locator: 'Zenodo 10.5281/zenodo.17344747 · mig_bilateral.csv',
    url: 'https://doi.org/10.5281/zenodo.17344747',
    vintage: 'annual, 1990–2023 · 230 countries',
    what: 'The spine. Bilateral migration flow estimates from a deep recurrent network over 18 covariates. Published alongside Nature 655(8121):148–157, doi:10.1038/s41586-026-10611-7.',
    modified: 'Modified: self-flows removed; column mig_prev taken as the flow; corridors reduced to the top nine destinations per origin by mean 2015–2023 volume; joined to ISO-3166-1 alpha-3.',
  },
  {
    id: 'abel-figshare',
    title: 'Bilateral international migration flow estimates by sex and type of move',
    author: 'Guy Abel',
    licence: 'CC BY 4.0', licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
    locator: 'figshare 14579241 · bilat_mig_sex_type.csv',
    url: 'https://doi.org/10.6084/m9.figshare.14579241',
    vintage: '5-year periods, 1990–2020',
    what: 'The second opinion. An independent demographic-accounting estimate of the same corridors, used to show how far two competent models disagree.',
    modified: 'Modified: summed across BOTH sex and type, neither of which ships a total row. Outward, return and transit are disjoint components of one flow \u2014 return is people going back to their country of birth, which is still migration along this corridor \u2014 so all three are added. Estimator da_pb_closed. No rescaling is applied: summed correctly the two models agree to 0.25% in aggregate.',
  },
  {
    id: 'wb-wdi',
    producer: 'World Bank',
    title: 'World Development Indicators',
    author: 'The World Bank',
    licence: 'CC BY 4.0', licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
    locator: 'SP.POP.TOTL · SM.POP.TOTL · SL.UEM.TOTL.ZS · NY.GDP.PCAP.PP.KD · SH.MED.BEDS.ZS · SH.MED.PHYS.ZS · SL.EMP.TOTL.SP.ZS · SE.PRM.ENRL.TC.ZS',
    url: 'https://databank.worldbank.org/source/world-development-indicators',
    vintage: 'annual, latest observation per country carried with its year',
    what: 'Country context and the service stocks behind the headroom model. These are reported observations, not estimates, and are the only observed figures in the application.',
    modified: 'Modified: latest non-null observation selected per country and its year retained and displayed; no interpolation, no imputation, no carry-forward beyond the stated year.',
  },
  {
    id: 'eurostat',
    producer: 'Eurostat',
    title: 'Eurostat: immigration by citizenship (migr_imm1ctz) and unemployment (une_rt_a)',
    author: 'Eurostat, European Commission',
    licence: 'Reuse authorised under Commission Decision 2011/833/EU', licenceUrl: 'https://ec.europa.eu/eurostat/web/main/help/copyright-notice',
    locator: 'dissemination API 1.0 \u00b7 migr_imm1ctz (2022, citizen TOTAL and FOR_STLS) \u00b7 une_rt_a (2023, Y15\u201374, PC_ACT)',
    url: 'https://ec.europa.eu/eurostat/web/main/help/copyright-notice',
    vintage: 'immigration 2022, published 2026-05-29 \u00b7 unemployment 2023, published 2026-09-10',
    what: 'Reported counts, used only on the concordance page. Immigration is what national statistical institutes actually recorded, which is the nearest thing to ground truth the bilateral models can be checked against; the unemployment rate is the harmonised Labour Force Survey figure.',
    modified: 'Modified: JSON-stat decoded across every dimension; the EU27_2020, EA20 and EA21 aggregates dropped; two-letter geo codes mapped to ISO-3166-1 alpha-3, including Eurostat\u2019s two departures from the standard (EL for Greece, UK for the United Kingdom).',
  },
  {
    id: 'imf-weo',
    producer: 'International Monetary Fund',
    commercialUseClear: false,
    title: 'World Economic Outlook database, and Balance of Payments',
    author: 'International Monetary Fund',
    licence: 'IMF terms for statistical Data', licenceUrl: 'https://www.imf.org/en/_site_imf/about/copyright-and-terms',
    locator: 'DataMapper API v1 \u00b7 PPPPC, LP, LUR',
    url: 'https://www.imf.org/external/datamapper/api/v1/',
    vintage: '2023 values read from a database running to 2031 \u2014 the upper years are projections',
    what: 'A third opinion on unemployment, GDP per capita and population, used only on the concordance page. The IMF publishes what member authorities report to it, on a different schedule from the World Bank, which is exactly what makes the comparison worth drawing.',
    modified: 'Modified: region aggregates (ADVEC, AS5, DA, EU, MECA, OEMDC, WE, WEOWORLD and the WEO regional codes) removed by intersecting with the API\u2019s own country list; LP rescaled from millions to people; the 2023 slice taken and nothing beyond it, because later years in this database are forecasts rather than outturns.',
  },
  {
    id: 'cbs',
    producer: 'Statistics Netherlands (CBS)',
    title: 'Immigration and emigration by country of origin, monthly (85484NED)',
    author: 'Centraal Bureau voor de Statistiek',
    licence: 'CC BY 4.0', licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
    locator: 'opendata.cbs.nl OData \u00b7 85484NED \u00b7 TypedDataSet, Herkomstland \u00d7 Perioden',
    url: 'https://opendata.cbs.nl/ODataApi/OData/85484NED',
    vintage: 'monthly, newest 2026-07 (provisional; 2025 and earlier are definitief)',
    what: 'Both directions of Dutch register movement, broken down by origin in CBS\u2019s own sense of the word \u2014 which is not where anyone travelled from. Alongside Canada this is the freshest thing in the application, and it is a count rather than an estimate.',
    modified: 'Read this before quoting it: Herkomstland is the person\u2019s own country of birth, or their parents\u2019 if they were born in the Netherlands, so a row counts people by origin and not a flow from a place \u2014 14.1% of July 2026\u2019s 23,148 immigration registrations were of people born in the Netherlands, and the table records nothing about where any of them travelled from. It is therefore NOT a bilateral corridor layer and is not offered as one. Emigration is net of administrative corrections, CBS\u2019s own preferred series because most departures are never declared and surface later as removals, so a cell can be negative. Modified: the monthly YYYYMM## period codes are separated from the annual YYYYJJ00 codes that share the same table and relabelled to 2026-07 form; the thirteen aggregate and residual rows are removed, including the nested ones (Afrika sits alongside Afrika-excluding-Morocco, and Nederlandse Cariben over four islands that are also listed separately), so a reader summing the rows is not double-counting; origin labels are joined to ISO-3166-1 alpha-3. The licence is the dataset\u2019s own CKAN declaration at data.overheid.nl, not the CBS website copyright page \u2014 that page is scoped to \u201cthe content of this website\u201d and is not the data licence.',
  },
  {
    id: 'ircc',
    producer: 'Immigration, Refugees and Citizenship Canada (IRCC)',
    title: 'Permanent Residents and Asylum Claimants \u2014 Monthly IRCC Updates',
    author: 'Immigration, Refugees and Citizenship Canada',
    licence: 'Open Government Licence \u2013 Canada 2.0', licenceUrl: 'https://open.canada.ca/en/open-government-licence-canada',
    locator: 'EN_ODP-PR-Citz.xlsx \u00b7 ODP-Asylum-Top25CitzProv-LastMonth.csv',
    url: 'https://open.canada.ca/data/en/dataset/f7e5498e-0ad8-4417-85c9-9b8aff9b9eda',
    vintage: 'monthly, newest 2026-07 (preliminary)',
    what: 'Admissions rather than registrations \u2014 a legal-status event, not a record of somebody taking up residence, which makes it a different quantity from every European register here.',
    modified: 'Modified: the workbook stores every cell including the numerics as an inline string with no shared string table, so it is parsed accordingly; the trailing \u201cQ3 Total\u201d column, which equals July alone, is dropped; suppressed cells (\u201c--\u201d) are kept distinct from published zeros, which also occur; counts are the publisher\u2019s own rounding to the nearest five. The asylum file is tab-separated despite its .csv extension and is UTF-8, not latin-1. Attribution as the licence requires: contains information licensed under the Open Government Licence \u2013 Canada.',
  },
  {
    id: 'destatis',
    producer: 'Statistisches Bundesamt (Destatis)',
    title: 'Statistischer Bericht \u2014 Wanderungen (12711), sheet csv-12711-05',
    author: 'Statistisches Bundesamt (Destatis)',
    licence: 'Data Licence Germany \u2013 Attribution 2.0', licenceUrl: 'https://www.govdata.de/dl-de/by-2-0',
    locator: 'statistischer-bericht-wanderungen-2010120257005.xlsx \u00b7 sheet csv-12711-05',
    url: 'https://www.destatis.de/EN/Service/OpenData/_node.html',
    vintage: 'annual, 2025',
    what: 'German arrivals and departures by partner country, both directions in one table. With ISTAT it makes the only true bilateral cross-validation available here: each country\u2019s own record of the same corridor.',
    modified: 'Modified: partner countries selected by an explicit allow-list rather than by excluding the aggregate names, because EU-Staaten (EU27) sits among them; the three sex categories are summed; partner labels joined to ISO-3166-1 alpha-3. The licence variant is not inferred \u2014 the Open Data page links the words \u201cData Licence Germany 2.0\u201d to govdata.de/dl-de/by-2-0, which is the Namensnennung (attribution) variant, and that page grants commercial reuse expressly.',
  },
  {
    id: 'istat',
    producer: 'Istituto nazionale di statistica (ISTAT)',
    title: 'Migrazioni interne e internazionali della popolazione residente',
    author: 'Istituto nazionale di statistica',
    licence: 'CC BY 4.0', licenceUrl: 'https://www.istat.it/en/legal-notice/',
    locator: 'SDMX \u00b7 IT1,28_185_DF_DCIS_MIGRAZIONI_3 (inbound) and _6 (outbound)',
    url: 'https://esploradati.istat.it/',
    vintage: 'annual, 2025 \u2014 every 2025 row is flagged provisional by the publisher',
    what: 'Italian arrivals by country of previous residence and departures by country of next residence. The other half of the German cross-validation.',
    modified: 'Modified: the SDMX CSV is decoded and OBS_VALUE taken; every 2025 observation carries OBS_STATUS=p and the layer is marked provisional accordingly, so nothing downstream can present it as final; country codes joined to ISO-3166-1 alpha-3. Requests are throttled deliberately \u2014 the service rate-limits to five per minute per address and blocks for a day or two beyond that.',
  },
  {
    id: 'naturalearth',
    title: 'Natural Earth Admin 0 – Countries, 1:110m',
    author: 'Natural Earth (public domain)',
    licence: 'Public domain', licenceUrl: 'https://www.naturalearthdata.com/about/terms-of-use/',
    locator: 'via world-atlas countries-110m.json (TopoJSON)',
    url: 'https://www.naturalearthdata.com/',
    vintage: 'v5',
    what: 'Country geometry and the centroids used as corridor endpoints. Geometry only — no attribute data is taken from it.',
    modified: 'Modified: TopoJSON converted to GeoJSON; centroids derived as the spherical mean of the largest ring; ISO-3166 codes joined from the dataset’s own lookup table.',
  },
];

export function Sources() {
  const { manifest, load, ready, layerIndex } = useStore();
  useEffect(() => { if (!ready) void load(); }, [load, ready]);

  return (
    <PageShell title="Where every number comes from" kicker="Source ledger">
      <p className="lede">
        {SOURCES.length} sources, each with the attribution its own licence requires and an
        explicit statement of what we changed. They are not all under the same licence, and
        this page does not pretend otherwise: two of them are governed by instruments written
        by the publisher rather than by Creative Commons, and those are reproduced in full in
        the repository&rsquo;s <code>LICENSES/</code> directory. Nothing here is scraped,
        purchased, private, or redistributed against its terms.
      </p>

      <h2>Credentials</h2>
      <p>
        Each badge states its own basis. A credential whose basis is not stated is the kind of
        unearned authority this project exists to argue against, so ours say plainly whether
        anyone actually checked.
      </p>
      <div className="badges">
        {BADGES.map((b) => (
          <div className={`badge-card basis-${b.basis}`} key={b.id}>
            <div className="badge-head">
              <span className="badge-name">{b.name}</span>
              <span className={`badge-pill ${b.basis}`}>{BADGE_BASIS_LABEL[b.basis]}</span>
            </div>
            <p className="badge-what">{b.what}</p>
            <p className="badge-how">{b.how}</p>
            {b.href && <a className="badge-link" href={b.href}>{b.href.startsWith('#') ? 'See the ledger' : 'Criteria'} →</a>}
          </div>
        ))}
      </div>

      <h2>Datasets</h2>
      {SOURCES.map((s) => {
        const mine = s.producer ? layerIndex.filter((l) => l.vintage.producer === s.producer) : [];
        const freshest = mine.length
          ? [...mine].sort((a, b) => Date.parse(b.vintage.periodEnd) - Date.parse(a.vintage.periodEnd))[0]!
          : null;
        return (
        <div className="src-card" key={s.id}>
          <div className="src-title">{s.title}</div>
          <div className="src-author">{s.author}</div>
          <p className="src-what">{s.what}</p>
          <dl className="src-meta">
            <div><dt>Licence</dt><dd><a href={s.licenceUrl} target="_blank" rel="noreferrer noopener">{s.licence}</a></dd></div>
            <div><dt>Locator</dt><dd>{s.locator}</dd></div>
            <div><dt>Permanent link</dt><dd><a href={s.url} target="_blank" rel="noreferrer noopener">{s.url}</a></dd></div>
            <div><dt>Vintage</dt><dd>{s.vintage}</dd></div>
          </dl>
          {freshest && (
            <div className="kv src-ships">
              <span className="k">shipping now</span>
              <span className="v">
                {mine.length} layer{mine.length === 1 ? '' : 's'} &middot; freshest {freshest.vintage.periodLabel} &middot; {ageDays(freshest.vintage)} d old
              </span>
            </div>
          )}
          {s.commercialUseClear === false && (
            <p className="src-mod" style={{ color: 'var(--accent-2)' }}>
              <b>Commercial reuse is not clearly granted by this publisher.</b> The terms permit
              derivative works and redistribution with attribution, then close by asking that
              commercial reuse be cleared by email. Exodus is AGPL-3.0, which permits commercial
              downstream use, so these layers are badged separately rather than mixed in with the
              Creative Commons ones, and anyone reusing this snapshot commercially should resolve
              it with the publisher rather than rely on this page.
            </p>
          )}
          <p className="src-mod">{s.modified}</p>
        </div>
        );
      })}

      <h2>What is not here</h2>
      <p>
        Several sources a project like this would normally use are deliberately absent, because
        their licences do not permit redistribution of a derived dataset: UN DESA International
        Migrant Stock (non-commercial, no derivatives), UNHCR population statistics (terms
        unresolved in writing), ACLED, EM-DAT, IDMC and IOM DTM. We would rather ship less than
        ship something we are not entitled to pass on to you.
      </p>

      {manifest && (
        <>
          <h2>Shipped snapshot</h2>
          <dl className="src-meta wide">
            <div><dt>Places</dt><dd>{manifest.placeCount}</dd></div>
            <div><dt>Corridors</dt><dd>{manifest.corridorCount}</dd></div>
            <div><dt>With a second model</dt><dd>{manifest.corridorsWithSecondModel}</dd></div>
            <div><dt>Years</dt><dd>{manifest.yearRange[0]}–{manifest.yearRange[1]}</dd></div>
            <div><dt>Rendered without a data join</dt><dd>{manifest.disputedRenderedWithoutData.join(', ') || '—'}</dd></div>
          </dl>
          <p className="muted">
            Those last entries carry no ISO numeric code, so nothing can be honestly joined to
            them. They render as geometry with no data and no corridors, rather than being
            quietly assigned to a neighbour.
          </p>
        </>
      )}
    </PageShell>
  );
}
