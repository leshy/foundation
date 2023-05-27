import * as s from '../src/utils/set'

describe('set', () => {
  const set1: Set<number> = new Set([1, 2, 3, 4])
  const set2: Set<number> = new Set([3, 4, 5, 6])

  test('isSuperset', () => {
    expect(s.isSuperset(new Set([0, 1, 2, 3, 4, 5, 6, 7]), set1)).toBe(true)
    expect(s.isSuperset(set2, set1)).toBe(false)
  })

  test('intersection', () => {
    expect(s.intersection(set1, set2)).toEqual(new Set([3, 4]))
  })

  test('difference', () => {
    expect(s.difference(set1, set2)).toEqual(new Set([1, 2]))
  })

  test('symmetricDifference', () => {
    expect(s.symmetricDifference(set1, set2)).toEqual(new Set([1, 2, 5, 6]))
  })
})
