## 0. The one honest fact that should shape the whole product

Population-and-distance-only models **fail at the international scale**. Robinson & Dilkina (COMPASS 2018, arXiv:1711.05462) benchmarked gravity (power and exponential decay), radiation, and extended radiation against global bilateral migration:

| Model | Global migration CPC | Global r² (full matrix) | US county-to-county CPC |
|---|---|---|---|
| Gravity, exponential decay | 0.16 ± 0.00 | 0.02 ± 0.03 | 0.53 ± 0.01 |
| Gravity, power-law decay | 0.16 ± 0.00 | 0.05 ± 0.00 | 0.56 ± 0.01 |
| Radiation (Simini 2012) | 0.16 ± 0.00 | 0.02 ± 0.00 | 0.53 ± 0.01 |
| Extended radiation (Yang 2014) | 0.16 ± 0.00 | 0.03 ± 0.00 | 0.58 ± 0.01 |
| XGBoost, extended features | 0.21 ± 0.01 | 0.16 ± 0.02 | 0.58 ± 0.03 |
| ANN, extended features | 0.22 ± 0.02 | 0.12 ± 0.02 | 0.68 ± 0.01 |

**Implication:** the MVP's baseline must be a *covariate-rich* gravity/RUM model (income, diaspora, language, colony, policy, conflict), not a parameter-free radiation model. Radiation belongs in the UI as a comparison/null model, labelled as such.

CPC (Common Part of Commuters / Bray-Curtis), the standard flow-matrix metric — implement it, it is the headline accuracy number:

```
CPC(T, T̂) = 2·Σᵢⱼ min(Tᵢⱼ, T̂ᵢⱼ) / (Σᵢⱼ Tᵢⱼ + Σᵢⱼ T̂ᵢⱼ)    ∈ [0,1]
CPC_d: same formula on histograms Nₖ of flows with distance ∈ [2^(k−2), 2^k) km
```

---

## 1. Gravity models and why OLS-on-logs is wrong

Structural multiplicative form:

```
E[Mᵢⱼ | X] = exp( δᵢ + γⱼ + β₁·ln yⱼ + β₂·ln yᵢ + β₃·ln distᵢⱼ + β₄·ln(1+Sᵢⱼ) + β₅·comlangᵢⱼ + β₆·colonyᵢⱼ + β₇·contigᵢⱼ + β₈·Policyⱼ + β₉·Conflictᵢ )
```
- `Mᵢⱼ` = gross migration flow i→j in a period; `yᵢ,yⱼ` = GDP per capita PPP; `distᵢⱼ` = CEPII `distw` (population-weighted great-circle, km); `Sᵢⱼ` = diaspora stock of origin-i born residing in j (UN DESA); `δᵢ,γⱼ` = origin-year / destination-year fixed effects absorbing multilateral resistance.

**Why not `ln M = Xβ + ε` by OLS (Santos Silva & Tenreyro 2006, "The Log of Gravity", REStat 88(4))**: (a) `E[ln M] ≠ ln E[M]` under Jensen's inequality, so with heteroskedastic errors — which migration data always have, variance rising with flow size — log-OLS coefficients are *inconsistent*, not merely inefficient; (b) ~50–70% of the 200×200 bilateral matrix is structural zeros and `ln 0` is undefined; the `ln(M+1)` fix biases toward zero and the bias depends on the scale of M. **Use PPML** (`Mᵢⱼ ~ Poisson`, quasi-ML, robust/clustered SEs). PPML is consistent under any conditional-mean-correct specification regardless of the actual variance function, handles zeros natively, and its first-order condition makes fitted flows sum to observed totals — which is exactly what a flow-matrix product needs. Known caveat: PPML weights large flows heavily (over-weights US/Gulf/EU corridors); the counter-argument of Martin & Pham (2008) that PPML is severely biased with frequent zeros was rebutted by Santos Silva & Tenreyro (2011) as arising from misspecified simulations.

## 2. Radiation and intervening opportunities

Simini et al., *Nature* 484:96–100 (2012), parameter-free:

