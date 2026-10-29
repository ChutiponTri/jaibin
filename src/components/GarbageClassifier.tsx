import { useCallback, useState } from 'react'
import { Biohazard, Camera, ImageUp, Leaf, Loader2, Recycle, RefreshCw, Trash2, TriangleAlert } from 'lucide-react'
import type { ClassificationResult, DetectionMode, RawPrediction } from '../types/garbage'
import { WASTE_CATEGORIES, classify } from '../lib/wasteMapping'
import { useTeachableModel } from '../hooks/useTeachableModel'
import WebcamPanel from './WebcamPanel'
import UploadPanel from './UploadPanel'
import ResultPanel from './ResultPanel'

const MODES: { id: DetectionMode; label: string; icon: typeof Camera }[] = [
  { id: 'webcam', label: 'กล้องสด', icon: Camera },
  { id: 'upload', label: 'อัปโหลดรูป', icon: ImageUp },
]

const LEGEND = [
  { category: WASTE_CATEGORIES.hazardous, icon: Biohazard },
  { category: WASTE_CATEGORIES.recyclable, icon: Recycle },
  { category: WASTE_CATEGORIES.general, icon: Trash2 },
]

export default function GarbageClassifier() {
  const [reloadKey, setReloadKey] = useState(0)
  const { model, tmImage, status, error } = useTeachableModel(reloadKey)
  const [mode, setMode] = useState<DetectionMode>('webcam')
  const [result, setResult] = useState<ClassificationResult | null>(null)

  const handlePredictions = useCallback((predictions: RawPrediction[]) => {
    setResult(classify(predictions))
  }, [])
  const clearResult = useCallback(() => setResult(null), [])

  const switchMode = (next: DetectionMode) => {
    if (next === mode) return
    setMode(next)
    setResult(null)
  }

  return (
    <div className={`min-h-dvh bg-gradient-to-b from-emerald-50 via-slate-50 to-slate-100 ${mode === 'webcam' ? 'pb-28 md:pb-0' : ''}`}>
      <header className="border-b border-slate-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:px-6">
          <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <Leaf className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-slate-900 sm:text-xl">JaiBin · คัดแยกขยะด้วย AI</h1>
            <p className="truncate text-xs text-slate-500 sm:text-sm">ส่องขยะแล้วรู้ทันทีว่าควรทิ้งถังไหน</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
        {/* Mode switcher */}
        <div role="tablist" aria-label="โหมดการตรวจจับ" className="mx-auto mb-6 grid max-w-sm grid-cols-2 gap-1 rounded-2xl bg-slate-200/70 p-1">
          {MODES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              type="button"
              aria-selected={mode === id}
              onClick={() => switchMode(id)}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition ${
                mode === id ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </button>
          ))}
        </div>

        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
            <Loader2 className="size-10 animate-spin text-emerald-600" aria-hidden />
            <p className="font-medium text-slate-800">กำลังโหลดโมเดล AI…</p>
            <p className="text-sm text-slate-500">ครั้งแรกอาจใช้เวลาสักครู่ ขึ้นอยู่กับความเร็วอินเทอร์เน็ต</p>
          </div>
        )}

        {status === 'error' && (
          <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-red-200">
            <TriangleAlert className="size-10 text-red-500" aria-hidden />
            <p className="font-semibold text-slate-900">โหลดโมเดลไม่สำเร็จ</p>
            <p className="max-w-md text-sm text-slate-500">{error}</p>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="mt-2 inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-5 font-semibold text-white transition hover:bg-emerald-500"
            >
              <RefreshCw className="size-4" aria-hidden />
              ลองใหม่
            </button>
          </div>
        )}

        {status === 'ready' && model && tmImage && (
          <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 lg:gap-8">
            <div className="md:sticky md:top-6">
              {mode === 'webcam' ? (
                <WebcamPanel model={model} tmImage={tmImage} onPredictions={handlePredictions} />
              ) : (
                <UploadPanel model={model} onPredictions={handlePredictions} onClear={clearResult} />
              )}
            </div>
            <ResultPanel result={result} />
          </div>
        )}

        {/* Bin legend */}
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">ประเภทถังขยะ</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {LEGEND.map(({ category, icon: Icon }) => (
              <div key={category.id} className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${category.badgeClass}`}>
                  <Icon className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">
                    {category.labelTh} <span className="font-normal text-slate-500">({category.binColorTh})</span>
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{category.subClasses.join(', ')}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
