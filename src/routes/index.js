const admin = require('./admin')
const router = require('express').Router()
const { getProfile } = require('../middleware/getProfile')

// Improvement: Keep all the roles in one place to tracking all changes in Profile model type enum
// Just prevent to show you all when some new role gets added and this method get not updated
const belongsTo = ({ id, type }) => ({ client: { ClientId: id }, contractor: { ContractorId: id } })[type] || { clientId: 0 }

router.use(admin)

/**
 * @returns a list of active contracts by user
 */
router.get('/contracts', getProfile, async (req, res) => {
  const { Contract } = req.app.get('models')
  const contracts = await Contract.findAll({
    attributes: { exclude: ['ClientId', 'ContractorId'] },
    where: belongsTo(req.profile)
  })
  res.json(contracts)
})

/**
 * @returns contract by id
 */
router.get('/contracts/:id', getProfile, async (req, res) => {
  const { Contract } = req.app.get('models')
  const { id } = req.params
  const contract = await Contract.unscoped().findOne({ where: { id } })
  if (!contract) return res.status(404).end()
  const contractor = await contract.getContractor()
  if (contractor.id !== req.profile.id) return res.status(403).end()
  res.json(contract)
})

/**
 * @returns a list of unpaid jobs by user
 */
router.get('/jobs/unpaid', getProfile, async (req, res) => {
  const { Contract } = req.app.get('models')
  const contracts = await Contract.findAll({
    attributes: ['id'],
    where: belongsTo(req.profile),
    include: { association: 'UnpaidJobs', required: true }
  })
  res.json(contracts.map(c => c.UnpaidJobs).flat())
})

module.exports = router
