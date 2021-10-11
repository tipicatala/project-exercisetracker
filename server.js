const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')
const bodyParser = require("body-parser");
const shortId = require("shortid");

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

mongoose.connect(process.env['MONGO_URI'], {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
})

const connection = mongoose.connection
connection.on('error', err => console.error(err))

const Schema = mongoose.Schema
const userSchema = new Schema({
  username: String,
  log: [{ duration: Number, date: String, description: String }],
})

const User = mongoose.model('User', userSchema)

app.post('/api/users', async (req, res) => {
  const user = await User.findOne({ username: req.body.username })
  if (user) {
    res.json({
      username: user.username,
      _id: user["_id"],
    })
  } else {
    const newUser = new User({
      username: req.body.username,
    })
    await newUser.save()
    res.json({
      username: newUser.username,
      _id: newUser["_id"],
    })
  }
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  const user = await User.findOne({ _id: req.params._id })
  const dateObj = req.body.date
  ? { date: new Date(req.body.date).toDateString()}
  : { date: new Date().toDateString() }

  user.log.push({
    duration: +req.body.duration,
    description: req.body.description,
    ...dateObj,
  })
  await user.save()
  res.json({
    username: user.username,
    _id: user["_id"],
    duration: +req.body.duration,
    description: req.body.description,
    ...dateObj,
  })
})

app.get('/api/users/:_id/logs', async (req, res) => {
  const user = await User.findOne({ _id: req.params._id })
  console.log(req.query)
  console.log(req.params)

  if (req.query.to && req.query.from) {
    const rightLogs = user.log.filter(ex => new Date(ex.date).getTime() >= new Date(req.query.from).getTime() && new Date(ex.date).getTime() <= new Date(req.query.to).getTime())
    .map(log => {
      const { _id, ...rest } = log
      return { date: log.date, description: log.description, duration: log.duration }
    })
    res.json({
      username: user.username,
      count: rightLogs.length > +req.query.limit ? +req.query.limit : rightLogs.length,
      _id: user._id,
      from: new Date(req.query.from).toDateString(),
      to: new Date(req.query.to).toDateString(),
      log: rightLogs.length > +req.query.limit ? rightLogs.slice(0, +req.query.limit) : rightLogs,
    })

  } else {
    const validLimit = req.query.limit || user.log.length

    res.json({
      username: user.username,
      count: +validLimit,
      _id: user._id,
      log: user.log.map(log => {
      return { date: log.date, description: log.description, duration: log.duration }
    }).slice(0, +validLimit),
    })
  }
})

// link = https://boilerplate-project-exercisetracker-1.tipicatala.repl.co/api/users/615c6f0c01302105d28ba550/logs?from=2021-01-01&to=2021-10-11&limit=1

app.get('/api/users', async (req, res) => {
  res.json(await User.find())
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
