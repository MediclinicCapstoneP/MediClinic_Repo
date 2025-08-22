import type { ApiResponse, ApiRequestConfig, ApiError } from '../../core/types'

/**
 * Base API Service following SOLID principles
 * - SRP: Handles only API communication logic
 * - DIP: Depends on abstractions (interfaces) not concrete implementations
 */
export abstract class BaseApiService {
  protected baseUrl: string
  protected defaultHeaders: Record<string, string>

  constructor(baseUrl: string = '', defaultHeaders: Record<string, string> = {}) {
    this.baseUrl = baseUrl
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders,
    }
  }

  /**
   * Generic request method that handles all HTTP operations
   */
  protected async request<T = any>(config: ApiRequestConfig): Promise<ApiResponse<T>> {
    try {
      const url = this.buildUrl(config.url)
      const headers = { ...this.defaultHeaders, ...config.headers }

      const requestConfig: RequestInit = {
        method: config.method,
        headers,
        signal: this.createAbortSignal(config.timeout),
      }

      // Add body for POST, PUT, PATCH requests
      if (config.data && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
        requestConfig.body = JSON.stringify(config.data)
      }

      // Add query parameters for GET requests
      if (config.params && config.method === 'GET') {
        const searchParams = new URLSearchParams(config.params)
        url.search = searchParams.toString()
      }

      const response = await fetch(url.toString(), requestConfig)

      return await this.handleResponse<T>(response)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * GET request
   */
  protected async get<T = any>(
    url: string,
    params?: Record<string, any>,
    headers?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'GET',
      url,
      params,
      headers,
    })
  }

  /**
   * POST request
   */
  protected async post<T = any>(
    url: string,
    data?: any,
    headers?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'POST',
      url,
      data,
      headers,
    })
  }

  /**
   * PUT request
   */
  protected async put<T = any>(
    url: string,
    data?: any,
    headers?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PUT',
      url,
      data,
      headers,
    })
  }

  /**
   * PATCH request
   */
  protected async patch<T = any>(
    url: string,
    data?: any,
    headers?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PATCH',
      url,
      data,
      headers,
    })
  }

  /**
   * DELETE request
   */
  protected async delete<T = any>(
    url: string,
    headers?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'DELETE',
      url,
      headers,
    })
  }

  /**
   * Build complete URL
   */
  private buildUrl(endpoint: string): URL {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`
    return new URL(url)
  }

  /**
   * Create abort signal for timeout
   */
  private createAbortSignal(timeout?: number): AbortSignal | undefined {
    if (!timeout) return undefined

    const controller = new AbortController()
    setTimeout(() => controller.abort(), timeout)
    return controller.signal
  }

  /**
   * Handle successful response
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const isJson = response.headers.get('content-type')?.includes('application/json')
    const data = isJson ? await response.json() : await response.text()

    if (!response.ok) {
      const error: ApiError = {
        code: response.status.toString(),
        message: data.message || response.statusText,
        statusCode: response.status,
        details: data,
      }

      return {
        success: false,
        error: error.message,
        data: null,
      }
    }

    return {
      success: true,
      data,
      error: undefined,
    }
  }

  /**
   * Handle request errors
   */
  private handleError(error: unknown): ApiResponse<null> {
    let message = 'An unexpected error occurred'
    let code = 'UNKNOWN_ERROR'

    if (error instanceof Error) {
      message = error.message
      code = error.name
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      message = 'Network error - please check your connection'
      code = 'NETWORK_ERROR'
    }

    return {
      success: false,
      error: message,
      data: null,
    }
  }

  /**
   * Set authorization header
   */
  protected setAuthHeader(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`
  }

  /**
   * Remove authorization header
   */
  protected removeAuthHeader(): void {
    delete this.defaultHeaders['Authorization']
  }
}