```
Tᵢⱼ = Tᵢ · (mᵢ·nⱼ) / [ (mᵢ + sᵢⱼ)·(mᵢ + nⱼ + sᵢⱼ) ]
```
`mᵢ` origin population, `nⱼ` destination population, `sᵢⱼ` = total population of all zones whose centroid falls inside the circle centred on i with radius `dᵢⱼ`, excluding i and j (the Stouffer 1940 "intervening opportunities"). `Tᵢ` = total outflow from i, supplied by a production function `Tᵢ = α·mᵢ`. Finite-system normalisation: divide by `(1 − mᵢ/M)`, M = total system population. Extended radiation (Yang et al. 2014) adds one exponent α on the opportunity term. Ship it as a null model; expect CPC ≈ 0.16 internationally.

## 3. RUM / discrete choice

Individual n in origin i picks destination j maximising `Uₙᵢⱼ = wⱼ − cᵢⱼ + εₙᵢⱼ`. With i.i.d. type-I extreme value ε, aggregation gives the log-odds estimating equation used by Grogger & Hanson (JDE 95(1):42–57, 2011) and Ortega & Peri:

```
ln(mᵢⱼ / mᵢᵢ) = (wⱼ − wᵢ) − cᵢⱼ
```
where `mᵢᵢ` = stayers. This has three practical consequences the product must respect:
1. **IIA fails.** Destinations within a region (Schengen, GCC, ECOWAS) are close substitutes. Use **nested logit**: `Pᵢⱼ = Pᵢ(nest r) · Pᵢ(j | r)`, with dissimilarity parameter `λᵣ ∈ (0,1]`; `λᵣ → 0` means perfect substitution inside the nest. Default nests: EU/EEA+CH, GCC, North America, ASEAN, ECOWAS, EAC/IGAD, Mercosur, Rest.
2. **Multilateral resistance to migration (MRM)** — Bertoli & Fernández-Huertas Moraga, *JDE* 102:79–100 (2013): a shock at destination k changes i→j flows. Any "close the Mediterranean route" simulation MUST re-normalise across all destinations, or it will silently invent or destroy migrants. In the MVP this is enforced by the row-normalisation in §8.
3. Their proposed fix for estimation is the Pesaran (2006) **Common Correlated Effects** estimator; that's for the later calibration path, not the MVP.

## 4. Coefficients to ship (so the MVP runs without fitting)

| Parameter | Value | Provenance | Confidence |
|---|---|---|---|
| `β_yd` ln GDPpc destination | **+0.76** | Ortega & Peri, *Migration Studies* 1(1):47–74 (2013), Table 4 col 2, preferred estimate | verified from paper text |
| `β_yd` intra-EU/EEA override | **+1.90** | same, Table 4 col 3 | verified |
| `β_yd` non-European destination | **+0.42** | same, Table 4 col 4 | verified |
| `β_yo` ln GDPpc origin | **−0.33** | same, Table 3 col 3 (−0.31 below world median income, −0.32 above) | verified |
| `β_colony` colonial tie | **+0.85** (same empire post-1945); **+0.77** (tie ended 1945) | same, footnote 26 | verified |
| Entry-law tightening | **−0.06** per unit at non-European destinations; **−0.02** pooled; ≈ **−6%** flows for a typical destination tightening | same, §4.3 + conclusions | verified |
| Maastricht | **+10%** intra-EU flows | same, conclusions | verified |
| `β_net` ln diaspora stock | **+0.70** over 10 yr (overall network elasticity ≈ **1.0**; ~¼ of it runs through the policy/family-reunification channel) | Beine, Docquier, Özden, *JDE* 95(1):30–41 (2011) | verified via secondary source |
| Visa requirement imposed | **−40% to −47%** inflow; **+2.8% to +16.9%** diversion to alternative destinations | IZA World of Labor, "Gravity models: a tool for migration analysis" | verified via that article |
| `β_dist` ln distance | **−0.80** (literature band −0.7 to −1.2) | Sign and significance confirmed in Ortega & Peri; exact magnitude **UNVERIFIED** — I could not extract their table values | **UNVERIFIED magnitude** |
| `β_comlang` common official language | **+0.75** (band +0.4 to +1.0) | **UNVERIFIED** — plausible published range, not a specific extracted estimate | **UNVERIFIED** |
| `β_contig` shared border | **+0.50** | **UNVERIFIED** | **UNVERIFIED** |
| `θ_conflict` on ln(1+battle deaths per 100k) | **+0.35** prior | **UNVERIFIED** — treat as a prior to be calibrated against UNHCR/IDMC outflows | **UNVERIFIED** |
| Migration hump turning point | rise slows ≈ **$5,000** PPP, reverses ≈ **$8,000–$10,000** (2011 PPP) | Clemens, IZA DP 13614 / "The Emigration Life Cycle"; Clemens & Postel (2018) give $8k–$10k. Contested: Benček & Schneiderheinze (*World Development*, 2024) find a monotone negative income–emigration relation and no hump | contested — expose as a toggle |

