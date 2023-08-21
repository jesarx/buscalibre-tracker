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

   const link = req.body.link;
   const nowDate = Date.now();
   console.log(nowDate);

   const findLink = await db.getDb().collection('links').findOne({link: link});

   if (findLink) {
      return;
   }

   const tituloImagen = await f.fetchBookData(link);
   const price = await f.fetchPrice(link);



   const newRecord = {
      dateAdded: req.body.dateAdded,
      link: link,
      title: tituloImagen.titulo,
      image: tituloImagen.imagen,
      prices: [
          {
              date: nowDate,
              price: price
          }
      ]
   };

   console.log(newRecord);

   await db.getDb().collection('links').insertOne(newRecord);
   res.redirect('/');
});

 module.exports = router;