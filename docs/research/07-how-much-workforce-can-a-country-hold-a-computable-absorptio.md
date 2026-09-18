## 0. Framing decision the agent must implement literally

There is no single number "capacity." Build **six independent constraint modules**, each returning an annual admissible inflow in persons plus an uncertainty distribution, then combine with a **soft minimum**. Never present a point estimate without the band. The product's headline number is `N*` = the P50 of the combined envelope; the UI must show P10/P90 and the *binding* constraint name.

---

## 1. What the economics literature actually supports (and what it does not)

| Question | State of evidence | What the model may assume |
|---|---|---|
| Do immigrants lower native wages? | Contested but bounded. NAS 2016 (Blau chair, Borjas + Dustmann + Card-adjacent panel): "when measured over a period of 10 years or more, the impact of immigration on the wages of native-born workers overall is very small"; negative effects concentrate on **prior immigrants** and natives without high school. | Aggregate long-run native wage effect ≈ 0; distributional effects non-zero. |
| Structural elasticities | Ottaviano & Peri (2012, *JEEA* 10(1):152–197) estimate native–immigrant substitution σ_NM ≈ **20** (imperfect but high). Borjas (2003, *QJE*) national skill-cell approach yields larger negative own-cell effects. | Expose σ_NM, σ_E, σ_X as user-switchable "Borjas view" vs "Card/Peri view" presets. |
| Mariel boatlift | Card (1990): ~no effect. Borjas (2017, *ILR Review* 70(5):1077–1110): wages of Miami high-school dropouts fell **10–30%**. Peri & Yasenov (2019, *JHR* 54(2):267–309, synthetic control): no significant effect; Borjas' result driven by tiny subsamples. Clemens & Hunt (2019, *ILR Review*): the divergence is explained by a **1980 CPS change in coverage of low-skill Black men in Miami**, unrelated to the boatlift; adjusting for Black share reproduces Card. | Ship the Mariel case as an in-app "why the bands are wide" explainer. Do not encode a single Mariel elasticity. |
| Employment displacement | Dustmann, Schönberg & Stuhler (2017, *QJE* 132(1):435–483), Czech border-commuter quasi-experiment: **for each 100 commuters who found a job, 66–77 German workers moved into unemployment**, via *reduced inflows into employment*, not layoffs. Wage effects moderate; employment effects large for older natives. | Displacement is real where (a) labour market is local/closed, (b) wages are rigid, (c) migrants are perfect substitutes. Make these three switches explicit. |
| Fiscal impact | NAS 2016, 75-year NPV: federal impact generally **positive**, state/local generally **negative** (education costs). "An immigrant and a native-born person with similar characteristics will likely have about the same fiscal impact." Result flips sign on the **public-goods allocation rule** (average vs marginal cost of defence/debt interest). OECD (*International Migration Outlook 2025*, published Nov 2025): net fiscal impact is **small as a share of GDP** in most OECD countries; large and positive only where migrant share is very large (Switzerland, Luxembourg). | Public-goods rule must be a first-class UI toggle, not a buried assumption. |
| Refugees vs economic migrants | Brell, Dustmann & Preston (2020, *JEP* 34(1):94–121): refugees have persistently worse employment and wage outcomes; gaps narrow over **a decade or two**, faster in employment than wages. | Separate integration J-curves by admission channel. |
| Housing as binding constraint | Saiz (2010, *QJE* 125(3):1253–1296): supply elasticity is a function of developable land + regulation; at the 90th percentile of land constraint (e.g. San Diego, 60% undevelopable within 50 km) elasticity falls to **0.91**. Cavalleri, Cournède & Özsöğüt (2019, OECD ECO/WKP No. 1589, doi:10.1787/4777e29a-en) give national long-run supply elasticities and link low elasticity to land-use regulation and rent control. | Housing is frequently the true binding constraint in high-income destinations. |

---

## 2. Module A — Labour market absorption

Three-level nested CES (education × experience × nativity), capital adjusting with lag.

