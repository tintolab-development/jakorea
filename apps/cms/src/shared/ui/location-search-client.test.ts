import { afterEach, describe, expect, it, vi } from 'vitest'

import { searchJusoAddresses } from '@jakorea/location/juso'
import { searchNeisSchools } from '@jakorea/location/neis'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('location search client contracts', () => {
  it('does not call the address API for a blank keyword', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(searchJusoAddresses({ confmKey: 'test-key', keyword: '  ' })).resolves.toEqual({
      addresses: [],
      totalCount: 0,
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not call the NEIS API for a blank keyword', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(searchNeisSchools({ apiKey: 'test-key', keyword: '  ' })).resolves.toEqual({
      schools: [],
      totalCount: 0,
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('trims address keywords and forwards cancellation to fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: {
          common: { errorCode: '0', totalCount: '1' },
          juso: [
            {
              roadAddr: '서울특별시 중구 세종대로 1',
              jibunAddr: '서울특별시 중구 태평로1가 1',
              zipNo: '04524',
            },
          ],
        },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const controller = new AbortController()

    await searchJusoAddresses({
      confmKey: 'test-key',
      keyword: ' 서울 ',
      apiUrl: 'https://address.test/search',
      signal: controller.signal,
    })

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('keyword=%EC%84%9C%EC%9A%B8'),
      { signal: controller.signal }
    )
  })

  it('forwards cancellation to each NEIS request', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        schoolInfo: [
          {
            head: [{ list_total_count: 1, RESULT: { CODE: 'INFO-000' } }],
            row: [{ SD_SCHUL_CODE: 'S1', SCHUL_NM: 'JA초등학교' }],
          },
        ],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const controller = new AbortController()

    await searchNeisSchools({
      apiKey: 'test-key',
      keyword: 'JA',
      signal: controller.signal,
    })

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('SCHUL_NM=JA'), {
      signal: controller.signal,
    })
  })

  it('surfaces upstream API failures to the caller', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ message: '서비스 점검 중입니다.' }),
      })
    )

    await expect(
      searchJusoAddresses({
        confmKey: 'test-key',
        keyword: '서울',
        apiUrl: 'https://address.test/search',
      })
    ).rejects.toThrow('서비스 점검 중입니다.')
  })
})
