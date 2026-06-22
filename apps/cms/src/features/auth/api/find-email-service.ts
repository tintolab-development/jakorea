import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

export type FindEmailLookupResult =
  | { kind: 'found'; maskedEmail: string }
  | { kind: 'not_found' }

export interface FindEmailLookupInput {
  name: string
  identityVerificationSessionUuid: string
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    window.setTimeout(resolve, ms)
  })
}

async function lookupFindEmailMock(input: FindEmailLookupInput): Promise<FindEmailLookupResult> {
  await delay(300)

  if (input.name.includes('없음')) {
    return { kind: 'not_found' }
  }

  return { kind: 'found', maskedEmail: 'Ja****@gmail.com' }
}

async function lookupFindEmailRemote(_input: FindEmailLookupInput): Promise<FindEmailLookupResult> {
  // TODO(backend): POST /api/admin/auth/find-email 스펙 확정 후 연동
  throw new Error('이메일 찾기 API가 아직 연동되지 않았습니다.')
}

export async function lookupFindEmail(input: FindEmailLookupInput): Promise<FindEmailLookupResult> {
  if (isRealApiModuleEnabled('findEmail')) {
    return lookupFindEmailRemote(input)
  }

  return lookupFindEmailMock(input)
}
