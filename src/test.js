const app = require('./app')
const request = require('supertest')

/** All this tests run with the initial seed if you're updated the database please reset all before run it */

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

test('get /jobs/unpaid by client user', async () => {
  const res = await request(app).get('/jobs/unpaid').set('profile_id', 2)
  expect(res.statusCode).toBe(200)
  expect(res.body.map(({ ContractId: id }) => id)).toEqual(expect.arrayContaining([3, 4]))
})

test('get /jobs/unpaid by contractor user', async () => {
  const res = await request(app).get('/jobs/unpaid').set('profile_id', 6)
  expect(res.statusCode).toBe(200)
  expect(res.body.map(({ ContractId: id }) => id)).toEqual(expect.arrayContaining([2, 3]))
})

test('get /admin/best-profession without required start date', async () => {
  const res = await request(app).get('/admin/best-profession').query({ end: '2020-01-01' })
  expect(res.statusCode).toBe(400)
  expect(res.body.error).toBe('Query param `start` required')
})

test('get /admin/best-profession with invalid start date', async () => {
  const res = await request(app).get('/admin/best-profession').query({ start: '4310-23-60' })
  expect(res.statusCode).toBe(400)
  expect(res.body.error).toBe("Invalid query param 'start=4310-23-60' date format. Try this one 2020-01-31")
})

test('get /admin/best-profession without required end date', async () => {
  const res = await request(app).get('/admin/best-profession').query({ start: '2020-01-01' })
  expect(res.statusCode).toBe(400)
  expect(res.body.error).toBe('Query param `end` required')
})

test('get /admin/best-profession with invalid end date', async () => {
  const res = await request(app).get('/admin/best-profession').query({ start: '2020-01-01', end: '4310-23-60' })
  expect(res.statusCode).toBe(400)
  expect(res.body.error).toBe("Invalid query param 'end=4310-23-60' date format. Try this one 2020-01-31")
})

test('get /admin/best-profession', async () => {
  const res = await request(app).get('/admin/best-profession').query({ start: '2020-01-01', end: '2022-12-31' })
  expect(res.statusCode).toBe(200)
  expect(res.text).toBe('Programmer')
})

test('get /admin/best-profession no content', async () => {
  const res = await request(app).get('/admin/best-profession').query({ start: '2020-01-01', end: '2020-12-31' })
  expect(res.statusCode).toBe(204)
})
