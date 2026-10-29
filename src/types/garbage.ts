export type WasteCategoryId = 'hazardous' | 'recyclable' | 'general'

export type SubClassName =
  | 'battery'
  | 'brown-glass'
  | 'green-glass'
  | 'white-glass'
  | 'cardboard'
  | 'paper'
  | 'plastic'
  | 'metal'
  | 'clothes'
  | 'shoes'
  | 'trash'
  | 'biological'

/** Raw output from the Teachable Machine model. */
export interface RawPrediction {
  className: string
  probability: number
}

/** Visual + guidance metadata for one of the 3 main bin categories. */
export interface WasteCategory {
  id: WasteCategoryId
  label: string
  labelTh: string
  binColorTh: string
  guidance: string
  subClasses: readonly SubClassName[]
  /** Tailwind classes for the solid badge. */
  badgeClass: string
  /** Tailwind classes for the soft guide card. */
  cardClass: string
  /** Tailwind class for progress-bar fill. */
  barClass: string
}

/** A prediction enriched with its mapped main category (null if unmapped). */
export interface ClassifiedPrediction extends RawPrediction {
  normalizedName: string
  category: WasteCategory | null
}

export interface ClassificationResult {
  top: ClassifiedPrediction
  predictions: ClassifiedPrediction[]
  timestamp: number
}

export type DetectionMode = 'webcam' | 'upload'

export type FacingMode = 'user' | 'environment'
