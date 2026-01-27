import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { apiService } from '../services/api'
import ScreenshotCard from '../components/ScreenshotCard'
import StatisticsCard from '../components/StatisticsCard'
import { format } from 'date-fns'

export default function Dashboard() {
  const { data: statistics, isLoading: statsLoading } = useQuery({
    queryKey: ['statistics'],
    queryFn: () => apiService.getStatistics(),
  })

  const { data: screenshots, isLoading: screenshotsLoading } = useQuery({
    queryKey: ['screenshots', 'recent'],
    queryFn: () => apiService.getScreenshots({ limit: 12 }),
  })

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Overview of screenshot captures and validation status
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            to="/capture"
            className="block rounded-md bg-blue-600 dark:bg-blue-500 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 dark:hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:focus-visible:outline-blue-500 transition-colors"
          >
            New Capture
          </Link>
        </div>
      </div>

      {statsLoading ? (
        <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading statistics...</div>
      ) : statistics ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-8">
          <StatisticsCard
            title="Total Captures"
            value={statistics.total}
            color="blue"
          />
          <StatisticsCard
            title="Successful"
            value={statistics.successful}
            color="green"
          />
          <StatisticsCard
            title="Failed"
            value={statistics.failed}
            color="red"
          />
          <StatisticsCard
            title="Success Rate"
            value={`${statistics.success_rate.toFixed(1)}%`}
            color="purple"
          />
        </div>
      ) : null}

      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recent Screenshots</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Latest screenshot captures</p>
      </div>

      {screenshotsLoading ? (
        <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading screenshots...</div>
      ) : screenshots && screenshots.screenshots.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {screenshots.screenshots.map((screenshot) => (
            <ScreenshotCard key={screenshot.id} screenshot={screenshot} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No screenshots yet. Start capturing!</p>
          <Link
            to="/capture"
            className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            Capture your first screenshot →
          </Link>
        </div>
      )}
    </div>
  )
}

