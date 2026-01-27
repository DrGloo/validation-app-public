import { useState } from 'react'
import { ScreenshotOptions } from '../services/api'
import CaptureOptions from './CaptureOptions'

interface BatchCaptureFormProps {
  onSubmit: (urls: string[], options?: ScreenshotOptions) => void
  isLoading: boolean
}

export default function BatchCaptureForm({ onSubmit, isLoading }: BatchCaptureFormProps) {
  const [urls, setUrls] = useState('')
  const [options, setOptions] = useState<ScreenshotOptions>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const urlList = urls
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url.length > 0)
      .map((url) => {
        // Ensure URL has a protocol
        if (!url.match(/^https?:\/\//i)) {
          return `https://${url}`
        }
        return url
      })
    
    if (urlList.length === 0) return
    onSubmit(urlList, options)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 transition-colors">
      <div className="space-y-6">
        <div>
          <label htmlFor="urls" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            URLs (one per line)
          </label>
          <textarea
            id="urls"
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            rows={10}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 sm:text-sm font-mono"
            placeholder="https://example.com/status&#10;https://example.com/health&#10;https://example.com/api/status"
            required
          />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Enter one URL per line. Maximum 100 URLs per batch.
          </p>
        </div>

        <CaptureOptions options={options} onChange={setOptions} />

        <div>
          <button
            type="submit"
            disabled={isLoading || !urls.trim()}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Capturing...' : `Capture ${urls.split('\n').filter(u => u.trim()).length} Screenshots`}
          </button>
        </div>
      </div>
    </form>
  )
}

