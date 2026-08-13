/**
 * Orval custom mutator — 공통 axiosInstance 재사용
 * Orval v8 axios client: (axiosConfig, options?) 시그니처
 */
import type { AxiosRequestConfig } from 'axios'
import { axiosInstance } from '@/shared/instance/axios-instance'

export const customInstance = async <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  const { data } = await axiosInstance.request<T>({
    ...config,
    ...options,
  })
  return data
}

export default customInstance
