// import { cloneDeep } from 'lodash'
// import { deepMerge, mutableDeepMerge, mutableDeepMergeTwo } from 'utils'

describe('test', () => {
  test('1 + 1', () => {
    expect(1 + 1).toBe(2)
  })
})

// const complexObject = {
//   properties: {
//     name: 'John',
//     age: 42,
//     userProps: {
//       pwdHash: 'xkafdaioae8293afdsj9',
//       pwdHint: 'gibberish',
//       reminders: [
//         {
//           name: 'wake up',
//           omitMe: null,
//           omitMe2: [1, 2],
//         },
//         1,
//         'Do some stuff',
//         [
//           {
//             name: 'jwt',
//             value: 'xxxxxx',
//             omitMe: {},
//             omitMe2: 'please do',
//           },
//         ],
//       ],
//     },
//     omitMe: 'omitMe',
//     omitMe2: 2,
//   },
//   omitMe3: 'zzz',
//   omitMe: 'xxx',
// }

// describe('deepMerge variants', () => {
//   const argument1 = {
//     newAttr: true,
//     properties: {
//       age: 11,
//       potato: 3,
//       userProps: { pwdHint: { some: 'dict' }, reminders: 'bla' },
//     },
//   }

//   const argument1Copy = cloneDeep(argument1)

//   const expectedResult1 = {
//     newAttr: true,
//     omitMe: 'xxx',
//     omitMe3: 'zzz',
//     properties: {
//       age: 11,
//       name: 'John',
//       omitMe: 'omitMe',
//       omitMe2: 2,
//       potato: 3,
//       userProps: {
//         pwdHash: 'xkafdaioae8293afdsj9',
//         pwdHint: { some: 'dict' },
//         reminders: 'bla',
//       },
//     },
//   }

//   const argument2 = {
//     newAttr: false,
//     newAttr2: 3,
//     properties: {
//       age: 1,
//     },
//   }

//   const argument2Copy = cloneDeep(argument2)

//   const expectedResult2 = {
//     newAttr: false,
//     newAttr2: 3,
//     omitMe: 'xxx',
//     omitMe3: 'zzz',
//     properties: {
//       age: 1,
//       name: 'John',
//       omitMe: 'omitMe',
//       omitMe2: 2,
//       potato: 3,
//       userProps: {
//         pwdHash: 'xkafdaioae8293afdsj9',
//         pwdHint: { some: 'dict' },
//         reminders: 'bla',
//       },
//     },
//   }

//   describe('mutableDeepMergeTwo', () => {
//     const argument0 = cloneDeep(complexObject)
//     const resultObj = mutableDeepMergeTwo(argument0, argument1)

//     it('should mutate the first argument', () =>
//       expect(resultObj).toEqual(argument0))

//     it("shouldn't mutate the second argument", () =>
//       expect(argument1).toMatchObject(argument1Copy))

//     it('merges as expected', () =>
//       expect(resultObj).toMatchObject(expectedResult1))
//   })

//   describe('mutableDeepMerge', () => {
//     const argument0 = cloneDeep(complexObject)
//     const resultObj = mutableDeepMerge(argument0, argument1, argument2)

//     it('should mutate the first argument', () =>
//       expect(resultObj).toEqual(argument0))

//     it("shouldn't mutate the second argument", () =>
//       expect(argument1).toMatchObject(argument1Copy))

//     it('merges as expected', () =>
//       expect(resultObj).toMatchObject(expectedResult2))
//   })

//   describe('deepMerge', () => {
//     const argument0 = cloneDeep(complexObject)
//     const resultObj = deepMerge(argument0, argument1, argument2)

//     it("shouldn't mutate the first argument", () =>
//       expect(resultObj).not.toEqual(argument0))

//     it("shouldn't mutate the second or third argument", () => {
//       expect(argument1).toMatchObject(argument1Copy)
//       expect(argument2).toMatchObject(argument2Copy)
//     })

//     it('merges as expected', () =>
//       expect(resultObj).toMatchObject(expectedResult2))
//   })
// })
