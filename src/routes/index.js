const jobs = require('./jobs')
const admin = require('./admin')
const router = require('express').Router()
const { getProfile } = require('./middleware')

/**
 * @returns a list of active contracts by user
 */
router.get('/contracts', getProfile, async (req, res) => {
  const { Contract } = req.app.get('models')
  const contracts = await Contract.findAll({
    attributes: { exclude: ['ClientId', 'ContractorId'] },
    where: req.belongsTo
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
  if (!contract) return res.sendStatus(404)
  if (![contract.ContractorId, contract.ClientId].includes(req.profile.id)) return res.sendStatus(403)
  res.json(contract)
})

router.use('/contracts', function (req, res, next) {
  res.sendStatus(405)
  next()
})

router.use('/jobs', jobs)
router.use('/admin', admin)

module.exports = router
