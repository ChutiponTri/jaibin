import { useCallback, useEffect, useRef, useState } from 'react'
import type { CustomMobileNet, Webcam } from '@teachablemachine/image'
import {
  Camera,
  CameraOff,
  FlipHorizontal2,
  Loader2,
  RefreshCw,
  SwitchCamera,
  TriangleAlert,
} from 'lucide-react'
import type { FacingMode, RawPrediction } from '../types/garbage'
import { MODEL_INPUT_SIZE } from '../lib/image'

type TmImageModule = typeof import('@teachablemachine/image')

type CameraStatus = 'idle' | 'starting' | 'running' | 'error'

interface WebcamPanelProps {
  model: CustomMobileNet
  tmImage: TmImageModule
  onPredictions: (predictions: RawPrediction[]) => void
}

/** Minimum gap between predictions — keeps low-end phones responsive. */
const PREDICT_INTERVAL_MS = 150

function describeCameraError(err: unknown): string {
  if (!window.isSecureContext) {
    return 'กล้องใช้งานได้เฉพาะบน HTTPS หรือ localhost เท่านั้น'
  }
  const raw = err instanceof Error ? err.message : String(err)
  if (/denied|NotAllowed|permission/i.test(raw)) {
    return 'ไม่ได้รับอนุญาตให้ใช้กล้อง กรุณาอนุญาตการเข้าถึงกล้องในการตั้งค่าเบราว์เซอร์ แล้วลองใหม่อีกครั้ง'
  }
  if (/WebRTC|support/i.test(raw)) {
    return 'เบราว์เซอร์นี้ไม่รองรับการใช้งานกล้อง กรุณาลองใช้เบราว์เซอร์อื่น'
  }
  return `ไม่สามารถเปิดกล้องได้: ${raw}`
}

export default function WebcamPanel({ model, tmImage, onPredictions }: WebcamPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const webcamRef = useRef<Webcam | null>(null)
  const rafRef = useRef<number | null>(null)
  // Incremented on every start/stop so stale async work from a previous session bails out.
  const sessionRef = useRef(0)

  const [status, setStatus] = useState<CameraStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<FacingMode>('environment')
  const [mirrored, setMirrored] = useState(false)

  const stopCamera = useCallback(() => {
    sessionRef.current += 1
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    const webcam = webcamRef.current
    webcamRef.current = null
    if (webcam?.webcam) {
      if (webcam.webcam.srcObject) webcam.stop()
      webcam.webcam.remove()
    }
  }, [])

  const startCamera = useCallback(
    async (facing: FacingMode) => {
      stopCamera()
      const session = sessionRef.current
      setStatus('starting')
      setError(null)

      try {
        // flip=false: mirroring is a display concern handled with CSS, not model input.
        const webcam = new tmImage.Webcam(MODEL_INPUT_SIZE, MODEL_INPUT_SIZE, false)
        await webcam.setup({ facingMode: facing })
        if (session !== sessionRef.current) {
          webcam.stop()
          return
        }

        const video = webcam.webcam
        // Required for inline playback on iOS Safari.
        video.setAttribute('playsinline', '')
        video.playsInline = true
        video.muted = true
        video.className = 'absolute inset-0 h-full w-full object-cover'
        containerRef.current?.appendChild(video)
        await webcam.play()

        webcamRef.current = webcam
        setStatus('running')
        setMirrored(facing === 'user')

        let lastRun = 0
        let busy = false
        const loop = async (now: number) => {
          if (session !== sessionRef.current) return
          if (!busy && now - lastRun >= PREDICT_INTERVAL_MS) {
            busy = true
            lastRun = now
            try {
              webcam.update()
              const predictions = await model.predict(webcam.canvas)
              if (session === sessionRef.current) onPredictions(predictions)
            } finally {
              busy = false
            }
          }
          rafRef.current = requestAnimationFrame(loop)
        }
        rafRef.current = requestAnimationFrame(loop)
      } catch (err) {
        if (session !== sessionRef.current) return
        stopCamera()
        setStatus('error')
        setError(describeCameraError(err))
      }
    },
    [model, tmImage, onPredictions, stopCamera],
  )

  useEffect(() => stopCamera, [stopCamera])

  const handleStop = () => {
    stopCamera()
    setStatus('idle')
  }

  const handleSwap = () => {
    const next: FacingMode = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(next)
    if (status === 'running' || status === 'starting') void startCamera(next)
  }

  const isRunning = status === 'running'

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-900 shadow-inner ring-1 ring-slate-900/10">
        {/* The TM library creates the <video>; it lives here, outside React's children. */}
        <div
          ref={containerRef}
          className={`absolute inset-0 transition-transform duration-300 ${mirrored ? '-scale-x-100' : ''}`}
        />
        {status !== 'running' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 p-6 text-center text-slate-200">
            {status === 'starting' && (
              <>
                <Loader2 className="size-10 animate-spin" aria-hidden />
                <p className="text-sm">กำลังเปิดกล้อง…</p>
              </>
            )}
            {status === 'idle' && (
              <>
                <CameraOff className="size-10 opacity-70" aria-hidden />
                <p className="text-sm opacity-80">กดปุ่ม “เปิดกล้อง” เพื่อเริ่มตรวจจับแบบเรียลไทม์</p>
              </>
            )}
            {status === 'error' && (
              <>
                <TriangleAlert className="size-10 text-amber-400" aria-hidden />
                <p className="max-w-xs text-sm" role="alert">
                  {error}
                </p>
              </>
            )}
          </div>
        )}
        {isRunning && (
          <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
            <span className="size-2 animate-pulse rounded-full bg-red-500" />
            LIVE
          </span>
        )}
      </div>

      {/* Fixed bottom action bar on mobile, inline below the feed from md up. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/90 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:static md:z-auto md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <div className="mx-auto flex max-w-md items-center gap-2 md:max-w-none">
          {isRunning || status === 'starting' ? (
            <button
              type="button"
              onClick={handleStop}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 font-semibold text-white transition hover:bg-slate-700 active:scale-[0.98]"
            >
              <CameraOff className="size-5" aria-hidden />
              ปิดกล้อง
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void startCamera(facingMode)}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 font-semibold text-white transition hover:bg-emerald-500 active:scale-[0.98]"
            >
              {status === 'error' ? (
                <RefreshCw className="size-5" aria-hidden />
              ) : (
                <Camera className="size-5" aria-hidden />
              )}
              {status === 'error' ? 'ลองอีกครั้ง' : 'เปิดกล้อง'}
            </button>
          )}
          <button
            type="button"
            onClick={handleSwap}
            title={facingMode === 'user' ? 'สลับเป็นกล้องหลัง' : 'สลับเป็นกล้องหน้า'}
            aria-label="สลับกล้อง"
            className="inline-flex size-12 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 active:scale-95"
          >
            <SwitchCamera className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setMirrored((m) => !m)}
            aria-pressed={mirrored}
            aria-label="กลับด้านภาพ"
            title="กลับด้านภาพ"
            className={`inline-flex size-12 items-center justify-center rounded-xl border transition active:scale-95 ${
              mirrored
                ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <FlipHorizontal2 className="size-5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}
