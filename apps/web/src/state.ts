import { create } from 'zustand';
import type { Corridor, Manifest, Place } from './types';
import { DEFAULT_FILTERS, DEFAULT_OVERLAYS, type Filters, type Overlays, type SurfaceId } from './layers';

interface S {
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
  year: 2019, periodStarts: [], places: [], corridors: [], adm0: null, adm0Outline: null, manifest: null,
  surface: 'inbound', overlays: DEFAULT_OVERLAYS, filters: DEFAULT_FILTERS,
  selected: null, hovered: null, ready: false,
  setYear: (year) => set({ year }),
  setSurface: (surface) => set({ surface }),
  toggleOverlay: (k) => set((st) => ({ overlays: { ...st.overlays, [k]: !st.overlays[k] } })),
  setFilters: (f) => set((st) => ({ filters: { ...st.filters, ...f } })),
  select: (selected) => set({ selected }),
  hover: (hovered) => set({ hovered }),
  load: async () => {
    const [p, c, a, ao, m] = await Promise.all([
      fetch('/snapshot/places.json').then((r) => r.json()),
      fetch('/snapshot/corridors.json').then((r) => r.json()),
      fetch('/snapshot/adm0.json').then((r) => r.json()),
      fetch('/snapshot/adm0_outline.json').then((r) => r.json()),
      fetch('/snapshot/manifest.json').then((r) => r.json()),
    ]);
    set({ places: p.places, corridors: c.corridors, periodStarts: c.periodStarts ?? [], adm0: a, adm0Outline: ao, manifest: m, ready: true });
  },
}));
