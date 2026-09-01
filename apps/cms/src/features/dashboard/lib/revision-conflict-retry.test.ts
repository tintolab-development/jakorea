import { describe, expect, it, vi } from 'vitest'
import { runWithRevisionConflictRetry } from './revision-conflict-retry'

describe('runWithRevisionConflictRetry', () => {
  it('성공하면 재시도하지 않는다', async () => {
    const save = vi.fn().mockResolvedValue({ ok: true })
    const reload = vi.fn()
    const result = await runWithRevisionConflictRetry(
      { revision: 1 },
      save,
      reload,
      () => undefined
    )
    expect(result).toEqual({ ok: true })
    expect(save).toHaveBeenCalledOnce()
    expect(reload).not.toHaveBeenCalled()
  })

  it('409이면 최신 revision으로 1회 재시도', async () => {
    const save = vi
      .fn()
      .mockRejectedValueOnce({ response: { status: 409 } })
      .mockResolvedValueOnce({ ok: true })
    const reload = vi.fn().mockResolvedValue(8)
    const result = await runWithRevisionConflictRetry(
      { revision: 1, layout: { orderedWidgetIds: ['a'] } },
      save,
      reload,
      error => (error as { response?: { status?: number } }).response?.status
    )
    expect(result).toEqual({ ok: true })
    expect(reload).toHaveBeenCalledOnce()
    expect(save).toHaveBeenNthCalledWith(2, {
      revision: 8,
      layout: { orderedWidgetIds: ['a'] },
    })
  })

  it('409가 아니면 그대로 throw', async () => {
    const save = vi.fn().mockRejectedValue({ response: { status: 500 } })
    await expect(
      runWithRevisionConflictRetry({ revision: 1 }, save, vi.fn(), error => {
        return (error as { response?: { status?: number } }).response?.status
      })
    ).rejects.toEqual({ response: { status: 500 } })
  })
})
