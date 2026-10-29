import { useEffect, useState } from 'react'
import type { CustomMobileNet } from '@teachablemachine/image'
import { MODEL_URL } from '../lib/wasteMapping'

type TmImageModule = typeof import('@teachablemachine/image')

export interface TeachableModelState {
  model: CustomMobileNet | null
  tmImage: TmImageModule | null
  status: 'loading' | 'ready' | 'error'
  error: string | null
}

interface LoadedModel {
  model: CustomMobileNet
  tmImage: TmImageModule
}

// Cached at module scope so StrictMode double-mounts and mode switches reuse one model.
let modelPromise: Promise<LoadedModel> | null = null

function loadModel(): Promise<LoadedModel> {
  if (!modelPromise) {
    modelPromise = (async () => {
      // Lazy-load TF.js so the UI shell paints before the heavy ML bundle arrives.
      const tmImage = await import('@teachablemachine/image')
      const model = await tmImage.load(`${MODEL_URL}model.json`, `${MODEL_URL}metadata.json`)
      return { model, tmImage }
    })().catch((err: unknown) => {
      modelPromise = null // allow retry
      throw err
    })
  }
  return modelPromise
}

export function useTeachableModel(reloadKey = 0): TeachableModelState {
  const [state, setState] = useState<TeachableModelState>({
    model: null,
    tmImage: null,
    status: 'loading',
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    setState((s) => (s.status === 'loading' ? s : { ...s, status: 'loading', error: null }))
    loadModel()
      .then(({ model, tmImage }) => {
        if (!cancelled) setState({ model, tmImage, status: 'ready', error: null })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : String(err)
        setState({ model: null, tmImage: null, status: 'error', error: message })
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  return state
}
