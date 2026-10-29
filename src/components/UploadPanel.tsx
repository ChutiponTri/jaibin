import { useEffect, useRef, useState, type DragEvent } from 'react'
import type { CustomMobileNet } from '@teachablemachine/image'
import { ImageUp, Loader2, RotateCcw, TriangleAlert } from 'lucide-react'
import type { RawPrediction } from '../types/garbage'
import { loadImage, toModelCanvas } from '../lib/image'

interface UploadPanelProps {
  model: CustomMobileNet
  onPredictions: (predictions: RawPrediction[]) => void
  onClear: () => void
}

const MAX_FILE_MB = 15

export default function UploadPanel({ model, onPredictions, onClear }: UploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Revoke object URLs when replaced or on unmount.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const analyzeFile = async (file: File) => {
    setError(null)
    if (!file.type.startsWith('image/')) {
      setError('กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, WEBP ฯลฯ)')
      return
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`ไฟล์มีขนาดใหญ่เกิน ${MAX_FILE_MB} MB`)
      return
    }

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setAnalyzing(true)
    try {
      const img = await loadImage(url)
      const predictions = await model.predict(toModelCanvas(img))
      onPredictions(predictions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'วิเคราะห์รูปภาพไม่สำเร็จ')
      onClear()
    } finally {
      setAnalyzing(false)
    }
  }

  const handleDrop = (e: DragEvent<HTMLElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) void analyzeFile(file)
  }

  const reset = () => {
    setPreviewUrl(null)
    setError(null)
    onClear()
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void analyzeFile(file)
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`group relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300 ${
          isDragging
            ? 'border-emerald-500 bg-emerald-50'
            : previewUrl
              ? 'border-transparent bg-slate-900'
              : 'border-slate-300 bg-white hover:border-emerald-400 hover:bg-emerald-50/50'
        }`}
        aria-label="อัปโหลดรูปภาพขยะ"
      >
        {previewUrl ? (
          <>
            <img src={previewUrl} alt="รูปที่อัปโหลด" className="absolute inset-0 h-full w-full object-cover" />
            {analyzing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 text-white backdrop-blur-sm">
                <Loader2 className="size-10 animate-spin" aria-hidden />
                <span className="text-sm">กำลังวิเคราะห์…</span>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 transition group-hover:scale-105">
              <ImageUp className="size-8" aria-hidden />
            </span>
            <p className="font-semibold text-slate-800">ลากรูปมาวาง หรือแตะเพื่อเลือกไฟล์</p>
            <p className="text-sm text-slate-500">รองรับ JPG, PNG, WEBP · สูงสุด {MAX_FILE_MB} MB</p>
          </div>
        )}
      </button>

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      {previewUrl && !analyzing && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 font-semibold text-white transition hover:bg-emerald-500 active:scale-[0.98]"
          >
            <ImageUp className="size-5" aria-hidden />
            เลือกรูปใหม่
          </button>
          <button
            type="button"
            onClick={reset}
            aria-label="ล้างรูปภาพ"
            className="inline-flex size-12 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 active:scale-95"
          >
            <RotateCcw className="size-5" aria-hidden />
          </button>
        </div>
      )}
    </div>
  )
}
