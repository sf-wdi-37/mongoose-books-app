// server.js
// SERVER-SIDE JAVASCRIPT

/////////////////////////////
//  SETUP and CONFIGURATION
/////////////////////////////

//require express in our app
var express = require('express'),
  bodyParser = require('body-parser');

// connect to db models
var db = require('./models');

// generate a new express app and call it 'app'
var app = express();

// serve static files in public
// css, app.js, anything else in public folder
app.use(express.static('public'));

// body parser config to accept our datatypes
app.use(bodyParser.urlencoded({ extended: true }));


// custom middleware to console.log some helpful information
//   in terminal every time we get a request
function logRequestInfo(req, res, next){
  console.log(`\nRECEIVED REQUEST : ${req.method} ${req.url}`);
  console.log('query params:', req.query);
  console.log('body:', req.body);
  // request url parameters haven't been decided yet
  //  so we'll have to log them inside any routes where
  //  we want to use them
  next();
}
app.use(logRequestInfo);


////////////////////
//  ROUTES
///////////////////

// define a root route: localhost:3000/
app.get('/', function (req, res) {
  res.sendFile('views/index.html' , { root : __dirname});
});

app.get('/about', function (req, res) {
  console.log('create views/about.html to get this route to work')
  res.sendFile('views/about.html' , { root : __dirname});
});

// get all books
app.get('/api/books', function (req, res) {
  // send all books as JSON response

  // look into database with Book model
  // empty {} filter, so not filtering on any of the schema fields or _id
  db.Book.find({})
    // author is a reference, so when we populate
    // instead of the author id, we get full author info
    .populate('author')  // 'author' is the key from book schema
    .exec(function(err, books){
      if (err) {
        console.log("index error: " + err);
        res.status(500).send();
      } else {
        res.json(books);
      }
    });
});

// get one book
app.get('/api/books/:id', function (req, res) {
  db.Book.findOne({_id: req.params.id }, function(err, data) {
    res.json(data);
  });
});

// create new book
app.post('/api/books', function (req, res) {
  // create new book with form data (`req.body`)
  console.log('books create', req.body);
  // look up author by name
  db.Author.findOne({name: req.body.author})
    .exec(function(err, foundAuthor){
      // if error, send status 500
      if (err) {
        console.log("error: " + err);
        res.status(500).send();
      } else {
        // if foundAuthor is not null:
        if (foundAuthor !== null){
          // use that author to create book
          var newBook = new db.Book({
            title: req.body.title,
            author: foundAuthor._id
          });
          newBook.save(function handleDBBookSaved(err, savedBook) {
            // send book back
            res.json(savedBook);
          });
        } else { // if foundAuthor is null:
          // use the name to create an author
          var newAuthor = new db.Author({
            name: req.body.author,
            alive: true,
            // image:
          })
          newAuthor.save()
          // use the author to create a book
          var newBook = new db.Book({
            title: req.body.title,
            author: newAuthor._id
          });
          // send the  book back
          newBook.save(function(err, savedBook){
            res.json(savedBook);
          })
        }
      }
    })

});


// delete book
app.delete('/api/books/:id', function (req, res) {
  // get book id from url params (`req.params`)
  console.log('books delete', req.params);
  var bookId = req.params.id;
  // find the index of the book we want to remove
  db.Book.findOneAndRemove({ _id: bookId }, function (err, deletedBook) {
    res.json(deletedBook);
  });
});


// update existing book
// what is the method/verb?
// what url/path to use?
app.patch('/api/books/:book_id', updateBook)  // update some fields
app.put('/api/books/:book_id', updateBook)    // update all fields, more common

function updateBook(req, res){
  // grab book id
  var bookId = req.params.book_id;
  console.log('updating book id', bookId);
  console.log(req.body);
  // body: { title: 'dogs', image: 'puppy.png' }
  // find a book with the id from the url (req.params)
  db.Book.findOne({_id:bookId}, function(err, foundBook){
// db.Book.findById(bookId, function(err, foundBook){
    console.log('found book', foundBook);
    // how do we know what the client wants us to change, and the new values?
      // could update url /api/books/:book_id/key/value
      // better practice is to get data from a form, from request body
      // req.body: { title: 'dogs', image: 'puppy.png' }
    // once we find the book, replace fields based on client request
    foundBook.title = req.body.title;
    foundBook.image = req.body.image;
    // once we replace fields, save book
    foundBook.save(function(err, updatedBook){
      if (err){
        console.log('book save error', err);
        res.status(500).send();
      } else {
        // what do we need to send back as response? - updated book
        res.json(updatedBook);
      }
    })
  })
}





app.listen(process.env.PORT || 3000, function () {
  console.log('Example app listening at http://localhost:3000/');
});
