const express = require('express')
const status = require('statuses')
const bodyParser = require('body-parser')
const { sequelize } = require('./model')
const apis = require('./routes')
const app = express()

app.use(bodyParser.json())
app.set('sequelize', sequelize)
app.set('models', sequelize.models)

app.use(apis)

app.use(function (ex, req, res, next) {
  const code = ex.status || 500
  res.status(code)
  res.json({
    api: req.path,
    error: ex.message,
    status: status[code] || code
  })
  next()
})

module.exports = app
