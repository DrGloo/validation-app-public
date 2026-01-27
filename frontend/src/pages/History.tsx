import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiService } from '../services/api'
import ScreenshotCard from '../components/ScreenshotCard'

export default function History() {
  const [urlFilter, setUrlFilter] = useState('')
  const [successFilter, setSuccessFilter] = useState<boolean | undefined>(undefined)
  const [limit, setLimit] = useState(50)
  const [offset, setOffset] = useState(0)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['screenshots', 'history', urlFilter, successFilter, limit, offset],
    queryFn: () => apiService.getScreenshots({
      limit,
      offset,
      url: urlFilter || undefined,
      success: successFilter,
    }),
  })

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Screenshot History</h1>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          Browse and filter your screenshot capture history
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6 transition-colors">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="urlFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Filter by URL
            </label>
            <input
              type="text"
              id="urlFilter"
              value={urlFilter}
              onChange={(e) => {
                setUrlFilter(e.target.value)
                setOffset(0)
              }}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 sm:text-sm"
              placeholder="Search URL..."
            />
          </div>
          <div>
            <label htmlFor="successFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select
              id="successFilter"
              value={successFilter === undefined ? 'all' : successFilter ? 'success' : 'failed'}
              onChange={(e) => {
                const value = e.target.value
                setSuccessFilter(value === 'all' ? undefined : value === 'success')
                setOffset(0)
              }}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 sm:text-sm"
            >
              <option value="all">All</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div>
            <label htmlFor="limit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Results per page
            </label>
            <select
              id="limit"
              value={limit}
              onChange={(e) => {
                setLimit(parseInt(e.target.value))
                setOffset(0)
              }}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 sm:text-sm"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading screenshots...</div>
      ) : data && data.screenshots.length > 0 ? (
        <>
          <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Showing {data.screenshots.length} of {data.total} screenshots
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.screenshots.map((screenshot) => (
              <ScreenshotCard key={screenshot.id} screenshot={screenshot} />
            ))}
          </div>
          <div className="mt-6 flex justify-between items-center">
            <button
              onClick={() => {
                setOffset(Math.max(0, offset - limit))
              }}
              disabled={offset === 0}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {Math.floor(offset / limit) + 1}
            </span>
            <button
              onClick={() => {
                setOffset(offset + limit)
              }}
              disabled={!data || offset + limit >= data.total}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No screenshots found.</p>
        </div>
      )}
    </div>
  )
}

