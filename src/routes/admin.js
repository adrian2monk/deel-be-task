const router = require('express').Router()
const { getDateRange } = require('./middleware')

/**
 * @returns a list of active contracts by user
 */
router.get('/best-profession', getDateRange, async (req, res, next) => {
//   const { Contract } = req.app.get('models')
//   res.json(contracts)
  next(new Error('Not implemented yet'))
})

router.use(function (req, res, next) {
  res.sendStatus(405)
  next()
})

module.exports = router
