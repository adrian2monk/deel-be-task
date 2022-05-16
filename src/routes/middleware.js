const isInvalidDate = dt => !Date.parse(dt)

class InvalidDateError extends Error {
  constructor (msg, status) {
    super(msg)
    this.status = status
  }
}

const InvalidDate = ({ start, end, msg }, status = 400) => {
  const val = start || end || null
  const key = (start && 'start') || (end && 'end') || 'date'
  return new InvalidDateError(msg || `Invalid query param '${key}=${val}' date format. Try this one 2020-01-31`, status)
}

const getDateRange = async (req, res, next) => {
  const { start, end } = req.query
  if (!start) return next(InvalidDate({ msg: 'Query param `start` required' }))
  if (isInvalidDate(start)) return next(InvalidDate({ start }))
  if (!end) return next(InvalidDate({ msg: 'Query param `end` required' }))
  if (isInvalidDate(end)) return next(InvalidDate({ end }))
  req.start = new Date(start)
  req.end = new Date(end)
  next()
}

const getProfile = async (req, res, next) => {
  try {
    const { Profile } = req.app.get('models')
    const profile = await Profile.findOne({ where: { id: req.get('profile_id') || 0 } })
    if (!profile) return res.status(401).end()
    req.profile = profile
    next()
  } catch (ex) {
    next(ex)
  }
}

module.exports = {
  getProfile,
  getDateRange
}
