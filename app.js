const path = require('path');
const express = require('express');
const appRoutes = require('./routes');
const mongodb = require('mongodb');
const db = require('./database');
const ObjectId = mongodb.ObjectId;
const app = express();
const cron = require('node-cron');
const f = require('./functions');

// Activate EJS view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true })); // Parse incoming request bodies
app.use(express.json());
app.use(express.static('public')); // Serve static files (e.g. CSS files)

app.use(appRoutes);

app.use(function (error, req, res, next) {
  // Default error handling function
  // Will become active whenever any route / middleware crashes
  console.log(error);
  res.status(500);
});

db.connectToDatabase().then(function () {
   app.listen(3000);

   async function priceFetchStore () {
      try {
         const getData = await db.getDb().collection('links').find().toArray();
         const linksArray = getData.map(item => item.link);
         console.log(linksArray);

         for (const link of linksArray) {
            const price = await f.fetchPrice(link);
            console.log(price);

            const updatePrice = await db.getDb().collection('links').updateOne(
               {link: link},
               {
                  $push: {
                     prices: {
                        $each: [{
                           date: Date.now(),
                           price: price
                        }]
                     }
                  }
               }
            );

            console.log(updatePrice);
         }

      } catch (error) {
         console.error('Error fetching price:', error);
         return null;
      }
   
   }

   // priceFetchStore();
   // cron.schedule('0 2 * * *', fetchAndStoreText);
});

// DAILY PRICE FETCHER




