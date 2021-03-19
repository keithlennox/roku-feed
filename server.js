const express = require('express');
const cors = require('cors');
const fs = require('fs');

console.log('Hello from the server!')

const app = express();
app.use(cors());
app.use(express.urlencoded({extended: false}));
app.use(express.json());

app.get('/tvo', (req, res) => {
  fs.readFile('./public/tvo.json', 'utf8', (err, data) => {
    res.send(data);
  })
});

app.get('/tvokids', (req, res) => {
  fs.readFile('./public/tvokids.json', 'utf8', (err, data) => {
    res.send(data);
  })
});

app.listen(3000);