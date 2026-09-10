import { afterEach, describe, expect, it, vi } from 'vitest'
import { availableEntries, centeredEntries, loadSaved, parseEntries, randomIndex } from './logic'

afterEach(() => vi.unstubAllGlobals())
describe('saved data recovery', () => {
  it('recovers when browser storage is blocked or corrupt', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('blocked') } })
    expect(loadSaved().raw).toBe('')
    vi.stubGlobal('localStorage', { getItem: () => '{bad json' })
    expect(loadSaved().settings.duration).toBe(5)
  })
  it('validates saved settings and history before using them', () => {
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify({ raw: 12, settings: { duration: -1, sound: 'yes' }, used: ['A', null, 2] }) })
    expect(loadSaved()).toEqual({ raw: '', settings: { duration: 5, sound: false, noRepeat: false }, used: ['A'] })
  })
})

describe('user input', () => {
  it('trims CRLF input and detects Vietnamese duplicates without losing the original label', () => {
    const result = parseEntries('  Đọc sách \r\n\r\nTập thể dục\nđọc sách\n' + 'Đọc sách'.normalize('NFD'))
    expect(result.items).toEqual(['Đọc sách', 'Tập thể dục'])
    expect(result.duplicates).toHaveLength(2)
  })
  it('handles empty and oversized lists', () => {
    expect(parseEntries(' \n ').items).toEqual([])
    expect(parseEntries(Array.from({ length: 101 }, (_, i) => String(i)).join('\n')).error).not.toBe('')
    expect(parseEntries('a'.repeat(121)).error).not.toBe('')
  })
})
describe('fair selection and reel alignment', () => {
  it('rejects biased tail values before mapping into a pool', () => {
    const draws = [0xffffffff, 8]
    expect(randomIndex(3, () => draws.shift()!)).toBe(2)
    expect(draws).toHaveLength(0)
  })
  it('covers every outcome equally in a complete accepted range', () => {
    const counts = [0, 0, 0]
    for (let i = 0; i < 300; i++) counts[randomIndex(3, () => i)]++
    expect(counts).toEqual([100, 100, 100])
    expect(() => randomIndex(0)).toThrow()
    expect(randomIndex(1, () => 12)).toBe(0)
  })
  it('removes used outcomes and handles an exhausted pool', () => {
    expect(availableEntries(['A', 'B'], ['A'], true)).toEqual(['B'])
    expect(availableEntries(['A'], ['A'], true)).toEqual([])
    expect(availableEntries(['A', 'B'], ['A'], false)).toEqual(['A', 'B'])
  })
  it('keeps the chosen entry centered for short and long lists', () => {
    for (const pool of [['A'], ['A', 'B'], ['A', 'B', 'C', 'D', 'E', 'F']]) {
      for (const winner of pool) {
        const rows = centeredEntries(pool, winner)
        expect(rows).toHaveLength(5)
        expect(rows[2]).toBe(winner)
        expect(rows.every(row => pool.includes(row))).toBe(true)
      }
    }
  })
})
