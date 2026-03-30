const express = require('express');
const cors = require('cors');
// Removed runtime routes

const app = express();

app.use(cors());
app.use(express.json());

module.exports = app; 