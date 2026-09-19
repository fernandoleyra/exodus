import { PageShell } from './PageShell';

export function Legal() {
  return (
    <PageShell title="Terms, liability and privacy" kicker="Legal">
      <p className="lede">
        Plain terms, and an honest account of what they can and cannot do. Written to be read,
        not to be survived.
      </p>

      <h2>1. What this is</h2>
      <p>
        Exodus is a free, open-source instrument for reading published migration research. It
        renders modelled estimates produced by third parties. It is not a register, not a
        census, not an official statistic, and not a source of truth about any person or place.
      </p>

      <h2>2. Every figure is a modelled estimate</h2>
      <p>
        <b>No bilateral migration figure shown here is an observation.</b> Each one is the
        output of a statistical or machine-learning model built by researchers, carrying its
        own assumptions and error. Where two published models of the same corridor are
        available, this tool shows you how far apart they are — frequently by a factor of
        several. Treat every number as an argument about the world, not a measurement of it.
      </p>

      <h2>3. Your use is yours</h2>
      <p>
        You are solely responsible for how you interpret, rely on, republish or act upon
        anything here, and for any consequence of doing so. That includes conclusions you
        draw, decisions you or your organisation take, and anything you publish. Nothing here
        is legal, policy, operational, humanitarian, financial or immigration advice.
      </p>

      <h2>4. No warranty</h2>
      <p>
        This software and its data are provided <b>&ldquo;as is&rdquo; and
        &ldquo;as available&rdquo;, without warranty of any kind</b>, express or implied,
        including merchantability, fitness for a particular purpose, accuracy, completeness,
        currency, non-infringement, or uninterrupted availability. Upstream sources may be
        wrong, stale, revised or withdrawn without notice, and derived figures may be affected
        by processing errors in this software.
      </p>

      <h2>5. Limitation of liability</h2>
      <p>
        To the fullest extent permitted by applicable law, the authors and contributors accept
        no liability for any loss or damage — direct, indirect, incidental, special,
        consequential, punitive, or for loss of profits, data, goodwill or opportunity —
        arising from use of, or inability to use, this software or its data, whether in
        contract, tort, negligence or otherwise, and whether or not advised of the possibility.
        This mirrors sections 15 and 16 of the GNU Affero General Public License, under which
        this software is distributed.
      </p>

      <h2>6. What no disclaimer can exclude</h2>
      <p className="honest">
        We will not pretend a clause can do more than the law allows. Under EU and most
        national law, liability <b>cannot</b> be excluded for death or personal injury caused
        by negligence, for fraud or fraudulent misrepresentation, for gross negligence or
        wilful misconduct, or for rights that consumer-protection law makes non-waivable.
        Where any part of these terms is unenforceable, the rest continues to apply. A project
        claiming to have disclaimed <i>everything</i> is telling you something untrue, and we
        would rather be accurate than appear invulnerable.
      </p>

      <h2>7. Acceptable use</h2>
      <p>
        You must not use this tool, or anything derived from it, to identify, locate, profile,
        target, detain, interdict, expel or otherwise act against any person or group. It is
        published to improve public understanding, and its licence exists specifically to stop
        it being turned into an instrument of control.
      </p>

      <h2>8. Privacy</h2>
      <p>
        <b>We collect nothing.</b> There are no accounts, no logins, no cookies, no analytics,
        no telemetry, no fingerprinting and no third-party requests while you use the
        application. We cannot identify you, and we have deliberately built nothing that could.
      </p>
      <p>
        One item is stored in your browser&rsquo;s local storage: a timestamp recording that
        you accepted these terms, so you are not asked twice. It never leaves your device, is
        readable only by you, and can be removed by clearing site data.
      </p>
      <p className="honest">
        We think that falls under the &ldquo;strictly necessary&rdquo; exemption in Article
        5(3) of the ePrivacy Directive, since it exists only to deliver something you asked
        for. We will not overstate it: the Article 29 Working Party&rsquo;s guidance frames
        that exemption around <i>session or short-term</i> storage, and this entry persists
        until you clear it. If that distinction matters to you, clearing site data removes it
        and the application works exactly as before.
      </p>
      <p className="muted">
        Whoever hosts a copy of this site may keep their own server logs, which can include IP
        addresses. That is the host&rsquo;s processing, under their policy and their
        controllership, not ours. If you run your own copy, that responsibility is yours.
      </p>

      <h2>9. Licence</h2>
      <p>
        All application code is <b>AGPL-3.0-or-later</b>. Documentation is CC BY-4.0. Data
        remains under the licences of its original publishers, each named in the source
        ledger &mdash; note that Natural Earth is public domain and its authors expressly waive
        any requirement to credit them; we credit them anyway. These terms supplement those
        licences and do not restrict any right they grant you.
      </p>

      <h2>10. Changes</h2>
      <p>
        These terms may change. The authoritative version is the one in the public repository,
        with its full revision history — you can read exactly what changed and when.
      </p>
    </PageShell>
  );
}
