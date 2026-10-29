import { useState } from 'react'
import { Biohazard, ChevronDown, CircleHelp, Recycle, ScanSearch, Trash2, type LucideIcon } from 'lucide-react'
import type { ClassificationResult, WasteCategoryId } from '../types/garbage'
import { formatPercent } from '../lib/wasteMapping'

const CATEGORY_ICONS: Record<WasteCategoryId, LucideIcon> = {
  hazardous: Biohazard,
  recyclable: Recycle,
  general: Trash2,
}

const DEFAULT_VISIBLE = 5

interface ResultPanelProps {
  result: ClassificationResult | null
}

export default function ResultPanel({ result }: ResultPanelProps) {
  const [showAll, setShowAll] = useState(false)

  if (!result) {
    return (
      <div className="flex h-full min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center text-slate-500">
        <ScanSearch className="size-10" aria-hidden />
        <p className="font-medium text-slate-700">ยังไม่มีผลการวิเคราะห์</p>
        <p className="text-sm">เปิดกล้องหรืออัปโหลดรูปภาพขยะเพื่อเริ่มจำแนกประเภท</p>
      </div>
    )
  }

  const { top, predictions } = result
  const category = top.category
  const Icon = category ? CATEGORY_ICONS[category.id] : CircleHelp
  const visible = showAll ? predictions : predictions.slice(0, DEFAULT_VISIBLE)

  return (
    <div className="flex flex-col gap-4" aria-live="polite">
      {/* Top result */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">ผลลัพธ์ที่มั่นใจที่สุด</p>
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="text-3xl font-bold capitalize tracking-tight text-slate-900 sm:text-4xl">
            {top.normalizedName.replace(/-/g, ' ')}
          </h2>
          <span className="text-3xl font-bold tabular-nums text-emerald-600 sm:text-4xl">
            {formatPercent(top.probability)}
          </span>
        </div>
        <div className="mt-4">
          {category ? (
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold shadow-sm transition-colors ${category.badgeClass}`}
            >
              <Icon className="size-4" aria-hidden />
              {category.label} · {category.labelTh}
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-200 px-3.5 py-1.5 text-sm font-semibold text-slate-700">
              <Icon className="size-4" aria-hidden />
              ไม่ทราบประเภท
            </span>
          )}
        </div>
      </section>

      {/* Disposal guide */}
      {category && (
        <section className={`flex gap-4 rounded-2xl border-2 p-5 transition-colors sm:p-6 ${category.cardClass}`}>
          <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${category.badgeClass}`}>
            <Icon className="size-6" aria-hidden />
          </span>
          <div>
            <h3 className="text-lg font-bold">
              ทิ้งลง{category.labelTh} ({category.binColorTh})
            </h3>
            <p className="mt-1 leading-relaxed">{category.guidance}</p>
          </div>
        </section>
      )}

      {/* Breakdown */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <h3 className="text-sm font-semibold text-slate-700">ความน่าจะเป็นของแต่ละประเภท</h3>
        <ul className="mt-4 flex flex-col gap-3">
          {visible.map((p) => (
            <li key={p.className}>
              <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={`size-2.5 shrink-0 rounded-full ${p.category?.barClass ?? 'bg-slate-400'}`}
                    aria-hidden
                  />
                  <span className="truncate font-medium capitalize text-slate-800">{p.className}</span>
                  {p.category && (
                    <span className="hidden text-xs text-slate-400 sm:inline">{p.category.label}</span>
                  )}
                </span>
                <span className="tabular-nums text-slate-600">{formatPercent(p.probability)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-[width] duration-300 ease-out ${p.category?.barClass ?? 'bg-slate-400'}`}
                  style={{ width: `${Math.max(p.probability * 100, 0.5)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
        {predictions.length > DEFAULT_VISIBLE && (
          <button
            type="button"
            onClick={() => setShowAll((s) => !s)}
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-600"
          >
            {showAll ? 'แสดงน้อยลง' : `แสดงทั้งหมด (${predictions.length})`}
            <ChevronDown className={`size-4 transition-transform ${showAll ? 'rotate-180' : ''}`} aria-hidden />
          </button>
        )}
      </section>
    </div>
  )
}