Bilateral dummies come from **CEPII GeoDist / CEPII Gravity** with exact field names: `dist`, `distw`, `distcap`, `contig`, `comlang_off`, `comlang_ethno`, `colony`, `comcol`, `col45`, `smctry`.

## 5. Aspirations–capabilities and the hump

De Haas, *Comparative Migration Studies* 9:8 (2021): migration = f(aspirations, capabilities) within a perceived opportunity structure. Operationalise as two multiplicative gates rather than a single linear income term — a poverty-trapped population has high aspirations and no capability; a rich population has capability and low aspirations. That product *is* the hump, and it is why `β_yo` must be non-monotone:

```
h(yᵢ) = 1 − ((ln yᵢ − ln y*) / σ_y)² ,  y* = 8000 (2011 PPP USD), σ_y = 2.2
```
`h` peaks at 1 at y*, falls to 0 at ≈ $900 and ≈ $71,000. A `hump: on|off` toggle must switch between `θ_h·h(yᵢ)` and the monotone `β_yo·ln yᵢ`, and the UI must state that the literature is split.

## 6. Operational forecasting systems — what actually exists

| System | Method | Coverage / horizon | Accuracy claim | Access |
|---|---|---|---|---|
| **DRC Foresight** (Danish Refugee Council + IBM) | Supervised ML on **148** indicators from **18** open sources (violence, governance, economy, environment, socio-demographics) | **27 countries** = 93% of global displacement; **1–3 years**, country-level totals | >50% of annual forecasts within **10%** of actual; beats humanitarian planning figures in **12 of 18** comparable countries | Annual *Global Displacement Forecast* PDF (2026 edition: `https://drc.ngo/media/m3zphybx/forecast-report-2026-full-report.pdf`). No public API — **UNVERIFIED** whether machine-readable output exists |
| **UNHCR Project Jetson** | Supervised ML time-series on ~10 variables: conflict events, rainfall/climate anomaly, commodity/market prices, historical movement | Somalia, sub-national; **~1 month** ahead | UNHCR explicitly disclaims accuracy/reliability of published predictions | `https://jetson.unhcr.org/`, code `https://github.com/unhcr/Jetson`. Update cadence appears stalled — **UNVERIFIED** as live |
| **VIEWS** (Uppsala + PRIO) | Ensemble of ML/statistical models, probabilistic | Global country-month (`cm`); **0.5° grid-month (`pgm`)** for Africa + Middle East; **1–36 months** | Ranked by **CRPS**, ab-Log Score, MIS on a live leaderboard | **API verified live**: `https://api.viewsforecasting.org/` returns a run list; `https://api.viewsforecasting.org/{run}/{loa}` e.g. `/fatalities003_2026_07_t01/cm`, paginated (`?page=N`). Monthly runs. License **UNVERIFIED** |
| **Flee 3** (Brunel, Groen et al.) | Agent-based, network of locations/routes/camps; `locations.csv`, `routes.csv`; rules on food security, ethnicity, religion, gender, age | Conflict-specific sub-national; days-to-months | >**75%** of destinations correct after first 12 days; averaged relative difference < 0.5–0.6 across ten Asian/African conflicts | `https://github.com/djgroen/flee`, **BSD 3-clause**, Python 3, docs `https://flee.readthedocs.io`. Scales to 100M agents / 768 cores |