**A1. Wage impact on native group (e = education, x = experience):**

```
Δln w_N(e,x) =
    − α_K · (1 − κ(t)) · Δln L                                  [capital lag term]
    − (1/σ_E) · [Δln L_e − Δln L]                               [between-education]
    − (1/σ_X) · [Δln L_(e,x) − Δln L_e]                         [between-experience]
    + (1/σ_X − 1/σ_NM) · s_M(e,x) · Δln M(e,x)                  [native shielding]
```
First-order approximation of Ottaviano–Peri (2012). `α_K` = capital income share; `κ(t)` = fraction of capital adjustment complete at horizon t; `s_M(e,x)` = migrant share of cell employment; `L` = efficiency-weighted labour.

**A2. Employment-margin absorption (the actual headcount cap):**

```
A_labour = Σ_o [ V_o · f_o · (1 − d_o) ]  ×  H_year
  V_o = open vacancies in occupation o (stock)
  f_o = share of V_o fillable by non-resident supply (licensing/language gate, §7)
  d_o = displacement coefficient for o  (natives displaced per migrant hire)
  H_year = vacancy turnover multiplier = 365 / TTF_o  (annualisation of a stock)
```
`d_o` default **0.15** in flexible, nationally-integrated markets; **0.70** (DSS 2017 midpoint of 0.66–0.77) in the "rigid/local" scenario the user can select. Report both.

---

## 3. Module B — Housing constraint

```
Dwellings required:   D_req = N / h_c          h_c = household size of arriving cohort
Net new capacity:     D_avail(T) = Σ_t [ Completions_t − NativeHouseholdFormation_t ]
                                   + β_vac · VacantHabitable
Housing cap:          A_housing = h_c · D_avail(T)
Price pressure:       Δln P = Δln Q_dem / (ε_S + |ε_D|)
Rent pressure:        Δln R ≈ Δln P · (1 − τ)      τ = yield-adjustment, default 0.3
```
| Param | Default | Source |
|---|---|---|
| `h_c` | 1.6 (single labour), 2.4 (family), 2.9 (refugee/humanitarian) | Eurostat `lfst_hhnhtych`; national LFS — **calibrate per country, UNVERIFIED as universal defaults** |
| `ε_S` | country-specific; 0.9 at 90th-pct land constraint | Saiz 2010 (US metros); Cavalleri et al. 2019 OECD WP1589 Table of national elasticities — **agent must parse the PDF table; individual country values UNVERIFIED here** |
| `ε_D` | −0.5 | standard housing demand elasticity range −0.3 to −0.7 — **UNVERIFIED single citation** |
| `β_vac` | 0.4 | share of vacant stock realistically mobilisable |
| Completions | Eurostat `sts_cobp_a` (building permits, annual) — **verified 200 OK** | |
| Affordability stress gate | Eurostat `ilc_lvho07a` housing cost overburden rate — **verified 200 OK, updated 2026-09-17** | |

Hard gate: if projected `Δln R` pushes the overburden rate above a user-set threshold (default +3 pp), housing becomes the binding constraint regardless of labour demand.

---

## 4. Module C — Public services congestion

```
A_services = min over s ∈ {schools, primary care, hospital beds, childcare, social housing}
             of  [ (C_s + g_s·T·C_s) / θ_s*  −  P_current ] / q_s
  C_s     = current capacity units
  θ_s*    = policy target units per 1,000 population
  g_s     = annual capacity growth rate (capex pipeline)
  q_s     = per-migrant utilisation ratio relative to native average
  T       = horizon in years
```
Defaults: `q_school` = 1.35 (higher child dependency in family/refugee streams), `q_primarycare` = 0.85 for young labour migrants (healthy-migrant effect) rising to 1.0 by year 10, `q_socialhousing` = 1.8 for humanitarian channel. **All three are UNVERIFIED as cross-country constants and must be flagged in the UI as calibration inputs, not measurements.** Populate `C_s` from OECD Health Statistics (physicians/1000, beds/1000), UOE education statistics, OECD Affordable Housing Database.

