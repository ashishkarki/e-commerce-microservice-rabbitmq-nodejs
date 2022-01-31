const express = require('express')
const jwt = require('jsonwebtoken')

const User = require('../models/User')

// the router
const userRouter = express.Router()

// helper methods
const jwtHelper = (payload) => {
  const retValue = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '1h',
  })

  return retValue
}

// login endpoint
userRouter.post('/login', async (req, res) => {
  const { email, password } = req.body

  // check if email and password are valid
  if (!email || !password) {
    return res.status(400).json({
      message: 'Please provide email and password',
    })
  }

  // check if email and password are correct
  const user = await User.findOne({ email, password })

  if (!user) {
    return res.status(400).json({
      message: 'Incorrect email or password',
    })
  } else {
    const payload = {
      email,
      name: user.name,
    }

    const token = jwtHelper(payload)

    if (!!token) {
      return res.status(200).json({
        message: 'Successfully logged in',
        token,
      })
    } else {
      return res.status(500).json({
        message: 'Error signing token',
      })
    }
  }
})

// register endpoint
userRouter.post('/register', async (req, res) => {
  const { name, email, password } = req.body

  const doesUserExist = await User.findOne({ email })

  if (doesUserExist) {
    return res.json({
      message: `User with email ${email} already exists`,
    })
  } else {
    const newUser = new User({
      name,
      email,
      password,
    })

    newUser.save()

    return res.status(201).json({
      message: 'User created successfully',
      user: newUser,
    })
  }
})

// export
module.exports = userRouter
