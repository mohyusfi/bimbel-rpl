import { describe, it, expect, vi, beforeEach } from 'vitest'
import { notificationService, resetInboxDbClientCache } from '~/server/services/notification.service'

describe('Single Notification Click Bug Diagnosis (Phase 1 Feedback Loop)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetInboxDbClientCache()
  })

  it('RED TEST: markAsRead for a single notification must NOT execute mark-all query on user_id', async () => {
    const updateCalls: Array<{ updatePayload: any; filters: Record<string, any> }> = []

    const mockDb = {
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({
                data: [{ id: '3718bd9b-1fcf-4159-acdf-44b8000ee4b3' }],
                error: null,
              })),
            })),
          }
        }
        if (table === 'notifications') {
          return {
            update: vi.fn((payload: any) => {
              const currentCall: { updatePayload: any; filters: Record<string, any> } = {
                updatePayload: payload,
                filters: {},
              }
              const chain: any = {
                in: vi.fn((column: string, values: any[]) => {
                  currentCall.filters[column] = values
                  return chain
                }),
                eq: vi.fn((column: string, value: any) => {
                  currentCall.filters[`eq_${column}`] = value
                  return chain
                }),
                filter: vi.fn((column: string, op: string, value: any) => {
                  currentCall.filters[`filter_${column}`] = value
                  return chain
                }),
                select: vi.fn(() => {
                  updateCalls.push(currentCall)
                  return Promise.resolve({ data: [{ id: 'notif-A' }], error: null })
                }),
              }
              return chain
            }),
          }
        }
        return {}
      }),
    }

    vi.doMock('~/server/services/billing.service', () => ({
      getIsolatedAdminClient: vi.fn().mockResolvedValue(mockDb),
    }))

    const NOTIF_A_ID = '943d2c13-0a7f-4e5d-b00d-a930e5bbbfdc'

    // Calling markAsRead for single notification:
    await notificationService.markAsRead({
      notificationIds: [NOTIF_A_ID],
      email: 'pimpinan@tadulakocendekia.sch.id',
    })

    // Assert that NO mass user_id update query was executed
    const massUserUpdates = updateCalls.filter((call) => call.filters.user_id !== undefined)
    expect(massUserUpdates).toHaveLength(0)

    // Assert that specific ID update WAS executed
    const specificUpdates = updateCalls.filter((call) => call.filters.id !== undefined)
    expect(specificUpdates).toHaveLength(1)
    expect(specificUpdates[0].filters.id).toContain(NOTIF_A_ID)
  })

  it('markAsRead with all: true executes mass update on user_id', async () => {
    const updateCalls: Array<{ updatePayload: any; filters: Record<string, any> }> = []

    const mockDb = {
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({
                data: [{ id: '3718bd9b-1fcf-4159-acdf-44b8000ee4b3' }],
                error: null,
              })),
            })),
          }
        }
        if (table === 'notifications') {
          return {
            update: vi.fn((payload: any) => {
              const currentCall: { updatePayload: any; filters: Record<string, any> } = {
                updatePayload: payload,
                filters: {},
              }
              const chain: any = {
                in: vi.fn((column: string, values: any[]) => {
                  currentCall.filters[column] = values
                  return chain
                }),
                eq: vi.fn((column: string, value: any) => {
                  currentCall.filters[`eq_${column}`] = value
                  return chain
                }),
                filter: vi.fn((column: string, op: string, value: any) => {
                  currentCall.filters[`filter_${column}`] = value
                  return chain
                }),
                select: vi.fn(() => {
                  updateCalls.push(currentCall)
                  return Promise.resolve({ data: [{ id: '1' }, { id: '2' }], error: null })
                }),
              }
              return chain
            }),
          }
        }
        return {}
      }),
    }

    vi.doMock('~/server/services/billing.service', () => ({
      getIsolatedAdminClient: vi.fn().mockResolvedValue(mockDb),
    }))

    // Calling markAsRead with all: true (e.g. from markAllAsRead)
    await notificationService.markAsRead({
      all: true,
      email: 'pimpinan@tadulakocendekia.sch.id',
    })

    const massUserUpdates = updateCalls.filter((call) => call.filters.user_id !== undefined)
    expect(massUserUpdates).toHaveLength(1)
  })
})
