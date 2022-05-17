const router = require('express').Router()
const { getProfile } = require('./middleware')

/**
 * @returns a list of unpaid jobs by user
 */
router.get('/unpaid', getProfile, async (req, res) => {
  const { Contract } = req.app.get('models')
  const contracts = await Contract.findAll({
    attributes: ['id'],
    where: req.belongsTo,
    include: {
      required: true,
      association: 'UnpaidJobs',
      attributes: ['id', 'description', 'paymentDate', 'price', 'paid']
    }
  })
  res.json(contracts.map(c => c.UnpaidJobs).flat())
})

/**
 * @returns a list of unpaid jobs by user
 */
router.post('/:job_id/pay', getProfile, async (req, res) => {
  const { Job } = req.app.get('models')
  const { job_id: id } = req.params
  const job = await Job.scope('unpaid').findOne({ where: { id } })
  if (!job) return res.sendStatus(404)
  const contract = await job.getContract()
  if (contract.clientId !== req.profile.id) return res.sendStatus(403)
  res.json()
})

router.use(function (req, res, next) {
  res.sendStatus(405)
  next()
})

module.exports = router
