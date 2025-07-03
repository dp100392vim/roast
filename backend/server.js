const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const app = express()
app.use(express.json())

if (process.env.NODE_ENV === 'development') {
  require('dotenv').config(); //$env:NODE_ENV="development"; node server.js         --------------- cmd in shell
}
console.log('process.env.CORS', process.env.CORS)
app.use(cors({ origin: process.env.CORS }));

const entryRoutes = require('./routes/entryRoutes')
const deeplRoutes = require('./routes/deeplRoutes')

app.use('/entry', entryRoutes)
app.use('/deepl', deeplRoutes)

// Connect to DB

const URI = process.env.MONGODB_URL
mongoose.connect(URI);

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});