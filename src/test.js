const app = require('./app')
const request = require('supertest')

test('get /contracts/:id wrong user', async () => {
  const res = await request(app).get(`/contracts/${1}`).set('profile_id', 2)
  expect(res.statusCode).toBe(403)
})

test('get /contracts/:id owner user', async () => {
  const res = await request(app).get(`/contracts/${1}`).set('profile_id', 5)
  expect(res.statusCode).toBe(200)
})

test('get /contracts by contractor user', async () => {
  const res = await request(app).get('/contracts').set('profile_id', 6)
  expect(res.statusCode).toBe(200)
  expect(res.body.map(({ id }) => id)).toEqual(expect.arrayContaining([2, 3, 8]))
})

test('get /contracts by contractor user with terminated contracts', async () => {
  const res = await request(app).get('/contracts').set('profile_id', 5)
  expect(res.statusCode).toBe(200)
  expect(res.body.length).toBe(0)
})

test('get /contracts by client user', async () => {
  const res = await request(app).get('/contracts').set('profile_id', 2)
  expect(res.statusCode).toBe(200)
  expect(res.body.map(({ id }) => id)).toEqual(expect.arrayContaining([3, 4]))
})

test('get /contracts by wrong user', async () => {
  const res = await request(app).get('/contracts').set('profile_id', 9)
  expect(res.statusCode).toBe(401)
})
