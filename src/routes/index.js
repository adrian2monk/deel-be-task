const jobs = require('./jobs')
const admin = require('./admin')
const router = require('express').Router()
const { getProfile } = require('./middleware')

class ForbiddenAmountError extends Error {
  constructor (amount, price) {
    super(`The amount=${amount} is higher than 25% of the available price=${price} to pay`)
    this.status = 400
  }
}

class InvalidAmountError extends Error {
  constructor (amount) {
    super(`The amount=${amount} is not a valid numeric value`)
    this.status = 400
  }
}

class RequiredAmountError extends Error {
  constructor () {
    super('The amount is required when top-up balance')
    this.status = 400
  }
}

/**
 * @returns a list of active contracts by user
 */
router.get('/contracts', getProfile, async (req, res) => {
  const { Contract } = req.app.get('models')
  const contracts = await Contract.scope('active').findAll({
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
  const contract = await Contract.findOne({ where: { id } })
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

/**
 * @param {number} req.body.amount top-up amount
 * @returns Ok HTTP status code
 */
router.post('/balances/deposit/:userId', async (req, res, next) => {
  const sequelize = req.app.get('sequelize')
  const { Profile, Contract, Job } = req.app.get('models')
  const { userId: id } = req.params
  if (!req.body.amount) return next(new RequiredAmountError())
  const amount = parseFloat(req.body.amount)
  if (Number.isNaN(amount)) return next(new InvalidAmountError(req.body.amount))
  // NOTE: The transaction type is only suitable for sqlite dialect. Use another locking strategy (e.g SELECT FOR UPDATE) when is available
  const transaction = await sequelize.transaction({ type: 'IMMEDIATE' })
  try {
    const client = await Profile.findOne({ where: { id, type: 'client' }, transaction })
    if (!client) return res.sendStatus(404)
    const price = await Job.scope('unpaid').sum('price', {
      transaction,
      include: {
        required: true,
        attributes: ['id'],
        where: { ClientId: client.id },
        model: Contract.scope('active')
      }
    })
    if (amount > price * 0.25) return next(new ForbiddenAmountError(amount, price))
    client.balance += amount
    await client.save({ transaction })
    await transaction.commit()
    res.sendStatus(200)
  } catch (ex) {
    console.error(ex)
    await transaction.rollback()
    next(ex)
  }
})

module.exports = router