**Decision rule — ABM vs calibrated gravity:** use ABM only when (a) the geography is *within* one crisis and routes/camps/borders are the binding constraint, (b) you need arrival timing in days, or (c) you are simulating a discrete intervention (a camp opening, a border closing) whose effect is spatially routed. Use gravity/RUM for everything global, annual, and cross-corridor. An ABM cannot run in-browser for 200×200 countries; wire Flee as an *optional server-side module behind the same `FlowModel` interface*, not as the MVP baseline.

---

## 7. Uncertainty — the non-negotiable part

- **Never a bare point estimate.** Every flow, every hotspot score, every "absorption capacity" figure carries p10/p50/p90.
- **Ensemble over single model.** Run baseline gravity + radiation null + persistence, display spread. Disagreement across models is itself the most honest signal a decision-maker gets.
- **Backtesting protocol (mandatory):** rolling origin. Train on all data ≤ T, predict T+1…T+3, roll T forward one year, repeat over ≥ 10 origins. Metrics: **CPC** and **CPC_d** on the full matrix; weighted MAPE on the top-200 corridors by volume; **CRPS** for the probabilistic output; and PIT/empirical coverage of the nominal 80% interval (if the 80% interval covers 55% of outcomes, say so on the dashboard). Baselines that must be beaten before any forecast is shown: (1) persistence — last observed flow; (2) 3-year trailing mean; (3) stock-share allocation.
- **Intervals:** parametric bootstrap over the coefficient vector (draw `β ~ N(β̂, Σ)`; ship a diagonal Σ with σ = published SE where known, else 0.25·|β|), plus a multiplicative overdispersion draw calibrated from backtest residuals. For post-hoc calibration on a fitted model, **split conformal prediction** gives distribution-free coverage but its exchangeability assumption is violated by time series — use the adaptive/rolling variant and say so.
- **Suppression rule:** do not render corridor-level forecasts below ~1,000 persons/year. Global CPC of 0.16 for uncovariated models means the small-corridor tail is noise, and a dashboard that renders it is lying with pixels.

---

## 8. CRITICAL DELIVERABLE — `EXODUS-G1`, the MVP baseline flow model

Implementable in TypeScript, runs on a 200×200 country matrix in a Web Worker in **< 100 ms** for a point run, **< 1 s** for a 128-draw uncertainty ensemble. All arrays are `Float64Array` of length `N*N` in row-major order (`idx = i*N + j`).

### 8.1 Interfaces

```ts
export interface CountryFeatures {           // length N, index-aligned to ISO3 list
  iso3: string[];
  pop: Float64Array;                // total population
  wap: Float64Array;                // working-age population 20–64
  pop65: Float64Array;              // 65+
  gdppc: Float64Array;              // GDP per capita, PPP, constant 2021 intl $
  unemployment: Float64Array;       // rate, 0–1
  vacancies: Float64Array;          // job vacancies, absolute (0 where unknown)
  battleDeathsPer100k: Float64Array;// ACLED/UCDP, trailing 12 months
  fragility: Float64Array;          // z-scored fragility index
  policyTightness: Float64Array;    // destination entry restrictiveness, z-scored, + = tighter
  nestId: Uint8Array;               // 0..7 region nest for nested logit
  isEEA: Uint8Array;                // 1 if EU/EEA/CH
  isEuropean: Uint8Array;
  housingHeadroom: Float64Array;    // absorbable persons/yr from vacant dwellings
}

export interface PairFeatures {              // all length N*N
  logDistW: Float64Array;           // ln CEPII distw, km
  contig: Float64Array; comlangOff: Float64Array;
  colony: Float64Array; col45: Float64Array;
  diasporaStock: Float64Array;      // UN DESA origin-i-born living in j
  visaRequired: Float64Array;       // 1 if j requires a visa of i nationals
}

export interface Coefficients {
  b_yd: number; b_yd_eea: number; b_yd_nonEuro: number;
  b_yo: number; theta_h: number; humpMode: 'hump' | 'monotone';
  yStar: number; sigmaY: number;
  b_dist: number; b_net: number; b_comlang: number;
  b_colony: number; b_col45: number; b_contig: number;
  b_policy: number; b_visa: number; b_unemp: number;
  theta_conflict: number; theta_fragility: number;
  emigBase: number;                 // baseline gross emigration rate
  lambda: Float64Array;             // nested-logit dissimilarity per nest, (0,1]
}

export const DEFAULT_COEFFS: Coefficients = {
  b_yd: 0.76, b_yd_eea: 1.90, b_yd_nonEuro: 0.42,
  b_yo: -0.33, theta_h: 0.55, humpMode: 'hump',
  yStar: 8000, sigmaY: 2.2,
  b_dist: -0.80, b_net: 0.70, b_comlang: 0.75,
  b_colony: 0.85, b_col45: 0.77, b_contig: 0.50,
  b_policy: -0.06, b_visa: -0.62,        // ln(1-0.46) ≈ -0.62 → ~46% reduction
  b_unemp: -0.30,
  theta_conflict: 0.35, theta_fragility: 0.25,
  emigBase: 0.0018,                      // ~0.18%/yr gross emigration at the hump peak
  lambda: new Float64Array([0.6,0.5,0.7,0.6,0.5,0.6,0.7,1.0]),
};
```

