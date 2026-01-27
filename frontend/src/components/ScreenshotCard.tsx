import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ScreenshotResponse } from '../services/api'

interface ScreenshotCardProps {
  screenshot: ScreenshotResponse
}

export default function ScreenshotCard({ screenshot }: ScreenshotCardProps) {
  const imageUrl = screenshot.base64_data
    ? `data:image/png;base64,${screenshot.base64_data}`
    : null

  return (
    <Link
      to={`/screenshot/${screenshot.id}`}
      className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all overflow-hidden"
    >
      {imageUrl ? (
        <div className="aspect-video bg-gray-100 dark:bg-gray-900 overflow-hidden">
          <img
            src={imageUrl}
            alt={screenshot.url}
            className="w-full h-full object-contain"
          />
        </div>
      ) : (
        <div className="aspect-video bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
          <span className="text-gray-400 dark:text-gray-500 text-sm">No preview</span>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
              screenshot.success
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
            }`}
          >
            {screenshot.success ? 'Success' : 'Failed'}
          </span>
          {screenshot.http_status_code && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {screenshot.http_status_code}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-900 dark:text-white truncate mb-1" title={screenshot.url}>
          {screenshot.url}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {format(new Date(screenshot.timestamp), 'MMM d, yyyy HH:mm')}
        </p>
        {screenshot.page_load_time_ms && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {screenshot.page_load_time_ms.toFixed(0)}ms
          </p>
        )}
      </div>
    </Link>
  )
}

