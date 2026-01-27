interface StatisticsCardProps {
  title: string
  value: string | number
  color: 'blue' | 'green' | 'red' | 'purple'
}

const colorClasses = {
  blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  green: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  red: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
}

export default function StatisticsCard({ title, value, color }: StatisticsCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg transition-colors">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`h-8 w-8 rounded-md ${colorClasses[color]} flex items-center justify-center transition-colors`}>
              <span className="text-sm font-bold">{value}</span>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</dt>
              <dd className="text-lg font-semibold text-gray-900 dark:text-white">{value}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}

