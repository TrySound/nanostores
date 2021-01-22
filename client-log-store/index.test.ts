import { TestClient } from '@logux/client'

import { ClientLogStore } from '../index.js'

class TestStore extends ClientLogStore {
  storeLoading = Promise.resolve()
}

it('throws an error on missed client', () => {
  expect(() => {
    // @ts-expect-error
    TestStore.load('10')
  }).toThrow('Missed Logux client')
})

it('sets client', () => {
  let client = new TestClient('10')
  let store = TestStore.load('10', client)
  expect(store.loguxClient).toBe(client)
})
