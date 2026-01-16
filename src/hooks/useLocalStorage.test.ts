import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from './useLocalStorage'

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('returns initial value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))

    expect(result.current[0]).toBe('initial')
  })

  it('returns stored value when localStorage has data', () => {
    localStorage.setItem('test-key', JSON.stringify('stored-value'))

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))

    expect(result.current[0]).toBe('stored-value')
  })

  it('updates localStorage when value changes', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))

    act(() => {
      result.current[1]('new-value')
    })

    expect(result.current[0]).toBe('new-value')
    expect(JSON.parse(localStorage.getItem('test-key')!)).toBe('new-value')
  })

  it('handles objects correctly', () => {
    const initialObj = { name: 'test', count: 0 }
    const { result } = renderHook(() => useLocalStorage('test-key', initialObj))

    act(() => {
      result.current[1]({ name: 'updated', count: 5 })
    })

    expect(result.current[0]).toEqual({ name: 'updated', count: 5 })
    expect(JSON.parse(localStorage.getItem('test-key')!)).toEqual({ name: 'updated', count: 5 })
  })

  it('handles arrays correctly', () => {
    const { result } = renderHook(() => useLocalStorage<string[]>('test-key', []))

    act(() => {
      result.current[1](['a', 'b', 'c'])
    })

    expect(result.current[0]).toEqual(['a', 'b', 'c'])
  })

  it('supports functional updates', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 0))

    act(() => {
      result.current[1](prev => prev + 1)
    })

    expect(result.current[0]).toBe(1)

    act(() => {
      result.current[1](prev => prev + 5)
    })

    expect(result.current[0]).toBe(6)
  })

  it('returns initial value when JSON parse fails', () => {
    // Set invalid JSON
    localStorage.setItem('test-key', 'not-valid-json')

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'))

    expect(result.current[0]).toBe('fallback')
    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('handles localStorage.setItem errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    // Mock localStorage.setItem to throw on the second call (after initial render)
    let callCount = 0
    const setItemSpy = vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
      callCount++
      if (callCount > 1) {
        throw new Error('QuotaExceededError')
      }
      // Actually store it for the first call
      Object.getPrototypeOf(localStorage).setItem.call(localStorage, key, value)
    })

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))

    // Should not throw when updating
    act(() => {
      result.current[1]('new-value')
    })

    // State should still update even if localStorage fails
    expect(result.current[0]).toBe('new-value')
    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
    setItemSpy.mockRestore()
  })

  it('persists values across component remounts', () => {
    const { result, unmount } = renderHook(() => useLocalStorage('test-key', 'initial'))

    act(() => {
      result.current[1]('persisted-value')
    })

    unmount()

    const { result: newResult } = renderHook(() => useLocalStorage('test-key', 'initial'))

    expect(newResult.current[0]).toBe('persisted-value')
  })

  it('handles boolean values', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', false))

    expect(result.current[0]).toBe(false)

    act(() => {
      result.current[1](true)
    })

    expect(result.current[0]).toBe(true)
  })

  it('handles null values', () => {
    const { result } = renderHook(() => useLocalStorage<string | null>('test-key', null))

    expect(result.current[0]).toBeNull()

    act(() => {
      result.current[1]('not-null')
    })

    expect(result.current[0]).toBe('not-null')

    act(() => {
      result.current[1](null)
    })

    expect(result.current[0]).toBeNull()
  })
})
