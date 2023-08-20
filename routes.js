const express = require('express');
const mongodb = require('mongodb');
const f = require('./functions');

const db = require('./database');
const ObjectId = mongodb.ObjectId;

const router = express.Router();

router.get('/', async function (req, res) {
   const getData = await db.getDb().collection('links').find().toArray();

   res.render('main', {libros: getData, f: f});
 });

 router.post('/addlink', async function(req, res) {

   const findLink = await db.getDb().collection('links').findOne({link: req.body.link});

   if (findLink) {
      return;
   }

   const tituloImagen = await f.fetchBookData(req.body.link);
   const price = await f.fetchPrice(req.body.link);



   const newRecord = {
      dateAdded: req.body.dateAdded,
      link: req.body.link,
      title: tituloImagen.titulo,
      image: tituloImagen.imagen,
      prices: [
          {
              date: req.body.dateAdded,
              price: price
          }
      ]
  };

  console.log(newRecord);

   await db.getDb().collection('links').insertOne(newRecord);

 });

 module.exports = router;