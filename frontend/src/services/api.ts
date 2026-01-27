import axios from 'axios'

// Use proxy in development, direct URL in production
const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.DEV 
    ? '/api/v1'  // Use Vite proxy in development
    : 'http://localhost:8000/api/v1'  // Direct connection in production
)

export interface ScreenshotOptions {
  full_page?: boolean
  viewport_width?: number
  viewport_height?: number
  wait_strategy?: 'networkidle' | 'domcontentloaded' | 'load' | 'commit' | 'selector'
  wait_selector?: string
  delay_ms?: number
  timeout_ms?: number
  auth_headers?: Record<string, string>
  basic_auth?: {
    username: string
    password: string
  }
}

export interface ScreenshotResponse {
  id: number
  url: string
  timestamp: string
  viewport_width: number
  viewport_height: number
  file_path?: string
  base64_data?: string
  http_status_code?: number
  page_load_time_ms?: number
  full_page: boolean
  wait_strategy?: string
  error_message?: string
  success: boolean
}

export interface BatchScreenshotRequest {
  urls: string[]
  options?: ScreenshotOptions
}

export interface BatchScreenshotResponse {
  results: ScreenshotResponse[]
  total: number
  successful: number
  failed: number
}

export interface ScreenshotListResponse {
  screenshots: ScreenshotResponse[]
  total: number
  limit: number
  offset: number
}

export interface StatisticsResponse {
  total: number
  successful: number
  failed: number
  success_rate: number
}

class ApiService {
  private client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 60000, // 60 second timeout
  })

  // Add request interceptor for better error handling
  constructor() {
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
          error.message = `Cannot connect to backend API at ${API_BASE_URL}. Make sure the backend server is running on port 8000.`
        }
        return Promise.reject(error)
      }
    )
  }

  async captureScreenshot(url: string, options?: ScreenshotOptions): Promise<ScreenshotResponse> {
    const response = await this.client.post<ScreenshotResponse>('/screenshot', {
      url,
      options,
    })
    return response.data
  }

  async captureBatchScreenshots(request: BatchScreenshotRequest): Promise<BatchScreenshotResponse> {
    const response = await this.client.post<BatchScreenshotResponse>('/screenshot/batch', request)
    return response.data
  }

  async getScreenshots(params?: {
    limit?: number
    offset?: number
    url?: string
    success?: boolean
    start_date?: string
    end_date?: string
  }): Promise<ScreenshotListResponse> {
    const response = await this.client.get<ScreenshotListResponse>('/screenshots', { params })
    return response.data
  }

  async getScreenshot(id: number): Promise<ScreenshotResponse> {
    const response = await this.client.get<ScreenshotResponse>(`/screenshots/${id}`)
    return response.data
  }

  async getScreenshotsByUrl(url: string, limit?: number): Promise<ScreenshotListResponse> {
    const response = await this.client.get<ScreenshotListResponse>(`/screenshots/url/${encodeURIComponent(url)}`, {
      params: { limit },
    })
    return response.data
  }

  async getStatistics(): Promise<StatisticsResponse> {
    const response = await this.client.get<StatisticsResponse>('/statistics')
    return response.data
  }

  async deleteScreenshot(id: number): Promise<void> {
    await this.client.delete(`/screenshots/${id}`)
  }
}

export const apiService = new ApiService()

