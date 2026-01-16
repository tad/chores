import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('merges class names', () => {
    const result = cn('foo', 'bar')
    expect(result).toBe('foo bar')
  })

  it('handles conditional classes (false)', () => {
    const result = cn('foo', false && 'bar')
    expect(result).toBe('foo')
  })

  it('handles conditional classes (true)', () => {
    const result = cn('foo', true && 'bar')
    expect(result).toBe('foo bar')
  })

  it('handles undefined values', () => {
    const result = cn('foo', undefined, 'bar')
    expect(result).toBe('foo bar')
  })

  it('handles null values', () => {
    const result = cn('foo', null, 'bar')
    expect(result).toBe('foo bar')
  })

  it('handles arrays of classes', () => {
    const result = cn(['foo', 'bar'])
    expect(result).toBe('foo bar')
  })

  it('handles object syntax', () => {
    const result = cn({ foo: true, bar: false, baz: true })
    expect(result).toBe('foo baz')
  })

  it('merges Tailwind classes correctly (later wins)', () => {
    const result = cn('p-2', 'p-4')
    expect(result).toBe('p-4')
  })

  it('merges Tailwind color classes', () => {
    const result = cn('bg-red-500', 'bg-blue-500')
    expect(result).toBe('bg-blue-500')
  })

  it('handles empty inputs', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('handles complex combination', () => {
    const isActive = true
    const result = cn(
      'base-class',
      isActive && 'active',
      { 'conditional-class': true },
      ['array-class']
    )
    expect(result).toContain('base-class')
    expect(result).toContain('active')
    expect(result).toContain('conditional-class')
    expect(result).toContain('array-class')
  })
})
