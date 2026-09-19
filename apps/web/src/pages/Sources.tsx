import { PageShell } from './PageShell';
import { BADGES, BADGE_BASIS_LABEL } from './Badges';
import { useStore } from '../state';
import { useEffect } from 'react';

interface Src {
  id: string; title: string; author: string; licence: string; licenceUrl: string;
  locator: string; url: string; vintage: string; what: string; modified: string;
}

/** CC BY 4.0 §3(a) requires: title, author, source, licence, and an indication of whether
 *  the material was modified. Every row below carries all five. */
const SOURCES: Src[] = [
  {
    id: 'gaskin-abel',
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
    title: 'World Economic Outlook database',
    author: 'International Monetary Fund',
    licence: 'IMF terms for statistical Data', licenceUrl: 'https://www.imf.org/en/_site_imf/about/copyright-and-terms',
    locator: 'DataMapper API v1 \u00b7 PPPPC, LP, LUR',
    url: 'https://www.imf.org/external/datamapper/api/v1/',
    vintage: '2023 values read from a database running to 2031 \u2014 the upper years are projections',
    what: 'A third opinion on unemployment, GDP per capita and population, used only on the concordance page. The IMF publishes what member authorities report to it, on a different schedule from the World Bank, which is exactly what makes the comparison worth drawing.',
    modified: 'Modified: region aggregates (ADVEC, AS5, DA, EU, MECA, OEMDC, WE, WEOWORLD and the WEO regional codes) removed by intersecting with the API\u2019s own country list; LP rescaled from millions to people; the 2023 slice taken and nothing beyond it, because later years in this database are forecasts rather than outturns.',
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
  const { manifest, load, ready } = useStore();
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
      {SOURCES.map((s) => (
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
          <p className="src-mod">{s.modified}</p>
        </div>
      ))}

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
