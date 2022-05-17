const app = require('./app')
const request = require('supertest')

/** All this tests run with the initial seed if you're updated the database please reset all before run it */

test('get /contracts/:id with wrong owner user', async () => {
  const res = await request(app).get(`/contracts/${1}`).set('profile_id', 2)
  expect(res.statusCode).toBe(403)
})

test('get /contracts/:id with contractor user', async () => {
  const res = await request(app).get(`/contracts/${1}`).set('profile_id', 5)
  expect(res.statusCode).toBe(200)
})

test('get /contracts/:id with client user', async () => {
  const res = await request(app).get(`/contracts/${1}`).set('profile_id', 1)
  expect(res.statusCode).toBe(200)
})

test('get /contracts by contractor user', async () => {
  const res = await request(app).get('/contracts').set('profile_id', 6)
  const expected = expect.objectContaining({
    id: expect.any(Number),
    terms: expect.any(String),
    status: expect.any(String),
    createdAt: expect.any(String),
    updatedAt: expect.any(String)
  })
  expect(res.statusCode).toBe(200)
  expect(res.body).toEqual(expect.arrayContaining([expected, expected, expected]))
})

test('get /contracts by contractor user with terminated contracts', async () => {
  const res = await request(app).get('/contracts').set('profile_id', 5)
  expect(res.statusCode).toBe(200)
  expect(res.body.length).toBe(0)
})

test('get /contracts by client user', async () => {
  const res = await request(app).get('/contracts').set('profile_id', 2)
  const expected = expect.objectContaining({
    id: expect.any(Number),
    terms: expect.any(String),
    status: expect.any(String),
    createdAt: expect.any(String),
    updatedAt: expect.any(String)
  })
  expect(res.statusCode).toBe(200)
  expect(res.body).toEqual(expect.arrayContaining([expected, expected]))
})

test('get /contracts by wrong user', async () => {
  const res = await request(app).get('/contracts').set('profile_id', 9)
  expect(res.statusCode).toBe(401)
})

test('get /jobs/unpaid by client user', async () => {
  const res = await request(app).get('/jobs/unpaid').set('profile_id', 2)
  const expected = expect.objectContaining({
    id: expect.any(Number),
    price: expect.any(Number),
    description: expect.any(String),
    paymentDate: null,
    paid: null
  })
  expect(res.statusCode).toBe(200)
  expect(res.body).toEqual(expect.arrayContaining([expected, expected]))
})

test('get /jobs/unpaid by contractor user', async () => {
  const res = await request(app).get('/jobs/unpaid').set('profile_id', 6)
  const expected = expect.objectContaining({
    id: expect.any(Number),
    price: expect.any(Number),
    description: expect.any(String),
    paymentDate: null,
    paid: null
  })
  expect(res.statusCode).toBe(200)
  expect(res.body).toEqual(expect.arrayContaining([expected, expected]))
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

test('get /admin/best-clients without limit', async () => {
  const res = await request(app).get('/admin/best-clients').query({ start: '2020-01-01', end: '2022-12-31' })
  const expected = expect.objectContaining({
    id: expect.any(Number),
    paid: expect.any(Number),
    fullName: expect.any(String)
  })
  expect(res.statusCode).toBe(200)
  expect(res.body).toEqual(expect.arrayContaining([expected, expected]))
})

test('get /admin/best-clients with expected response attrs', async () => {
  const res = await request(app).get('/admin/best-clients').query({ start: '2020-01-01', end: '2022-12-31', limit: 3 })
  const expected = expect.objectContaining({
    id: expect.any(Number),
    paid: expect.any(Number),
    fullName: expect.any(String)
  })
  expect(res.statusCode).toBe(200)
  expect(res.body).toEqual(expect.arrayContaining([expected, expected, expected]))
})

test('get /admin/best-clients no content', async () => {
  const res = await request(app).get('/admin/best-clients').query({ start: '2020-01-01', end: '2020-12-31' })
  expect(res.statusCode).toBe(200)
  expect(res.body.length).toBe(0)
})
