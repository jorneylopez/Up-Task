const express = require('express');
const routes = require('./routes');
const path = require('path');
const bodyParser = require('body-parser');

//app de express
const app = express();

//cargar archivos estaticos o publicos
app.use(express.static('public'));

// habilitar pug
app.set('view engine', 'pug');

//vistas
app.set('views', path.join(__dirname, './views'));

//habilitar bodyParser
app.use(bodyParser.urlencoded({extended: true}));

app.use('/', routes());

app.listen(3000);