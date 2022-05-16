const { Op } = require('sequelize')
const router = require('express').Router()
const { getDateRange } = require('./middleware')

/**
 * @param {Date} req.start
 * @param {Date} req.end
 * @returns {string} best profession in a time range provided
 */
router.get('/best-profession', getDateRange, async (req, res, next) => {
  const { Profile, Contract } = req.app.get('models')
  const sequelize = req.app.get('sequelize')
  // This is the best fit for now, but may be you need to switch to a raw query if you wanna use a limit 1 for a large amount of professions
  // NOTE: The ORM is under-performant when you add limit below. Don't do that, fallow my advise above instead.
  const [profile] = await Profile.findAll({
    group: 'profession',
    attributes: ['profession'],
    order: sequelize.literal('sum(price) DESC'),
    include: {
      required: true,
      as: 'Contractor',
      model: Contract.unscoped(),
      where: {
        createdAt: {
          [Op.between]: [req.start, req.end]
        }
      },
      include: {
        required: true,
        association: 'PaidJobs'
      }
    }
  })
  if (!profile) return res.sendStatus(204)
  res.send(profile.profession)
})

router.use(function (req, res, next) {
  res.sendStatus(405)
  next()
})

module.exports = router
