import { create } from 'zustand';
import type { Corridor, Manifest, Place } from './types';
import { DEFAULT_FILTERS, DEFAULT_OVERLAYS, type Filters, type Overlays, type SurfaceId } from './layers';
import type { Vintage } from './vintage';

/** One entry in public/snapshot/layers/index.json. The rows live in a sibling file. */
export interface LayerMeta {
  id: string;
  title: string;
  question: string;
  unit: string;
  entity: 'country' | 'corridor';
  periods: string[];
  vintage: Vintage;
  note: string;
  entities: number;
  adapter: string;
}

/** key -> period -> value. `key` is an iso3, or 'ORIG>DEST' for a corridor layer. */
export type LayerRows = Record<string, Record<string, number>>;

interface S {
  /** Layer metadata, loaded up front so the panel can draw a chip with its vintage before
   *  fetching the layer behind it. These files are far bigger than the index. */
  layerIndex: LayerMeta[];
  /** Rows, fetched the first time a layer is actually asked for. */
  layerRows: Record<string, LayerRows>;
  layerPending: Record<string, boolean>;
  loadLayer: (id: string) => Promise<void>;
  year: number;
  periodStarts: number[];
  places: Place[];
  corridors: Corridor[];
  adm0: GeoJSON.FeatureCollection | null;
  adm0Outline: GeoJSON.FeatureCollection | null;
  manifest: Manifest | null;
  surface: SurfaceId;
  overlays: Overlays;
  filters: Filters;
  selected: string | null;   // iso3
  hovered: string | null;
  ready: boolean;
  setYear: (y: number) => void;
  setSurface: (s: SurfaceId) => void;
  toggleOverlay: (k: keyof Overlays) => void;
  setFilters: (f: Partial<Filters>) => void;
  select: (iso3: string | null) => void;
  hover: (iso3: string | null) => void;
  load: () => Promise<void>;
}

export const useStore = create<S>((set) => ({
  layerIndex: [], layerRows: {}, layerPending: {},
  year: 2019, periodStarts: [], places: [], corridors: [], adm0: null, adm0Outline: null, manifest: null,
  surface: 'inbound', overlays: DEFAULT_OVERLAYS, filters: DEFAULT_FILTERS,
  selected: null, hovered: null, ready: false,
  setYear: (year) => set({ year }),
  setSurface: (surface) => set({ surface }),
  toggleOverlay: (k) => set((st) => ({ overlays: { ...st.overlays, [k]: !st.overlays[k] } })),
  setFilters: (f) => set((st) => ({ filters: { ...st.filters, ...f } })),
  select: (selected) => set({ selected }),
  hover: (hovered) => set({ hovered }),
  /** Fetch one layer's rows once. Concurrent callers share the same in-flight request rather
   *  than racing to download the same half-megabyte. */
  loadLayer: async (id) => {
    const st = useStore.getState();
    if (st.layerRows[id] || st.layerPending[id]) return;
    set((s) => ({ layerPending: { ...s.layerPending, [id]: true } }));
    try {
      const r = await fetch(`/snapshot/layers/${id}.json`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const { rows } = await r.json();
      set((s) => ({ layerRows: { ...s.layerRows, [id]: rows } }));
    } catch {
      // A layer that will not load is absent, not empty. The panel keeps its chip and greys
      // it; painting a missing layer as zeros is the lie this whole project is against.
    } finally {
      set((s) => ({ layerPending: { ...s.layerPending, [id]: false } }));
    }
  },
  load: async () => {
    const json = (u: string) => fetch(u).then((r) => r.json());
    const [p, c, a, ao, m, li] = await Promise.all([
      json('/snapshot/places.json'),
      json('/snapshot/corridors.json'),
      json('/snapshot/adm0.json'),
      json('/snapshot/adm0_outline.json'),
      json('/snapshot/manifest.json'),
      // The layer index is optional: a checkout that has not run build-layers.mjs still works,
      // it just has nothing beyond the original snapshot.
      json('/snapshot/layers/index.json').catch(() => ({ layers: [] })),
    ]);
    set({
      places: p.places, corridors: c.corridors, periodStarts: c.periodStarts ?? [],
      adm0: a, adm0Outline: ao, manifest: m,
      layerIndex: li.layers ?? [], ready: true,
    });
  },
}));
