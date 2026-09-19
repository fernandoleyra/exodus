/** Spherical linear interpolation between two lon/lat points.
 *  ArcLayer draws a chord through the sphere; on a globe we need the path ON the sphere,
 *  so we generate it ourselves and hand it to PathLayer. */
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

export function greatCircle(
  a: [number, number], b: [number, number], segments = 48,
): [number, number][] {
  const [lon1, lat1] = [rad(a[0]), rad(a[1])];
  const [lon2, lat2] = [rad(b[0]), rad(b[1])];
  const d = 2 * Math.asin(Math.sqrt(
    Math.sin((lat2 - lat1) / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2));
  if (!isFinite(d) || d === 0) return [a, b];

  const pts: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const f = i / segments;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);
    pts.push([deg(Math.atan2(y, x)), deg(Math.atan2(z, Math.hypot(x, y)))]);
  }
  // Split at the antimeridian would be needed for a flat map; on a globe the renderer
  // handles the wrap, but a >180° jump between consecutive points still tears, so nudge.
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1]!, cur = pts[i]!;
    while (cur[0] - prev[0] > 180) cur[0] -= 360;
    while (cur[0] - prev[0] < -180) cur[0] += 360;
  }
  return pts;
}
