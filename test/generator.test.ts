import lodash from 'lodash'
import * as g from '../src/generator'

const {
  lifo,
  fifo,
  pipe,
  sequence,
  delay,
  window,
  limit,
  pullArray,
  pullCount,
  filter,
  map
} = g

describe('generator', () => {
  test('filter', async () => {
    return expect(
      await pipe(
        sequence(0, 10),
        filter((x: number) => Promise.resolve(x > 5)),
        pullArray()
      )
    ).toEqual([6, 7, 8, 9, 10])
  })

  test('map', async () => {
    return expect(
      await pipe(
        sequence(0, 5),
        map((x: number) => Promise.resolve(x + 1)),
        pullArray()
      )
    ).toEqual([1, 2, 3, 4, 5, 6])
  })

  test('simple chain', async () => {
    return expect(
      await pipe(
        sequence(0, Infinity),
        delay(10),
        window(10),
        limit(2),
        pullArray()
      )
    ).toEqual([
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [10, 11, 12, 13, 14, 15, 16, 17, 18, 19]
    ])
  })

  test('count', async () => {
    return expect(
      await pipe(sequence(0, Infinity), limit(10), pullCount())
    ).toEqual(10)
  })

  test('catchLast', async () => {
    let clast = false
    async function cb(data: number) {
      if (data === 4) {
        clast = true
      }
    }

    expect(
      await pipe(
        sequence(0, Infinity),
        delay(10),
        limit(5),
        //@ts-ignore
        g.catchLast(cb),
        pullArray()
      )
    ).toEqual([0, 1, 2, 3, 4])

    expect(clast).toBeTruthy()
  })

  // parametric tests for different buffer types
  const buffers = {
    lifo: { make: lifo, output: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] },
    fifo: { make: fifo, output: [4, 3, 5, 2, 1, 6, 0, 7, 8, 9] }
  }

  lodash.forEach(buffers, (buf, name) => {
    test(name + '-basic', () =>
      new Promise(resolve => {
        const l = buf.make()

        let cnt = 0
        const interval = setInterval(() => l.in(cnt++), 100)

        setTimeout(function() {
          //@ts-ignore
          pipe(l.out(), delay(33), limit(10), pullArray()).then(
            (data: Array<number>) => {
              clearInterval(interval)
              expect(data).toEqual(buf.output)
              resolve(true)
            }
          )
        }, 555)
      })
    )

    // test(name + '-buffer', () =>
    //   new Promise(resolve => {
    //     let cnt = 0
    //     let interval: any

    //     const pipeline = pipe(
    //       buffer(buf.make())(bufferIn => setInterval(() => bufferIn(cnt++), 100)),
    //       delay(33),
    //       limit(10)
    //     )

    //     setTimeout(() => {
    //       //@ts-ignore
    //       pullArray()(pipeline).then((data: Array<number>) => {
    //         clearInterval(interval)
    //         expect(data).toEqual(buf.output)
    //         resolve(true)
    //       })
    //     }, 555)
    //   }))


  })
})
