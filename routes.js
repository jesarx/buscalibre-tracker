const express = require('express');
const bcrypt = require('bcryptjs');
const mongodb = require('mongodb');
const f = require('./functions');

const db = require('./database');
const ObjectId = mongodb.ObjectId;

const router = express.Router();

// ROUTES LIST

// HOME
router.get('/', async function (req, res) {
   let inputData = req.session.inputData;
   
   if (!inputData) {
      inputData = {
         hasError: false,
         email: '',
         emailConf: '',
         password: ''
      };
   }

   req.session.inputData = null;

   let getData = '';

   if (req.session.user) {
      const userObjectId = new ObjectId(req.session.user.id);
      getData = await db.getDb().collection('user-data').findOne({_id: userObjectId});
   } else {
      getData = await db.getDb().collection('user-data').findOne({email: 'jesarx@riseup.net'});
   }

   if (!getData) {
      getData = 
      {
         "_id": {
           "$oid": ""
         },
         "email": "",
         "password": "",
         "books": [
           {
             "dateAdded": 1692898875890,
             "link": "",
             "title": "",
             "image": "",
             "prices": [
               {
                 "date": 11111,
                 "price": ""
               }
             ]
           }
         ]
      };
      return res.redirect('/signup');
   }

   getData.books.sort((a, b) => b.dateAdded - a.dateAdded);

   res.render('main', {libros: getData.books, f: f, inputData: inputData});
});

// ADD LINK
router.post('/addlink', async function(req, res) {
   const link = req.body.link;
   const nowDate = Date.now();

   const userObjectId = new ObjectId(req.session.user.id);

   if (!userObjectId) {
      return res.status(403).render('403');
   }

   const findLink = await db.getDb().collection('user-data').findOne(
      {
         _id: userObjectId,
         'books.link': link         
      }
   );

   if (findLink) {
      req.session.inputData = {
         hasError: true,
         message: 'El libro ya está agregado a tus rastreadores',
      };
      req.session.save(function () {
         res.redirect('/');
      });
      return;
   }

   const tituloImagen = await f.fetchBookData(link);
   const price = await f.fetchPrice(link);


   const addBook = await db.getDb().collection('user-data').updateOne(
      {_id: userObjectId},
      {
         $push: {
            books: {
               $each: [{
                  dateAdded: nowDate,
                  link: link,
                  title: tituloImagen.titulo,
                  image: tituloImagen.imagen,
                  prices: [
                     {
                         date: nowDate,
                         price: price
                     }
                 ]
               }]
            }
         }
      }
   );

   res.redirect('/');
});

// DELETE LINK
router.get('/dellink/:date', async function(req, res) {
   const userObjectId = new ObjectId(req.session.user.id);

   if (!userObjectId) {
      return res.status(403).render('403');
   }
   const date = req.params.date;

   const deleteQuery = await db.getDb().collection('user-data').updateOne(
      {
         _id: userObjectId,
         "books.dateAdded": parseInt(date)
      },
      { $pull: {
            books: {
               dateAdded: parseInt(date)
            }
         }
      }
   );

   res.redirect('/');
});

// LOGIN
router.get('/login', function (req, res) {
   let inputData = req.session.inputData;
   
   if (!inputData) {
      inputData = {
         hasError: false,
         email: '',
         emailConf: '',
         password: ''
      };
   }

   req.session.inputData = null;

   res.render('login', { inputData: inputData });
});

router.post('/login', async function (req, res) {
   const email = req.body.email;
   const password = req.body.password;

   const existingUser = await db.getDb().collection('user-data').findOne({ email: email });

   if (!existingUser) {
      req.session.inputData = {
         hasError: true,
         message: 'No existe el usuario con el mail ingresado',
         email: email,
         password: password
      };
      req.session.save(function () {
         res.redirect('/login')
      });
      return;
   }

   const passwordMatch = await bcrypt.compare(password, existingUser.password);

   if (!passwordMatch) {
      req.session.inputData = {
         hasError: true,
         message: 'La contraseña ingresada es incorrecta',
         email: email,
         password: password
      };
      req.session.save(function () {
         res.redirect('/login')
      });
      return;
   }

   req.session.user = { id: existingUser._id.toHexString(), isAuth: true};
   req.session.save(function () {
      res.redirect('/');
   });
});

// SIGNUP
router.get('/signup', function(req, res) {
   let inputData = req.session.inputData;
   
   if (!inputData) {
      inputData = {
         hasError: false,
         email: '',
         emailConf: '',
         password: ''
      };
   }

   req.session.inputData = null;

   res.render('signup', { inputData: inputData });
});

router.post('/signup', async function (req, res) {
   const email = req.body.email;
   const emailConf = req.body.emailConf;
   const password = req.body.password;

   if (
      !email ||
      !emailConf ||
      !password ||
      email !== emailConf
   ) {
      req.session.inputData = {
         hasError: true,
         message: 'Hay un error en tus datos',
         email: email,
         emailConf: emailConf,
         password: password
      };

      req.session.save(function() {
         res.redirect('/signup');
      });
      return;
   }

   const existingUser = await db.getDb().collection('user-data').findOne( {email: email });

   if (existingUser) {
      req.session.inputData = {
         hasError: true,
         message: 'El email ingresado corresponde a un usuario existente',
         email: email,
         emailConf: emailConf,
         password: password
      };
      req.session.save(function() {
         res.redirect('/signup');
      });
      return;
   }

   const hashedPassword = await bcrypt.hash(password, 12);

   await db.getDb().collection('user-data').insertOne({
      email: email,
      password: hashedPassword,
      books: [
         {
           dateAdded: 1692910416422,
           link: "https://www.buscalibre.com.mx/libro-textos-de-qumran/9788487699443/p/3069327",
           title: "Textos de Qumran",
           image: "https://images.cdn2.buscalibre.com/fit-in/360x360/bd/b2/bdb20bc47749da55e1e62489302068b1.jpg",
           prices: [
             {
               date: 1692910416422,
               price: "632"
             }
           ]
         }
       ]
   });

   res.redirect('/login');
});

// LOGOUT
router.get('/logout', function (req, res) {
   req.session.user = null;
   res.redirect('/');

});

 module.exports = router;