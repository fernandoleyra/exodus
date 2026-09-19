import { PageShell } from './PageShell';

export function Methods() {
  return (
    <PageShell title="How the numbers are made, and what they cannot tell you" kicker="Methods">
      <p className="lede">
        The most useful page in this application is the one that says what it does not know.
      </p>

      <h2>The accuracy ceiling of this field</h2>
      <p>
        Robinson &amp; Dilkina evaluated machine-learning and traditional models of global
        migration on the Common Part of Commuters, a similarity score where 1.0 is a perfect
        match. On the global matrix, with a production function supplied:
      </p>
      <table className="tbl">
        <thead><tr><th>Model</th><th>CPC, with production function</th><th>without</th></tr></thead>
        <tbody>
          <tr><td>Gravity</td><td>0.16</td><td>—</td></tr>
          <tr><td>Radiation</td><td>0.16</td><td>—</td></tr>
          <tr><td>XGBoost + extended features</td><td>0.21</td><td>0.43</td></tr>
          <tr><td>Artificial neural network + extended</td><td>0.22</td><td>0.40</td></tr>
        </tbody>
      </table>
      <p className="muted">
        Robinson &amp; Dilkina, <i>A Machine Learning Approach to Modeling Human Migration</i>,
        ACM COMPASS 2018, doi:10.1145/3209811.3209868, Table 3, CPC column, metrics on the full
        matrix. These are <b>global</b> figures. The same paper&rsquo;s county-level USA
        results are roughly three times higher and are not comparable.
      </p>
      <p>
        Gravity and radiation have no &ldquo;without&rdquo; value because the production
        function is what defines them. Note that the two learned models score
        <b> roughly twice as well without</b> the crude origin-outflow constraint than with it:
        a published score tells you as much about the constraint imposed as about the model.
      </p>

      <h2>Cross-model disagreement</h2>
      <p>
        Two independently published estimates of the same corridor are compared only on the six
        five-year periods both cover, as a step function, never interpolated across the gaps.
        Neither model is rescaled before the comparison. Summed correctly the two agree to
        within 0.25% in aggregate volume, so there is no scale difference to normalise away
        &mdash; and normalising anyway would quietly shrink a disagreement rather than report it.
      </p>
      <p>
        The measure is the symmetric relative difference, |a−b| divided by their mean, so it
        runs from <b>0 to 200%</b>. 200% means one model reports a substantial flow where the
        other reports almost nothing. The median across <b>8,854</b> corroborated
        corridor-periods is <b>75%</b>.
      </p>
      <p className="honest">
        1,538 of 1,548 corridors have a second opinion in at least one period, and the shared
        grid ends with the window that closes in 2020. From 2020 onward <b>nothing here is
        corroborated</b>, and the globe renders every corridor grey and broken to say so. That
        is not the same as the models agreeing.
      </p>
      <p>
        That 75% is one number describing one pair. The{' '}
        <a href="#/concordance">concordance page</a> does the same exercise across every
        quantity in the application for which more than one organisation publishes a figure,
        and classifies each gap rather than only measuring it: a gap that is one uniform shift
        is a definition, a gap that varies country by country is a disagreement, and a pair
        that matches exactly is usually not two sources at all.
      </p>

      <h2>Service-stock headroom</h2>
      <p>
        The question &ldquo;how many more could a country hold&rdquo; has no single honest
        answer, and a product that prints one is lying. We compute a Liebig minimum over four
        published service stocks — hospital beds, physicians, pupil-teacher ratio and
        employment rate — against stated, editable targets, and <b>always name which
        constraint binds</b>. It is never collapsed into a score.
      </p>
      <p>
        A negative result is an existing deficit, not spare capacity, and renders as negative.
        Where fewer than three stocks are published for a country, the model <b>refuses</b>
        rather than imputing the rest.
      </p>
      <p className="honest">
        It is not a forecast. It models no prices, wages, politics, informal economy or
        second-order effects, and it says nothing whatever about whether a country should admit
        anyone. It is one arithmetic framing of published stocks, offered so you can argue with
        the assumptions — which are shown, and which you can change.
      </p>

      <h2>What we deliberately did not build</h2>
      <p>
        No departure forecasting. No origin-side &ldquo;pressure index&rdquo;. No individual or
        household-level anything. No real-time claims: the fastest genuinely live bilateral
        signal in the world is monthly asylum-application data for a few dozen countries, and
        nothing on this globe is live. The allocation solver exists but is excluded from this
        build entirely, behind an enforced test.
      </p>
    </PageShell>
  );
}
