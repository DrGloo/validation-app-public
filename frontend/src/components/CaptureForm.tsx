import { useState } from 'react'
import { ScreenshotOptions } from '../services/api'

interface CaptureFormProps {
  onSubmit: (url: string, options?: ScreenshotOptions) => void
  isLoading: boolean
}

const VIEWPORT_PRESETS = {
  desktop: { width: 1920, height: 1080 },
  laptop: { width: 1366, height: 768 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
}

export default function CaptureForm({ onSubmit, isLoading }: CaptureFormProps) {
  const [url, setUrl] = useState('')
  const [fullPage, setFullPage] = useState(false)
  const [viewportPreset, setViewportPreset] = useState<keyof typeof VIEWPORT_PRESETS>('desktop')
  const [customWidth, setCustomWidth] = useState(1920)
  const [customHeight, setCustomHeight] = useState(1080)
  const [useCustomViewport, setUseCustomViewport] = useState(false)
  const [waitStrategy, setWaitStrategy] = useState<ScreenshotOptions['wait_strategy']>('networkidle')
  const [waitSelector, setWaitSelector] = useState('')
  const [delayMs, setDelayMs] = useState(0)
  const [timeoutMs, setTimeoutMs] = useState(30000)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedUrl = url.trim()
    if (!trimmedUrl) {
      // Browser validation should handle this, but just in case
      return
    }

    // Ensure URL has a protocol
    let finalUrl = trimmedUrl
    if (!finalUrl.match(/^https?:\/\//i)) {
      finalUrl = `https://${finalUrl}`
    }

    const preset = VIEWPORT_PRESETS[viewportPreset]
    const options: ScreenshotOptions = {
      full_page: fullPage,
      viewport_width: useCustomViewport ? customWidth : preset.width,
      viewport_height: useCustomViewport ? customHeight : preset.height,
      wait_strategy: waitStrategy,
      wait_selector: waitSelector || undefined,
      delay_ms: delayMs,
      timeout_ms: timeoutMs,
    }

    onSubmit(finalUrl, options)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 transition-colors">
      <div className="space-y-6">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            URL
          </label>
          <input
            type="text"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 sm:text-sm"
            placeholder="https://example.com/status or example.com"
            required
            pattern=".*"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="fullPage"
            checked={fullPage}
            onChange={(e) => setFullPage(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
          />
          <label htmlFor="fullPage" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
            Full page screenshot
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Viewport Size
          </label>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-4">
            {Object.keys(VIEWPORT_PRESETS).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setViewportPreset(preset as keyof typeof VIEWPORT_PRESETS)
                  setUseCustomViewport(false)
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  !useCustomViewport && viewportPreset === preset
                    ? 'bg-blue-600 dark:bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {preset.charAt(0).toUpperCase() + preset.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="customViewport"
              checked={useCustomViewport}
              onChange={(e) => setUseCustomViewport(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
            />
            <label htmlFor="customViewport" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
              Custom viewport
            </label>
          </div>
          {useCustomViewport && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="width" className="block text-xs text-gray-600 dark:text-gray-400">
                  Width
                </label>
                <input
                  type="number"
                  id="width"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(parseInt(e.target.value) || 1920)}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 sm:text-sm"
                  min="1"
                  max="7680"
                />
              </div>
              <div>
                <label htmlFor="height" className="block text-xs text-gray-600 dark:text-gray-400">
                  Height
                </label>
                <input
                  type="number"
                  id="height"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(parseInt(e.target.value) || 1080)}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 sm:text-sm"
                  min="1"
                  max="4320"
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="waitStrategy" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Wait Strategy
          </label>
          <select
            id="waitStrategy"
            value={waitStrategy}
            onChange={(e) => setWaitStrategy(e.target.value as ScreenshotOptions['wait_strategy'])}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 sm:text-sm"
          >
            <option value="networkidle">Network Idle</option>
            <option value="domcontentloaded">DOM Content Loaded</option>
            <option value="load">Load</option>
            <option value="commit">Commit</option>
            <option value="selector">Selector</option>
          </select>
        </div>

        {waitStrategy === 'selector' && (
          <div>
            <label htmlFor="waitSelector" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              CSS Selector
            </label>
            <input
              type="text"
              id="waitSelector"
              value={waitSelector}
              onChange={(e) => setWaitSelector(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 sm:text-sm"
              placeholder="#main-content"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="delayMs" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Delay (ms)
            </label>
            <input
              type="number"
              id="delayMs"
              value={delayMs}
              onChange={(e) => setDelayMs(parseInt(e.target.value) || 0)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 sm:text-sm"
              min="0"
              max="60000"
            />
          </div>
          <div>
            <label htmlFor="timeoutMs" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Timeout (ms)
            </label>
            <input
              type="number"
              id="timeoutMs"
              value={timeoutMs}
              onChange={(e) => setTimeoutMs(parseInt(e.target.value) || 30000)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 sm:text-sm"
              min="1000"
              max="300000"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Capturing...' : 'Capture Screenshot'}
          </button>
        </div>
      </div>
    </form>
  )
}

