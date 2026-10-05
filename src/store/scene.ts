import { create } from 'zustand';
import type { Spot } from '../lib/hotspots';

export interface ActiveSpot extends Spot {
  count?: number;
  headline?: string;
}

interface SceneState {
  /** el hero (y el globo) está en pantalla; si no, lo sustituye el orbe de la barra superior */
  heroVisible: boolean;
  setHeroVisible: (visible: boolean) => void;
  /** lugar resaltado: lo fija un titular bajo el cursor o un indicador del globo */
  spot: ActiveSpot | null;
  setSpot: (spot: ActiveSpot | null) => void;
}

/** Estado que conecta el feed con el globo. */
export const useScene = create<SceneState>((set, get) => ({
  heroVisible: true,
  setHeroVisible: (heroVisible) => set({ heroVisible }),
  spot: null,
  setSpot: (spot) => {
    if (get().spot?.id !== spot?.id) set({ spot });
  },
}));