### 8.2 Stage 1 — origin outflow (the "push")

```
h(yᵢ)  = 1 − ((ln yᵢ − ln y*)/σ_y)²                     // clamp to [−3, 1]
push_i = θ_h·h(yᵢ) + θ_c·ln(1 + bdᵢ) + θ_f·fragilityᵢ   // humpMode='hump'
       = β_yo·(ln yᵢ − ln ȳ) + θ_c·… + θ_f·…            // humpMode='monotone'
Oᵢ     = emigBase · popᵢ · exp(push_i)                  // gross emigrants/yr from i
```

### 8.3 Stage 2 — bilateral attractiveness kernel

```
β_yd(j) = b_yd_eea  if isEEA[j]
        = b_yd_nonEuro if !isEuropean[j]
        = b_yd otherwise

lnAᵢⱼ = β_yd(j)·ln yⱼ
      + b_dist·logDistWᵢⱼ
      + b_net·ln(1 + diasporaᵢⱼ)
      + b_comlang·comlangOffᵢⱼ
      + b_colony·colonyᵢⱼ + b_col45·col45ᵢⱼ
      + b_contig·contigᵢⱼ
      + b_policy·policyTightnessⱼ
      + b_visa·visaRequiredᵢⱼ
      + b_unemp·ln(unemploymentⱼ + 0.01)
lnAᵢᵢ = −Infinity        // no self-flow
```

### 8.4 Stage 3 — nested-logit allocation (handles MRM correctly)

For each origin i, for each nest r: `Iᵢᵣ = λᵣ · ln Σ_{j∈r} exp(lnAᵢⱼ / λᵣ)` (log-sum-exp, subtract the row max for numerical stability). Then
```
P(r|i)  = exp(Iᵢᵣ) / Σ_s exp(Iᵢₛ)
P(j|i,r)= exp(lnAᵢⱼ/λᵣ) / Σ_{k∈r} exp(lnAᵢₖ/λᵣ)
M̂ᵢⱼ    = Oᵢ · P(r(j)|i) · P(j|i,r(j))
```
Row sums equal `Oᵢ` by construction — closing a corridor *redistributes* rather than deletes, which is exactly the MRM property.

### 8.5 Stage 4 — capacity balancing (Furness / IPF)

When destination ceilings `Dⱼ` are supplied (from §8.6 or from a user-set policy quota), run iterative proportional fitting on `Aᵢⱼ`:
```
repeat t = 1..50:
  aᵢ ← Oᵢ / Σⱼ bⱼ·Aᵢⱼ
  bⱼ ← min(1, Dⱼ / Σᵢ aᵢ·Aᵢⱼ)        // one-sided: ceilings, not targets
  stop when max_j |Σᵢ Mᵢⱼ − min(Dⱼ, …)| / Dⱼ < 1e-6
Mᵢⱼ = aᵢ·bⱼ·Aᵢⱼ
```
Unallocated mass `Oᵢ − Σⱼ Mᵢⱼ` is reported explicitly as **"unabsorbed / displaced-in-place"** — never silently dropped. This number is a headline KPI.

