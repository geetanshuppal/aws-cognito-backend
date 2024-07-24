const express = require('express');
const AuthRouter = require('./routes/AuthRoutes')
const cors = require('cors');

const app = express();
app.use(cors({
  origin: '*', // Allow all origins. For better security, specify the allowed origins.
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type,Authorization,token',
  credentials: true,
}));

app.use(express.json());
app.use('/api', AuthRouter);

app.listen(process.env.APP_PORT, () => {
  console.log(`Running on ${process.env.APP_PORT}`);
});

module.exports = app;