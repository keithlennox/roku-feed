const express = require('express');
const cors = require('cors');
const fs = require('fs');
const cron = require('./cron');

const app = express();
app.use(cors());
app.use(express.urlencoded({extended: false}));
app.use(express.json());

app.get('/', (req, res) => {
  fs.readFile('./feed.json', 'utf8', (err, data) => {
    res.send(data);
  })
});

app.listen(3000);