
export enum ViewType {
  HOME = 'HOME',
  TASKS = 'TASKS',
  STATS = 'STATS',
  NON_BUYERS = 'NON_BUYERS',
  PROFILE = 'PROFILE'
}

export interface NonBuyer {
  sector: string;
  pdvCode: string;
  fantasyName: string;
  lastVisit: string;
  normalizedCode: string; // Helper for matching
}

export interface TaskSkuMap {
  hashId: string;
  skus: string[];
}

export interface ProductImage {
  id: string;
  name: string;
  imageUrl: string;
  normalizedName: string; // Helper for case-insensitive matching
}

export interface Consultant {
  id: string;
  sector: string;
  pass: string;
  avatarUrl: string;
  name: string;
  avatarBase64?: string; // Armazena a imagem codificada para acesso offline
}

export interface Task {
  id: string;
  title: string;
  status: 'OVERDUE' | 'ACTIVE' | 'SCHEDULED' | 'COMPLETED';
  dueTime: string;
  description: string;
  location?: string;
  priority?: string;
  // Sheet specific fields
  sectorCode: string;
  pdvCode: string;
  pdvName: string;
  coins: number;
  category: string;
  subject: string;
  operation: string;
  hashId: string;
  cluster: string;
  flagScore: string;
  // New computed/parsed fields
  isNonBuyer?: boolean;
  associatedSkus?: string[]; // List of items from SKU Map
  boughtCount?: number;      // From "COMPRADOS VS FALTANTES" (numerator)
  mixTotal?: number;         // From "COMPRADOS VS FALTANTES" (denominator)
  missingCount?: number;     // From "FALTANTE" column or calculated
}

export interface SKU {
  id: string;
  name: string;
  sku: string;
  velocity: string;
  unitsSold: number;
  imageUrl: string;
}

// Optimized Map for instant image lookup: { "sku name": "url" }
export type ImageMap = Record<string, string>;

export interface AppData {
  tasks: Task[];
  allTasks: Task[];
  userSector: string;
  isLoading: boolean;
}