---

## 5. Module D — Fiscal net position (10–20 y and 75 y)

```
NPV_i = Σ_{t=0}^{T}  [ T_i(a+t, e, c, y_t)  −  G_i(a+t, e, c, y_t) ] / (1+r)^t
  T_i = taxes paid (income + payroll + consumption + property, incidence-adjusted)
  G_i = age/education-specific benefits + PUBLIC_GOODS_SHARE
```
- `PUBLIC_GOODS_SHARE ∈ {average-cost, marginal-cost=0}` — **mandatory UI toggle.** NAS 2016: under the marginal-cost/zero-defence-increment assumption the first-generation net fiscal impact becomes **more positive than that of both native-born groups**; under average-cost allocation the sign flips.
- `r` default **3.0% real**; sensitivity 1%–5%.
- Include second generation as an optional term: NAS 2016 finds second-generation adults are the **strongest fiscal contributors of any generation**, so including them mechanically improves the result — make inclusion an explicit switch, defaulted **off** for the headline number.
- Employment trajectory feeding `T_i` must use the channel-specific J-curve (Module E1), not a steady-state employment rate.

**E1. Integration J-curve (employment rate by years since arrival):**
```
Emp(τ) = E_∞ · (1 − exp(−λ·(τ − τ_0)))        τ ≥ τ_0
```
Defaults by channel: labour migrant `E_∞`=0.82, `λ`=0.9, `τ_0`=0.0; family `E_∞`=0.65, `λ`=0.30, `τ_0`=0.5; refugee `E_∞`=0.62, `λ`=0.18, `τ_0`=1.5 (convergence "on a timescale of a decade or two," Brell/Dustmann/Preston 2020). **λ and τ_0 values are fitted illustrations, UNVERIFIED — the agent must refit per country from EU-LFS ad-hoc module 2021 / national register data and display the fit date.**

---

## 6. Module E — Social/political acceptance headroom (explicitly heuristic)

```
r_max = r_base · (MAI_c / 5.0)^β · (1 + γ · MIPEX_c/100) · exp(−δ · U_c) · exp(−η · Δinflow_rate_{t-1..t-3})
```
- `MAI_c` = Gallup Migrant Acceptance Index, 0–9 scale, three items (migrants living in country / as neighbours / marrying into family); most recent global wave 142 countries, ~146,000 adults, 2023; Canada highest (8.46 in the earlier published wave).
- `MIPEX_c` = MIPEX **2025** (fifth edition, 58 policy indicators, 8 policy areas; EU-27 refreshed 2020→2023/24; 56 countries total). https://www.mipex.eu
- `η` term encodes the rate-of-change penalty (rapid local inflow surges move vote shares even where levels are tolerated).
- **All of β, γ, δ, η are UNVERIFIED free parameters.** Label this module in the UI as *"Political feasibility heuristic — not a causal estimate"* and require the user to set the coefficients or accept documented placeholders (β=1.0, γ=0.3, δ=4.0, η=8.0, r_base=0.8% of population/yr).

---

## 7. Module F — Per-occupation matching engine

