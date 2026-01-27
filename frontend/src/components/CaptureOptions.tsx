import { useState } from 'react'
import { ScreenshotOptions } from '../services/api'

interface CaptureOptionsProps {
  options: ScreenshotOptions
  onChange: (options: ScreenshotOptions) => void
}

const VIEWPORT_PRESETS = {
  desktop: { width: 1920, height: 1080 },
  laptop: { width: 1366, height: 768 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
}

export default function CaptureOptions({ options, onChange }: CaptureOptionsProps) {
  const [viewportPreset, setViewportPreset] = useState<keyof typeof VIEWPORT_PRESETS>('desktop')
  const [useCustomViewport, setUseCustomViewport] = useState(false)

  const updateOptions = (updates: Partial<ScreenshotOptions>) => {
    onChange({ ...options, ...updates })
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Capture Options</h3>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="fullPage"
          checked={options.full_page || false}
          onChange={(e) => updateOptions({ full_page: e.target.checked })}
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
          {Object.keys(VIEWPORT_PRESETS).map((preset) => {
            const presetData = VIEWPORT_PRESETS[preset as keyof typeof VIEWPORT_PRESETS]
            const isSelected = !useCustomViewport && 
              options.viewport_width === presetData.width &&
              options.viewport_height === presetData.height

            return (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setViewportPreset(preset as keyof typeof VIEWPORT_PRESETS)
                  setUseCustomViewport(false)
                  updateOptions({
                    viewport_width: presetData.width,
                    viewport_height: presetData.height,
                  })
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  isSelected
                    ? 'bg-blue-600 dark:bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {preset.charAt(0).toUpperCase() + preset.slice(1)}
              </button>
            )
          })}
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
                value={options.viewport_width || 1920}
                onChange={(e) => updateOptions({ viewport_width: parseInt(e.target.value) || 1920 })}
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
                value={options.viewport_height || 1080}
                onChange={(e) => updateOptions({ viewport_height: parseInt(e.target.value) || 1080 })}
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
          value={options.wait_strategy || 'networkidle'}
          onChange={(e) => updateOptions({ wait_strategy: e.target.value as ScreenshotOptions['wait_strategy'] })}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 sm:text-sm"
        >
          <option value="networkidle">Network Idle</option>
          <option value="domcontentloaded">DOM Content Loaded</option>
          <option value="load">Load</option>
          <option value="commit">Commit</option>
          <option value="selector">Selector</option>
        </select>
      </div>

      {options.wait_strategy === 'selector' && (
        <div>
          <label htmlFor="waitSelector" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            CSS Selector
          </label>
          <input
            type="text"
            id="waitSelector"
            value={options.wait_selector || ''}
            onChange={(e) => updateOptions({ wait_selector: e.target.value || undefined })}
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
            value={options.delay_ms || 0}
            onChange={(e) => updateOptions({ delay_ms: parseInt(e.target.value) || 0 })}
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
            value={options.timeout_ms || 30000}
            onChange={(e) => updateOptions({ timeout_ms: parseInt(e.target.value) || 30000 })}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 sm:text-sm"
            min="1000"
            max="300000"
          />
        </div>
      </div>
    </div>
  )
}

