const isInvalidDate = dt => !Date.parse(dt)

class InvalidDateError extends Error {
  constructor ({ start, end, msg }) {
    const val = start || end || null
    const key = (start && 'start') || (end && 'end') || 'date'
    super(msg || `Invalid query param '${key}=${val}' date format. Try this one 2020-01-31`)
    this.status = 400
  }
}

const getDateRange = async (req, res, next) => {
  const { start, end } = req.query
  if (!start) return next(new InvalidDateError({ msg: 'Query param `start` required' }))
  if (isInvalidDate(start)) return next(new InvalidDateError({ start }))
  if (!end) return next(new InvalidDateError({ msg: 'Query param `end` required' }))
  if (isInvalidDate(end)) return next(new InvalidDateError({ end }))
  req.start = new Date(start)
  req.end = new Date(end)
  next()
}

const getProfile = async (req, res, next) => {
  const { Profile } = req.app.get('models')
  // Improvement: Keep all the roles in one place to tracking all changes in Profile model type enum
  // Just prevent to show you all when some new role gets added and this method get not updated
  const belongsTo = ({ id, type }) => ({ client: { ClientId: id }, contractor: { ContractorId: id } })[type] || { clientId: 0 }
  const profile = await Profile.findOne({ where: { id: req.get('profile_id') || 0 } })
  if (!profile) return res.status(401).end()
  req.profile = profile
  req.belongsTo = belongsTo(profile)
  next()
}

module.exports = {
  getProfile,
  getDateRange
}
