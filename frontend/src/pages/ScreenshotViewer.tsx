import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiService } from '../services/api'
import { format } from 'date-fns'
import { useState } from 'react'
import toast from 'react-hot-toast'
import ReactCompareImage from 'react-compare-image'

export default function ScreenshotViewer() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showComparison, setShowComparison] = useState(false)

  const { data: screenshot, isLoading } = useQuery({
    queryKey: ['screenshot', id],
    queryFn: () => apiService.getScreenshot(parseInt(id!)),
    enabled: !!id,
  })

  const { data: previousScreenshots } = useQuery({
    queryKey: ['screenshots', 'url', screenshot?.url],
    queryFn: () => apiService.getScreenshotsByUrl(screenshot!.url, 5),
    enabled: !!screenshot?.url,
  })

  const previousScreenshot = previousScreenshots?.screenshots.find(
    (s) => s.id !== screenshot?.id && s.success
  )

  const handleDelete = async () => {
    if (!screenshot || !confirm('Are you sure you want to delete this screenshot?')) return

    try {
      await apiService.deleteScreenshot(screenshot.id)
      toast.success('Screenshot deleted')
      queryClient.invalidateQueries({ queryKey: ['screenshots'] })
      queryClient.invalidateQueries({ queryKey: ['statistics'] })
      navigate('/history')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete screenshot')
    }
  }

  const handleDownload = () => {
    if (!screenshot?.base64_data) return

    const link = document.createElement('a')
    link.href = `data:image/png;base64,${screenshot.base64_data}`
    link.download = `screenshot-${screenshot.id}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading screenshot...</div>
      </div>
    )
  }

  if (!screenshot) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Screenshot not found</p>
          <button
            onClick={() => navigate('/history')}
            className="mt-4 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            Back to History
          </button>
        </div>
      </div>
    )
  }

  const imageUrl = screenshot.base64_data
    ? `data:image/png;base64,${screenshot.base64_data}`
    : null

  const previousImageUrl = previousScreenshot?.base64_data
    ? `data:image/png;base64,${previousScreenshot.base64_data}`
    : null

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4 transition-colors"
        >
          ← Back
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Screenshot Details</h1>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 break-all">{screenshot.url}</p>
          </div>
          <div className="flex space-x-2">
            {imageUrl && (
              <button
                onClick={handleDownload}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Download
              </button>
            )}
            {previousImageUrl && (
              <button
                onClick={() => setShowComparison(!showComparison)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {showComparison ? 'Hide' : 'Compare'}
              </button>
            )}
            <button
              onClick={handleDelete}
              className="px-4 py-2 border border-red-300 dark:border-red-700 rounded-md text-sm font-medium text-red-700 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6 transition-colors">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
            <dd className="mt-1">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                  screenshot.success
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                }`}
              >
                {screenshot.success ? 'Success' : 'Failed'}
              </span>
            </dd>
          </div>
          {screenshot.http_status_code && (
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">HTTP Status</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">{screenshot.http_status_code}</dd>
            </div>
          )}
          {screenshot.page_load_time_ms && (
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Load Time</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {screenshot.page_load_time_ms.toFixed(0)}ms
              </dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Viewport</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {screenshot.viewport_width} × {screenshot.viewport_height}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Timestamp</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {format(new Date(screenshot.timestamp), 'PPpp')}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Page</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">{screenshot.full_page ? 'Yes' : 'No'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Wait Strategy</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">{screenshot.wait_strategy || 'N/A'}</dd>
          </div>
        </div>
        {screenshot.error_message && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <dt className="text-sm font-medium text-red-800 dark:text-red-400">Error</dt>
            <dd className="mt-1 text-sm text-red-700 dark:text-red-300">{screenshot.error_message}</dd>
          </div>
        )}
      </div>

      {showComparison && previousImageUrl && imageUrl ? (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6 transition-colors">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Comparison</h2>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <ReactCompareImage
              leftImage={previousImageUrl}
              rightImage={imageUrl}
              leftImageLabel="Previous"
              rightImageLabel="Current"
            />
          </div>
        </div>
      ) : imageUrl ? (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 transition-colors">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Screenshot</h2>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900">
            <img
              src={imageUrl}
              alt={screenshot.url}
              className="w-full h-auto max-h-[80vh] object-contain mx-auto"
            />
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 transition-colors">
          <p className="text-gray-500 dark:text-gray-400">No screenshot image available</p>
        </div>
      )}
    </div>
  )
}

