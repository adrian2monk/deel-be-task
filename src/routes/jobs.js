const router = require('express').Router()
const { getProfile } = require('./middleware')

class NotEnoughBalanceError extends Error {
  constructor (balance, amount) {
    super(`Your balance=${balance} is not enough to pay $${amount}`)
    this.status = 400
  }
}

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
 * @returns Ok HTTP status code
 */
router.post('/:job_id/pay', getProfile, async (req, res, next) => {
  const sequelize = req.app.get('sequelize')
  const { Job } = req.app.get('models')
  const { job_id: id } = req.params
  // NOTE: The transaction type is only suitable for sqlite dialect. Use another locking strategy (e.g SELECT FOR UPDATE) when is available
  const transaction = await sequelize.transaction({ type: 'IMMEDIATE' })
  try {
    const job = await Job.scope('unpaid').findOne({ where: { id }, transaction })
    if (!job) return res.sendStatus(404)
    const contract = await job.getContract({ transaction })
    if (contract.ClientId !== req.profile.id) return res.sendStatus(403)
    const client = await contract.getClient({ transaction })
    if (job.price > client.balance) return next(new NotEnoughBalanceError(client.balance, job.price))
    job.paid = true
    const contractor = await contract.getContractor({ transaction })
    contractor.balance += job.price
    client.balance -= job.price
    await contract.save({ transaction })
    await client.save({ transaction })
    await job.save({ transaction })
    await transaction.commit()
    res.json()
  } catch (ex) {
    console.error(ex)
    await transaction.rollback()
    next(ex)
  }
})

router.use(function (req, res, next) {
  res.sendStatus(405)
  next()
})

module.exports = router
