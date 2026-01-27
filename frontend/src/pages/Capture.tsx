import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { apiService, ScreenshotOptions } from '../services/api'
import CaptureForm from '../components/CaptureForm'
import BatchCaptureForm from '../components/BatchCaptureForm'

export default function Capture() {
  const [mode, setMode] = useState<'single' | 'batch'>('single')
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const singleMutation = useMutation({
    mutationFn: ({ url, options }: { url: string; options?: ScreenshotOptions }) =>
      apiService.captureScreenshot(url, options),
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Screenshot captured successfully!')
        queryClient.invalidateQueries({ queryKey: ['screenshots'] })
        queryClient.invalidateQueries({ queryKey: ['statistics'] })
        navigate(`/screenshot/${data.id}`)
      } else {
        toast.error(data.error_message || 'Failed to capture screenshot')
        // Still navigate to show the error details
        navigate(`/screenshot/${data.id}`)
      }
    },
    onError: (error: any) => {
      let errorMsg = 'Failed to capture screenshot'
      
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        errorMsg = 'Cannot connect to backend API. Make sure the backend server is running on http://localhost:8000'
      } else if (error.response?.data?.detail) {
        errorMsg = error.response.data.detail
      } else if (error.message) {
        errorMsg = error.message
      }
      
      toast.error(errorMsg)
      console.error('Screenshot capture error:', error)
    },
  })

  const batchMutation = useMutation({
    mutationFn: ({ urls, options }: { urls: string[]; options?: ScreenshotOptions }) =>
      apiService.captureBatchScreenshots({ urls, options }),
    onSuccess: (data) => {
      toast.success(`Captured ${data.successful}/${data.total} screenshots`)
      queryClient.invalidateQueries({ queryKey: ['screenshots'] })
      queryClient.invalidateQueries({ queryKey: ['statistics'] })
      navigate('/history')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to capture screenshots')
    },
  })

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Capture Screenshots</h1>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          Capture screenshots of single URLs or process multiple URLs in batch
        </p>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setMode('single')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                mode === 'single'
                  ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Single URL
            </button>
            <button
              onClick={() => setMode('batch')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                mode === 'batch'
                  ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Batch URLs
            </button>
          </nav>
        </div>
      </div>

      {mode === 'single' ? (
        <CaptureForm
          onSubmit={(url, options) => singleMutation.mutate({ url, options })}
          isLoading={singleMutation.isPending}
        />
      ) : (
        <BatchCaptureForm
          onSubmit={(urls, options) => batchMutation.mutate({ urls, options })}
          isLoading={batchMutation.isPending}
        />
      )}
    </div>
  )
}

