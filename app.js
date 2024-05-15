const path = require('path');
const express = require('express');

const session = require('express-session');
const mongodbStore = require('connect-mongodb-session');

const appRoutes = require('./routes');
const mongodb = require('mongodb');
const db = require('./database');

const ObjectId = mongodb.ObjectId;
const MongoDBStore = mongodbStore(session);

const app = express();

const sessionStore = new MongoDBStore({
  uri: 'mongodb://127.0.0.1:27017',
  databaseName: 'bl',
  collection: 'sessions'
});

const cron = require('node-cron');
const f = require('./functions');

// Activate EJS view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true })); // Parse incoming request bodies
app.use(express.static('public')); // Serve static files (e.g. CSS files)
app.use('/chartjs', express.static('node_modules/chart.js'));


app.use(session({
  secret: 'super-secret',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    maxAge: 6 * 30 * 24 * 60 * 60 * 1000
  }
}));

app.use(async function(req, res, next) {
  const user = req.session.user;

  if (!user) {
    return next();
  }

  const userObjectId = new ObjectId(user.id);
  const userData = await db.getDb().collection('user-data').findOne({ _id: userObjectId });

  res.locals.userData = userData;

  next();

});

app.use(appRoutes);

app.use(function(error, req, res, next) {
  // Default error handling function
  // Will become active whenever any route / middleware crashes
  console.log(error);
  res.status(500);
});

db.connectToDatabase().then(function() {
  app.listen(3000);
  console.log('App listening on port 3000!');

  // DAILY PRICE FETCHER FUNCTION
  async function priceFetchStore() {
    try {
      const getData = await db.getDb().collection('user-data').find().toArray();
      const bookArray = getData.map(item => item.books).flat();
      const linkArray = bookArray.map(item => item.link);
      // console.log(linkArray);

      for (const link of linkArray) {
        // console.log(link);

        const price = await f.fetchPrice(link);
        // console.log(price);

        const updatePrice = await db.getDb().collection('user-data').updateMany(
          {
            books: {
              $elemMatch: {
                'link': link
              }
            }
          },
          {
            $push: {
              'books.$[elem].prices': {
                $each: [{
                  date: Date.now(),
                  price: price
                }]
              }

            }
          },
          {
            arrayFilters: [
              { 'elem.link': link }
            ]
          }
        );
      }
    } catch (error) {
      console.error('Error al obtener precio actualizado con cron:', error);
      return null;
    }

  }
  // FETCH PRICE AT 2AM EVERY DAY
  cron.schedule('0 2 * * *', priceFetchStore);
});