**F1. Shortage Intensity Index (0–100, per ISCO-08 4-digit × region):**
```
SII_o = 100 · Φ( w1·z(VR_o) + w2·z(TTF_o) + w3·z(WP_o) + w4·z(−UVR_o) + w5·z(ERD_o) )
  VR_o  = vacancy rate = V_o / (V_o + E_o)
  TTF_o = time-to-fill, days = V_o / H_o  (vacancy stock / monthly hires × 30)
  WP_o  = wage premium growth = Δ3y ln(w_o) − Δ3y ln(w_all)
  UVR_o = unemployment-to-vacancy ratio within occupation
  ERD_o = employer-reported recruitment difficulty (survey share)
  weights default w = (0.25, 0.25, 0.20, 0.15, 0.15); Φ = standard normal CDF
```
**F2. Absorbable headcount per occupation:**
```
A_o = min( V_o · (365/TTF_o) · f_o ,  E_o · Δs_max )   ·  (1 − d_o)
  f_o = 1 if unregulated; ρ_o,c (credential-recognition probability) if regulated
  Δs_max = max tolerated annual increase in foreign-born share of o, default 0.02
```
**F3. Migrant-profile → occupation mapping:**
```
match(p, o) = cos( ESCO_skillvec(p), ESCO_skillvec(o) )
            · 1[lang_p ≥ lang_req_o]
            · ρ_o,c
            · exp(−μ · |ISCED_p − ISCED_o|)          μ = 0.35 (downgrading penalty)
Expected placements = Σ_o  A_o · softmax_o(match(p,o)) · (1 − attrition_o)
```
ESCO skill vectors: `https://ec.europa.eu/esco/api/resource/concept?uri=http%3A%2F%2Fdata.europa.eu%2Fesco%2Fisco%2FC2&language=en` — **verified 200 OK**, returns SKOS concept with multilingual labels; ESCO↔ISCO-08 is the built-in hierarchy.

---

## 8. Demographic-deficit side: how many working-age people are NEEDED

**Support ratio (UN framing):** `SR(t) = P_20–64(t) / P_65+(t)`

**Required net migration to hold SR at SR_0 in year t:**
```
M_req(t) = [ SR_0 · P_65+(t) − P_20–64(t) ] / φ_wk
  φ_wk = share of the arriving cohort aged 20–64 on arrival
         default 0.78 (labour channel), 0.60 (family/humanitarian mix)
```
Run this *inside* a cohort-component projection, not as a one-shot: migrants themselves age into P_65+, so the required inflow **accelerates**. This is the mechanism that produces the UN's absurd numbers and must be shown as an animated divergence.

**UN DESA (2000), "Replacement Migration: Is It a Solution to Declining and Ageing Populations?" ESA/P/WP.160** — scenario VI (constant potential support ratio at 1995 level) requires: **EU ≈ 674 million migrants 1995–2050 (~13 m/yr); Japan ≈ 524 million (~10.5 m/yr); Republic of Korea ≈ 5.1 billion; Italy ≈ 113.4 million vs only 12.6 million to hold total population constant.** The report itself calls these levels unrealistic.

