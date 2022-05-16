const isInvalidDate = dt => !Date.parse(dt)

class InvalidDateError extends Error {
  constructor (msg, status) {
    super(msg)
    this.status = status
  }
}

const InvalidDate = ({ param, value }, status = 400) => new InvalidDateError(`Invalid ${param}:${value} date format. Try this one 2020-01-31`, status)

const getDateRange = async (req, res, next) => {
  const { start, end } = req.params
  if (start && isInvalidDate(start)) next(InvalidDate({ start }))
  if (end && isInvalidDate(end)) next(InvalidDate({ end }))
  req.start = start
  req.end = end
  next()
}

const getProfile = async (req, res, next) => {
  const { Profile } = req.app.get('models')
  const profile = await Profile.findOne({ where: { id: req.get('profile_id') || 0 } })
  if (!profile) return res.status(401).end()
  req.profile = profile
  next()
}

module.exports = {
  getProfile,
  getDateRange
}
