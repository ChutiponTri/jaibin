import type {
  ClassificationResult,
  ClassifiedPrediction,
  RawPrediction,
  WasteCategory,
  WasteCategoryId,
} from '../types/garbage'

export const MODEL_URL = 'https://teachablemachine.withgoogle.com/models/w4117a9bm/'

export const WASTE_CATEGORIES: Record<WasteCategoryId, WasteCategory> = {
  hazardous: {
    id: 'hazardous',
    label: 'Hazardous',
    labelTh: 'ถังขยะอันตราย',
    binColorTh: 'สีแดง',
    guidance: 'ทิ้งในถังขยะอันตราย (สีแดง) หรือจุดรับขยะ E-Waste / ถ่านไฟฉายเก่า',
    subClasses: ['battery'],
    badgeClass: 'bg-red-600 text-white',
    cardClass: 'bg-red-50 border-red-200 text-red-900',
    barClass: 'bg-red-500',
  },
  recyclable: {
    id: 'recyclable',
    label: 'Recyclable',
    labelTh: 'ถังขยะรีไซเคิล',
    binColorTh: 'สีเหลือง',
    guidance:
      'ทิ้งในถังขยะรีไซเคิล (สีเหลือง) ควรเทเศษอาหาร/น้ำออก และทำความสะอาดเบื้องต้นก่อนทิ้ง',
    subClasses: [
      'brown-glass',
      'green-glass',
      'white-glass',
      'cardboard',
      'paper',
      'plastic',
      'metal',
    ],
    badgeClass: 'bg-yellow-400 text-yellow-950',
    cardClass: 'bg-yellow-50 border-yellow-300 text-yellow-950',
    barClass: 'bg-yellow-400',
  },
  general: {
    id: 'general',
    label: 'Non-Recyclable',
    labelTh: 'ถังขยะทั่วไป',
    binColorTh: 'สีน้ำเงิน',
    guidance:
      'ทิ้งในถังขยะทั่วไป (สีน้ำเงิน) หรือถังขยะเปียก/เศษอาหาร (หากเป็น biological)',
    subClasses: ['clothes', 'shoes', 'trash', 'biological'],
    badgeClass: 'bg-blue-600 text-white',
    cardClass: 'bg-blue-50 border-blue-200 text-blue-900',
    barClass: 'bg-blue-500',
  },
}

const SUBCLASS_TO_CATEGORY = new Map<string, WasteCategory>(
  Object.values(WASTE_CATEGORIES).flatMap((cat) =>
    cat.subClasses.map((sub) => [sub, cat] as const),
  ),
)

/** "Brown Glass" / "brown_glass" / " brown-glass " → "brown-glass" */
export function normalizeClassName(name: string): string {
  return name.trim().toLowerCase().replace(/[\s_]+/g, '-')
}

export function mapToCategory(className: string): WasteCategory | null {
  return SUBCLASS_TO_CATEGORY.get(normalizeClassName(className)) ?? null
}

export function classify(raw: RawPrediction[]): ClassificationResult | null {
  if (raw.length === 0) return null
  const predictions: ClassifiedPrediction[] = raw
    .map((p) => ({
      ...p,
      normalizedName: normalizeClassName(p.className),
      category: mapToCategory(p.className),
    }))
    .sort((a, b) => b.probability - a.probability)
  return { top: predictions[0], predictions, timestamp: Date.now() }
}

export function formatPercent(probability: number): string {
  return `${Math.round(probability * 100)}%`
}
