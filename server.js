const express = require('express');
const cors = require('cors');

//Express server
const app = express();
app.use(cors());
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.get('/', (req, res) => {
  res.send('Hello World!');
  //Ingest json file and return roku json object
});
app.listen(3000);