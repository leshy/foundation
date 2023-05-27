// efficient common set operations
//
// TS insights not helpful here so simply ignored a bunch of lines
// would be curious if someone knows how to type this tho

export function isSuperset(superSet: Set<any>, subset: Set<any>): boolean {
  for (let elem of subset) {
    if (!superSet.has(elem)) {
      return false
    }
  }
  return true
}

export function union<A, B>(setA: Set<A>, setB: Set<B>): Set<A | B> {
  let _union: Set<A | B> = new Set(setA)
  for (let elem of setB) {
    _union.add(elem)
  }
  return _union
}

export function intersection<A, B>(setA: Set<A>, setB: Set<B>): Set<A | B> {
  let _intersection = new Set()
  for (let elem of setB) {
    // @ts-ignore
    if (setA.has(elem)) {
      _intersection.add(elem)
    }
  }
  return _intersection as Set<A | B>
}

export function symmetricDifference<A, B>(
  setA: Set<A>,
  setB: Set<B>
): Set<A | B> {
  let _difference = new Set(setA)
  // @ts-ignore
  for (let elem of setB) {
    // @ts-ignore
    if (_difference.has(elem)) {
      // @ts-ignore
      _difference.delete(elem)
    } else {
      // @ts-ignore
      _difference.add(elem)
    }
  }
  return _difference
}

export function difference<A, B>(setA: Set<A>, setB: Set<B>): Set<A | B> {
  let _difference = new Set(setA)
  for (let elem of setB) {
    // @ts-ignore
    _difference.delete(elem)
  }
  return _difference
}
