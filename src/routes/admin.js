const router = require('express').Router()
const { QueryTypes, Op } = require('sequelize')
const { getDateRange } = require('./middleware')

/**
 * @param {Date} req.start date range
 * @param {Date} req.end date range
 * @returns {string} best profession in a time range provided
 */
router.get('/best-profession', getDateRange, async (req, res) => {
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
      model: Contract,
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

/**
 * @param {Date} req.start date range
 * @param {Date} req.end date range
 * @param {integer} req.limit default 2
 * @returns {string} a list of top clients sorted by higher payer
 */
router.get('/best-clients', getDateRange, async (req, res) => {
  const { limit = 2 } = req.query
  const { Profile } = req.app.get('models')
  const sequelize = req.app.get('sequelize')
  const parseDate = dt => dt.toISOString().slice(0, 19).replace('T', ' ')
  const start = parseDate(req.start)
  const end = parseDate(req.end)
  const clients = await sequelize.query(`
    SELECT pf.id, pf.firstName, pf.lastName, sum(jb.price) AS paid
      FROM Contracts ct INNER JOIN Profiles pf ON(ct.ClientId = pf.id AND ct.createdAt BETWEEN :start AND :end) 
        INNER JOIN Jobs jb ON(ct.id = jb.ContractId AND jb.paid = 1)
      GROUP BY pf.id, pf.firstName, pf.lastName 
      ORDER BY paid DESC 
      LIMIT :limit
  `, {
    replacements: { limit, start, end },
    type: QueryTypes.SELECT,
    model: Profile
  })
  res.json(clients.map(m => m.toJSON()).map(({ id, fullName, paid }) => ({ id, fullName, paid })))
})

router.use(function (req, res, next) {
  res.sendStatus(405)
  next()
})

module.exports = router
