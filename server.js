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

  res.json({
    username: user.username,
    count: user.log.length,
    _id: user._id,
    log: user.log,
  })
})

app.get('/api/users', async (req, res) => {
  res.json(await User.find())
})

app.get('/api/users/:_id/logs?[&from][&to][&limit]', async (req, res) => {
  console.log(req.params)
  // const user = await User.findOne({ _id: req.params._id })

  // res.json({
  //   username: user.username,
  //   count: user.log.length,
  //   _id: user._id,
  //   log: user.log,
  // })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
