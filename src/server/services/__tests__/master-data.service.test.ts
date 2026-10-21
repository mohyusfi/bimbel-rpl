import { describe, it, expect, vi } from 'vitest'
import { clampCapacity, masterDataService } from '../master-data.service'

describe('MasterDataService — Clamping & Mapping Guardrails', () => {
  it('clamping kapasitas menjepit input > 12 menjadi 12', () => {
    expect(clampCapacity(15)).toBe(12)
    expect(clampCapacity(100)).toBe(12)
    expect(clampCapacity('25')).toBe(12)
  })

  it('clamping kapasitas menjepit input <= 0 menjadi 1', () => {
    expect(clampCapacity(0)).toBe(1)
    expect(clampCapacity(-5)).toBe(1)
    expect(clampCapacity('-10')).toBe(1)
  })

  it('clamping kapasitas mempertahankan nilai valid (1–12)', () => {
    expect(clampCapacity(10)).toBe(10)
    expect(clampCapacity(12)).toBe(12)
    expect(clampCapacity(1)).toBe(1)
    expect(clampCapacity('8')).toBe(8)
  })

  it('clamping kapasitas mengembalikan default 12 untuk NaN atau undefined', () => {
    expect(clampCapacity(undefined)).toBe(12)
    expect(clampCapacity(null)).toBe(1) // Number(null) is 0 -> clamped to 1
    expect(clampCapacity('invalid')).toBe(12)
  })
})
