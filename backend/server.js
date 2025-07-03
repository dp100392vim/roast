const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

const app = express()
app.use(cors({ origin: 'https://your-frontend.onrender.com' }));
app.use(express.json())

const entryRoutes = require('./routes/entryRoutes')

app.use('/entry', entryRoutes)

const PORT = process.env.PORT || 4000 

// Connect to DB

const MONGODB_URL = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSW}@cluster0.m8jonut.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
mongoose.connect(MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true });

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});