**Critiques the UI must surface alongside the number:**
1. **Ageing cannot be offset by migration at any feasible level** — only population *size* and *working-age size* can. Coleman and others (Population & Development Review 2000 symposium; Espenshade's "why everyone has to live in Korea" critique) established this within months of publication.
2. **Fixed age-65 threshold is wrong.** Sanderson & Scherbov: define "old" as remaining life expectancy ≤ 15 years (POADR). Under POADR, Germany's ageing burden rises **11.3%** where the conventional OADR rises **49.2%**. Compute and display both.
3. **Employment rates and hours dominate migration on the margin.** Use the *economic* old-age dependency ratio `EOADR = P_65+ inactive / Employed(all ages)`. A 5 pp rise in the 55–64 employment rate typically offsets more of the deficit than any politically feasible inflow. Make this a competing lever in the simulator.
4. **Support ratio ≠ fiscal sustainability.** Productivity growth, benefit indexation rules and retirement age enter the fiscal identity directly; SR does not.
5. Replacement-migration arithmetic assumes migrant labour-force participation equal to natives on arrival — falsified by Module E1.

---

## 9. Combining: the capacity envelope

```
N*_soft = −θ · ln( Σ_j exp(−A_j / θ) )      θ = 0.15 · min_j A_j     (soft-min over modules)
```
Monte Carlo: 10,000 draws over all parameters with documented priors (log-normal for elasticities, beta for shares, normal for J-curve λ). Report P10/P50/P90 plus `argmin_j` frequency = "binding constraint probability" per module. The single most useful UI object is a **stacked constraint bar** showing each module's cap and which one binds in what share of draws.

---

## 10. Verified data source registry (probed 2026-09-18)

| Source | Exact endpoint | Status | Cadence / vintage | Licence |
|---|---|---|---|---|
| Eurostat dissemination API | `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/{code}?format=JSON&geo=DE&time=2024` | **200 verified** for `lfsa_egais`, `lfsa_urgaed`, `jvs_a_rate_r2`, `jvs_q_nace2` (time format `2026-Q1`), `ilc_lvho07a`, `sts_cobp_a`, `migr_pop1ctz`, `proj_23np`, `proj_23ndbi` | JVS annual updated 2026-03-20; EUROPOP2023 projections updated 2026-05-12; LFS updated 2026-09-10 | Commission reuse, Decision 2011/833/EU, attribution required |
| ILOSTAT SDMX | `https://sdmx.ilo.org/rest/data/ILO,DF_EMP_TEMP_SEX_OCU_NB,1.0/DEU.A..SEX_T.OCU_ISCO08_TOTAL?startPeriod=2023&format=jsondata` | **200 verified**, SDMX-JSON 2.0 | continuous; bulk gz CSV at `ilostat.ilo.org/data/bulk` | CC BY 4.0 — **UNVERIFIED string** |
| World Bank WDI | `https://api.worldbank.org/v2/country/{ISO3}/indicator/{code}?format=json&date=2024` | **200 verified**, `lastupdated: 2026-07-13` | ~quarterly | CC BY 4.0 |
| OECD SDMX (Data Explorer) | `https://sdmx.oecd.org/public/rest/data/OECD.ELS.IMD,DSD_MIG@DF_MIG,1.0/all?startPeriod=2022&format=csvfile` | **200 verified**, returns International Migration Database | annual | OECD terms of use |
| UNHCR Refugee Data Finder | `https://api.unhcr.org/population/v1/population/?yearFrom=2024&yearTo=2024&coa_all=true` and `/v1/countries/` | **200 verified**, returns refugees/asylum_seekers/idps/returned_* | annual (Global Trends, June) + mid-year | — **UNVERIFIED** |
| ESCO | `https://ec.europa.eu/esco/api/resource/concept?uri={esco_or_isco_uri}&language=en` | **200 verified** | ESCO v1.2.x | EUPL / Commission reuse — **UNVERIFIED** |
| UN Population Data Portal | `https://population.un.org/dataportalapi/api/v1/indicators/` → **200** (86 indicators); `/api/v1/locations/` → **200**; `/api/v1/data/indicators/{id}/locations/{id}/start/{y}/end/{y}` → **401, requires bearer token** | partial | WPP **2024 revision is current**; WPP 2026 **postponed to 2027** (E/CN.9/2026/CRP.1) | — |
| US BLS | `https://api.bls.gov/publicAPI/v2/timeseries/data/{seriesID}` (e.g. JOLTS `JTS000000000000000JOR`) | **reachable**, returns `REQUEST_NOT_PROCESSED` without a registration key | JOLTS monthly, OEWS annual (May reference) | US public domain |
| O*NET Web Services | `https://services.onetcenter.org/ws/` | **401**, HTTP Basic auth, free registration | annual DB release | O*NET/CC BY 4.0 |
| EURES / ELA shortages | `https://www.ela.europa.eu/sites/default/files/2026-06/labour-shortages-report-ela-2025.pdf` + annex `annex-labour-shortages-report-ela-2025.pdf` | live PDF | annual; 2025 edition covers reference year 2024; **2,617 shortages / 2,177 surpluses reported**, ISCO-coded | Commission reuse |
| Jobs and Skills Australia OSL | `https://www.jobsandskills.gov.au/data/occupation-shortage` | live | annual, 2025 list released 15 Oct 2025: **293 of 1,022 ANZSCO occupations in shortage (29%, down from 33% in 2024, 36% in 2023)**; SERA vacancy fill rate **68.2% (March 2026)** — SERA is the only large-scale *time-to-fill / fill-rate* series found | CC BY 4.0 (au.gov) — **UNVERIFIED** |
| MIPEX 2025 | `https://www.mipex.eu/` , `https://mipex.eu/download-pdf` | live | 5th edition, 56 countries, 58 indicators | — **UNVERIFIED** |
| IOM DTM | Subscription key required via `https://dtm-apim-portal.iom.int/` (API v3 released 2025-08-22, adds drivers/sex/origin). Direct paths under `https://dtmapi.iom.int/api/...` returned **404 unauthenticated — exact paths UNVERIFIED.** Keyless fallback: `https://data.humdata.org/api/3/action/package_show?id=global-iom-dtm-from-api` — **200 verified** | partial | rolling | HDX terms |

**Policy anchor worth wiring in:** Regulation (EU) 2026/1047 establishing the **EU Talent Pool** — adopted by Parliament 10 March 2026, Council 30 March 2026, published in the OJ 12 May 2026, **in force 1 June 2026**, platform expected operational end-2027; matches non-EU jobseekers to **shortage occupations** in participating Member States. `https://eur-lex.europa.eu/eli/reg/2026/1047/oj/eng`. This is the real-world consumer of exactly the Module F output.

---

## 11. What this model CANNOT claim — verbatim UI caveat text

> **Read this before using any number on this screen.**
>
> This is a scenario calculator, not a forecast. It computes what *would* follow from a set of assumptions you can inspect and change. It does not predict what will happen.
>
> **It cannot tell you the "right" number of migrants.** Capacity is not a physical quantity. Every figure here is conditional on policy choices — housing construction, credential recognition, language provision, childcare, retirement age — that are themselves variables, not constants. Change the policy and the capacity changes.
>
> **The labour-market effects are contested.** The best-identified natural experiments disagree. The same Mariel boatlift data has produced estimates of no wage effect and of a 10–30% wage decline for the least-educated, and the disagreement traces partly to a survey-coverage artefact rather than to the economics. Our bands reflect that disagreement; they do not resolve it.
>
> **The fiscal result is driven by an accounting choice.** Whether immigrants are charged the average or the marginal cost of public goods such as defence and debt interest flips the sign of the long-run fiscal balance. We show you the toggle because there is no scientifically correct setting for it.
>
> **The acceptance module is not science.** It is a transparent heuristic over survey indices. It has no causal identification and should never be used to justify a decision on its own.
>
> **Migration cannot stop population ageing.** It can raise the number of working-age people; it cannot hold the old-age support ratio constant at any politically conceivable level, because migrants age too. The UN's own 2000 arithmetic required roughly 674 million migrants to the EU and 524 million to Japan by 2050 to hold 1995 support ratios, and called those levels unrealistic.
>
> **These are aggregates. They say nothing about any individual.** Nothing here supports a claim about the value, cost or desirability of any particular person or group.
>
> **Data vintage and gaps.** Sources update on different schedules and coverage is thin outside the OECD and EU. Where a parameter is a calibrated placeholder rather than a measurement, it is marked ⚠ in the parameter panel. Every number on this screen is traceable: click it to see its source, retrieval timestamp and formula.

---

## 12. Engineering notes for the coding agent

- Represent every parameter as `{value, unit, source_url, retrieved_at, vintage, confidence ∈ {measured, estimated, placeholder}, prior}`. Render `confidence=placeholder` with a persistent ⚠ badge. No parameter may be a bare literal in code.
- Geography spine: ISO 3166-1 alpha-3 for countries, NUTS-2 for EU subnational, GADM level 1 elsewhere. Occupations: **ISCO-08 4-digit** as canonical; hold crosswalks to SOC-2018, ANZSCO, NOC-2021, ESCO.
- Constraint modules are pure functions `(CountryState, InflowSpec) → {cap, distribution, binding_reason}` behind one interface so new modules (energy, water, transport) drop in without touching the envelope code.
- Monte Carlo runs in a Web Worker or WASM module, not on the render thread; the WebGL globe reads only the summarised P10/P50/P90 per geography.
- Cache every external fetch with the vintage key; never let a live API failure silently substitute stale data without a visible staleness indicator.
