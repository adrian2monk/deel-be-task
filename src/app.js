const express = require('express')
const bodyParser = require('body-parser')
const { Op } = require('sequelize')
const { sequelize } = require('./model')
const { getProfile } = require('./middleware/getProfile')
const app = express()

app.use(bodyParser.json())
app.set('sequelize', sequelize)
app.set('models', sequelize.models)

/**
 * @returns a list of contracts by user
 */
app.get('/contracts', getProfile, async (req, res) => {
  const { Contract } = req.app.get('models')
  // Improvement: Keep all the roles in one place to tracking all changes in Profile model type enum
  // Just prevent to show you all when some new role gets added and this method get not updated
  const belongsTo = ({ id, type }) => ({ client: { ClientId: id }, contractor: { ContractorId: id } })[type] || { clientId: 0 }
  const contracts = await Contract.findAll({
    attributes: { exclude: ['ClientId', 'ContractorId'] },
    where: {
      status: { [Op.ne]: 'terminated' },
      ...belongsTo(req.profile)
    }
  })
  res.json(contracts)
})

/**
 * @returns contract by id
 */
app.get('/contracts/:id', getProfile, async (req, res) => {
  const { Contract } = req.app.get('models')
  const { id } = req.params
  const contract = await Contract.findOne({ where: { id } })
  if (!contract) return res.status(404).end()
  const contractor = await contract.getContractor()
  if (contractor.id !== req.profile.id) return res.status(403).end()
  res.json(contract)
})

module.exports = app
