const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

const entryRoutes = require('./routes/entryRoutes')

app.use('/entry', entryRoutes)

const PORT = 3000

// Connect to DB
mongoose.connect('mongodb://localhost:27017/roest')
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch(error => {
    console.error('Database connection error:', error)
  })