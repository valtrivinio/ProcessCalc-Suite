
export interface PipeSchedule {
  od: number; // mm
  wall: number; // mm
  id: number; // mm
}

export interface PipeSize {
  nps: string;
  schedules: Record<string, PipeSchedule>;
}

// ASME B36.10M Standard Pipe Sizes
export const PIPE_DATABASE: Record<string, PipeSize> = {
  '0.5': {
    nps: '1/2',
    schedules: {
      '40': { od: 21.34, wall: 2.77, id: 15.80 },
      '80': { od: 21.34, wall: 3.73, id: 13.88 },
      '160': { od: 21.34, wall: 4.78, id: 11.78 },
      'XXS': { od: 21.34, wall: 7.47, id: 6.40 },
    }
  },
  '0.75': {
    nps: '3/4',
    schedules: {
      '40': { od: 26.67, wall: 2.87, id: 20.93 },
      '80': { od: 26.67, wall: 3.91, id: 18.85 },
      '160': { od: 26.67, wall: 5.56, id: 15.55 },
      'XXS': { od: 26.67, wall: 7.82, id: 11.03 },
    }
  },
  '1': {
    nps: '1',
    schedules: {
      '40': { od: 33.40, wall: 3.38, id: 26.64 },
      '80': { od: 33.40, wall: 4.55, id: 24.30 },
      '160': { od: 33.40, wall: 6.35, id: 20.70 },
      'XXS': { od: 33.40, wall: 9.09, id: 15.22 },
    }
  },
  '1.5': {
    nps: '1.5',
    schedules: {
      '40': { od: 48.26, wall: 3.68, id: 40.90 },
      '80': { od: 48.26, wall: 5.08, id: 38.10 },
      '160': { od: 48.26, wall: 7.14, id: 33.98 },
      'XXS': { od: 48.26, wall: 10.15, id: 27.96 },
    }
  },
  '2': {
    nps: '2',
    schedules: {
      '40': { od: 60.33, wall: 3.91, id: 52.51 },
      '80': { od: 60.33, wall: 5.54, id: 49.25 },
      '160': { od: 60.33, wall: 8.74, id: 42.85 },
      'XXS': { od: 60.33, wall: 11.07, id: 38.19 },
    }
  },
  '3': {
    nps: '3',
    schedules: {
      '40': { od: 88.90, wall: 5.49, id: 77.92 },
      '80': { od: 88.90, wall: 7.62, id: 73.66 },
      '160': { od: 88.90, wall: 11.13, id: 66.64 },
      'XXS': { od: 88.90, wall: 15.24, id: 58.42 },
    }
  },
  '4': {
    nps: '4',
    schedules: {
      '40': { od: 114.30, wall: 6.02, id: 102.26 },
      '80': { od: 114.30, wall: 8.56, id: 97.18 },
      '120': { od: 114.30, wall: 11.13, id: 92.04 },
      '160': { od: 114.30, wall: 13.49, id: 87.32 },
      'XXS': { od: 114.30, wall: 17.12, id: 80.06 },
    }
  },
  '6': {
    nps: '6',
    schedules: {
      '40': { od: 168.28, wall: 7.11, id: 154.06 },
      '80': { od: 168.28, wall: 10.97, id: 146.34 },
      '120': { od: 168.28, wall: 14.27, id: 139.74 },
      '160': { od: 168.28, wall: 18.26, id: 131.76 },
      'XXS': { od: 168.28, wall: 21.95, id: 124.38 },
    }
  },
  '8': {
    nps: '8',
    schedules: {
      '40': { od: 219.08, wall: 8.18, id: 202.72 },
      '80': { od: 219.08, wall: 12.70, id: 193.68 },
      '100': { od: 219.08, wall: 15.09, id: 188.90 },
      '120': { od: 219.08, wall: 18.26, id: 182.56 },
      '140': { od: 219.08, wall: 20.62, id: 177.84 },
      '160': { od: 219.08, wall: 23.01, id: 173.06 },
      'XXS': { od: 219.08, wall: 22.23, id: 174.62 },
    }
  },
  '10': {
    nps: '10',
    schedules: {
      '40': { od: 273.05, wall: 9.27, id: 254.51 },
      '60': { od: 273.05, wall: 12.70, id: 247.65 },
      '80': { od: 273.05, wall: 15.09, id: 242.87 },
      '100': { od: 273.05, wall: 18.26, id: 236.53 },
      '120': { od: 273.05, wall: 21.44, id: 230.17 },
      '140': { od: 273.05, wall: 25.40, id: 222.25 },
      '160': { od: 273.05, wall: 28.58, id: 215.89 },
    }
  },
  '12': {
    nps: '12',
    schedules: {
      'STD': { od: 323.85, wall: 9.53, id: 304.79 },
      '40': { od: 323.85, wall: 10.31, id: 303.23 },
      'XS': { od: 323.85, wall: 12.70, id: 298.45 },
      '80': { od: 323.85, wall: 17.48, id: 288.89 },
      '160': { od: 323.85, wall: 33.32, id: 257.21 },
    }
  }
};

export const MATERIAL_ROUGHNESS: Record<string, number> = {
  'Carbon Steel (New)': 0.0457,
  'Carbon Steel (Corroded)': 0.5,
  'Stainless Steel': 0.015,
  'PVC / Plastic': 0.0015,
  'Galvanized Iron': 0.15,
  'Concrete': 0.3,
  'Cast Iron': 0.26,
};
