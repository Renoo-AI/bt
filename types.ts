
export enum ProductCategory {
  MAISON_DECO = 'Maison & Déco',
  CUISINE = 'Cuisine',
  BEAUTE_BIEN_ETRE = 'Beauté & Bien-être',
  SPORT_LOISIRS = 'Sport & Loisirs',
  BEBE = 'Bébé',
  AUTO_MOTO = 'Auto & Moto',
  BRICOLAGE = 'Bricolage',
  DIVERS = 'Divers'
}

export interface AnalysisResult {
  productName: string;
  category: ProductCategory;
  confidence: number;
  reasoning: string;
  suggestedTags: string[];
}

export interface ScanHistoryItem {
  id: string;
  timestamp: number;
  image?: string;
  description?: string;
  result: AnalysisResult;
}
