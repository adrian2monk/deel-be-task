const express = require('express')
const bodyParser = require('body-parser')
const { sequelize } = require('./model')
const apis = require('./routes')
const app = express()

app.use(bodyParser.json())
app.set('sequelize', sequelize)
app.set('models', sequelize.models)

app.use(apis)

module.exports = app
