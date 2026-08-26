/**
 * Orval custom mutator — 공통 axiosClient(인터셉터·refresh·Bearer) 재사용
 * Orval v8 axios client: (axiosConfig, options?) 시그니처
 */
import type { AxiosRequestConfig } from 'axios'
import { axiosClient, type RetryableRequest } from '@/shared/instance/axios-instance'

export const customInstance = async <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig & Pick<RetryableRequest, 'skipGlobalErrorAlert' | 'skipRefresh' | 'skipAuth'>
): Promise<T> => {
  const { data } = await axiosClient.request<T>({
    ...config,
    ...options,
  })
  return data
}

export default customInstance
