import type {
  OrganizationChartInfo,
  OrganizationChartSaveInput,
} from '@/entities/organization-chart/model/types'
import { shouldUseOrganizationChartRemoteApi } from './capabilities'
import {
  readOrganizationChart,
  saveOrganizationChart as saveOrganizationChartLocal,
} from './store'

export async function getOrganizationChartService(): Promise<OrganizationChartInfo> {
  if (shouldUseOrganizationChartRemoteApi()) {
    throw new Error('Organization chart remote API is not implemented yet')
  }
  return readOrganizationChart()
}

export async function saveOrganizationChartService(
  input: OrganizationChartSaveInput
): Promise<OrganizationChartInfo> {
  if (shouldUseOrganizationChartRemoteApi()) {
    throw new Error('Organization chart remote API is not implemented yet')
  }
  return saveOrganizationChartLocal(input)
}
