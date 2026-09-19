import { create } from 'zustand';
import type { Corridor, Manifest, Place } from './types';

interface S {
  year: number;
  periodStarts: number[];
  places: Place[];
  corridors: Corridor[];
  adm0: GeoJSON.FeatureCollection | null;
  manifest: Manifest | null;
  selected: string | null;   // iso3
  hovered: string | null;
  ready: boolean;
  setYear: (y: number) => void;
  select: (iso3: string | null) => void;
  hover: (iso3: string | null) => void;
  load: () => Promise<void>;
}

export const useStore = create<S>((set) => ({
  year: 2019, periodStarts: [], places: [], corridors: [], adm0: null, manifest: null,
  selected: null, hovered: null, ready: false,
  setYear: (year) => set({ year }),
  select: (selected) => set({ selected }),
  hover: (hovered) => set({ hovered }),
  load: async () => {
    const [p, c, a, m] = await Promise.all([
      fetch('/snapshot/places.json').then((r) => r.json()),
      fetch('/snapshot/corridors.json').then((r) => r.json()),
      fetch('/snapshot/adm0.json').then((r) => r.json()),
      fetch('/snapshot/manifest.json').then((r) => r.json()),
    ]);
    set({ places: p.places, corridors: c.corridors, periodStarts: c.periodStarts ?? [], adm0: a, manifest: m, ready: true });
  },
}));