### 8.6 Stage 5 — absorption capacity ("how much workforce can it hold?")

Three independent ceilings, take the minimum — this is what makes the product a *calculator* and not a map:

```
LaborHeadroomⱼ    = max(0, vacanciesⱼ − m·unemployedⱼ) / φ_w      m = 0.35 (matching/substitutability), φ_w = 0.78 (migrant working-age share)
HousingHeadroomⱼ  = housingHeadroomⱼ
ReplacementNeedⱼ  = max(0, (r*·pop65ⱼ − wapⱼ) / φ_w)              r* = target potential support ratio, default 3.0 (UN DESA "replacement migration" logic)
AbsorptionCeilingⱼ = min(LaborHeadroomⱼ, HousingHeadroomⱼ) 
DemographicNeedⱼ   = ReplacementNeedⱼ
Dⱼ = policyQuotaⱼ ?? AbsorptionCeilingⱼ
```
Report **need** (`DemographicNeedⱼ`, can vastly exceed capacity) and **capacity** (`Dⱼ`) as two separate, differently-coloured layers. The gap between them is the single most policy-relevant quantity the product produces.

### 8.7 Stage 6 — uncertainty ensemble

```
for d in 1..128:
  β⁽ᵈ⁾ = β̂ + L·z,  z ~ N(0,I), L = chol(Σ), Σ diagonal with σ = SE or 0.25·|β̂|
  run stages 1–5 → M⁽ᵈ⁾
  multiply by overdispersion κ⁽ᵈ⁾ ~ LogNormal(0, s²), s from backtest residuals (default 0.35)
output per cell: p10, p50, p90 (sorted order statistics 13th, 64th, 116th)
```

### 8.8 Performance budget (N = 200, 40,000 cells)

| Step | Ops | Measured budget |
|---|---|---|
| Precompute static part of `lnA` (pair terms, origin-invariant) | 40k × ~8 flops | < 2 ms |
| Full `lnA` + nested-logit log-sum-exp | 40k exps + 2 passes | ~8 ms |
| IPF, 50 iterations | 50 × 80k mul-add | ~10 ms |
| Point run total | — | **< 30 ms** |
| 128-draw ensemble | 128 × ~25 ms | **~1.0 s in a Worker** — run with `SharedArrayBuffer`, stream p50 first, refine intervals progressively |

Use a transferable `ArrayBuffer` back to the main thread; feed the WebGL layer directly from the `Float64Array` (downcast to `Float32Array` for GPU buffers).

### 8.9 Modularity contract

```ts
export interface FlowModel {
  id: string; version: string;
  requires: string[];              // dataset ids it needs
  predict(c: CountryFeatures, p: PairFeatures, k: Coefficients, opts): FlowResult;
  metadata: { citations: string[]; validated: boolean; cpcGlobal?: number };
}
```
Register `gravity-nested-g1`, `radiation-null`, `persistence-null` at launch. `flee-abm` and `views-conflict-prior` register later behind the same interface, server-side. The UI must display `metadata.cpcGlobal` from the backtest next to every model name.

### 8.10 Calibration path (post-MVP, in order)

1. Assemble the panel: OECD IMD / Abel–Cohen flow estimates as `M`, CEPII Gravity as pairs, UN DESA stocks as `S`, WDI as `y`.
2. Fit by **PPML** with origin-year and destination-year fixed effects (`fixest::fepois` in R, `ppmlhdfe` in Stata, `pyfixest` in Python), cluster SEs on the dyad. Export `β̂` and `Σ` as JSON into the browser bundle — the browser never fits, it only evaluates.
3. Fit `λᵣ` by nested-logit MLE or a grid search over (0,1] maximising held-out CPC.
4. Calibrate `θ_conflict`, `θ_fragility`, `emigBase` against UNHCR refugee outflows and IDMC new displacements using VIEWS fatality forecasts as the conflict driver.
5. Only then replace the diagonal Σ with the real PPML covariance and drop the 0.25·|β| placeholder.
