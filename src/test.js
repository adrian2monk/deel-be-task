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
