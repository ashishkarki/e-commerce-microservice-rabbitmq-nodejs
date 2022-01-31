const jwt = require('jsonwebtoken')

const { JWT_SECRET } = require('./root-secrets')

async function isAuthenticated(req, res, next) {
  // "Bearer <token>".split(' ') => ["Bearer", "<token>"]
  const [, token] = req.headers.authorization.split(' ')

  // console.log(
  //   `isAuthenticated.js => token: ${token}, \n process.env.JWT_SECRET: ${JWT_SECRET}`,
  // )
  try {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          message: 'Invalid token',
        })
      }

      req.user = decoded
      next()
    })
  } catch (err) {
    console.error(`Error verifying token: ${err}`)
    return res.status(500).json({
      message: 'Error verifying token',
    })
  }
}

module.exports = isAuthenticated
