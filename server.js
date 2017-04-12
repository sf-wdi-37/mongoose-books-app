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


////////////////////
//  MIDDLEWARE
///////////////////


// serve static files in public
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

// get all books
app.get('/api/books', function (req, res) {
  // send all books as JSON response
  db.Book.find().populate('author')
    .exec(function(err, books) {
      if (err) { return console.log("index error: " + err); }
      res.json(books);
  });
});

// get one book
app.get('/api/books/:id', function (req, res) {
  console.log('request url params:', req.params)
  db.Book.findOne({_id: req.params.id }, function(err, data) {
    res.json(data);
  });
});

// create new book
// AUTHOR MUST EXIST ALREADY!
app.post('/api/books', function (req, res) {
  // create new book with form data (`req.body`)
  var newBook = new db.Book({
    title: req.body.title,
    image: req.body.image,
    releaseDate: req.body.releaseDate,
  });
  // find the author from req.body
  db.Author.findOne({name: req.body.author}, function(err, author){
    if (err) {
      console.log(err.message);
      res.status(500).send();
    } else {
      console.log('author is:', author);
      if (author === null){
        // this author doesn't exist in our database yet
        // let's log an informative error message
        console.log(`book create error: author ${req.body.author} not found - create author first!`);
        res.status(500).send();
      } else {
        // found the author!
        // add this author to the book
        newBook.author = author;
        // save newBook to database
        newBook.save(function(err, book){
          if (err) {
            console.log('book save error:', err.message);
            res.status(500).send();
          } else {
            console.log('saved book:', book );
            // send back the book!
            res.json(book);
          }
        });
      }
    }
  });
});


// delete book
app.delete('/api/books/:id', function (req, res) {
  console.log('request url params:', req.params)
  // get book id from url params (`req.params`)
  console.log('books delete', req.params);
  var bookId = req.params.id;
  // find the index of the book we want to remove
  db.Book.findOneAndRemove({ _id: bookId })
    .populate('author')
    .exec(function (err, deletedBook) {
      res.json(deletedBook);
  });
});


// create a character associated with a book
app.post('/api/books/:book_id/characters', function (req, res) {
  // Get book id from url params (`req.params`)
  console.log('request url params:', req.params)
  var bookId = req.params.book_id;
  db.Book.findById(bookId)
    .populate('author')
    .exec(function(err, foundBook) {
      console.log(foundBook);
      if (err) {
        res.status(500).send();
      } else if (foundBook === null) {
        // Is this the same as checking if the foundBook is undefined?
        res.status(404).send();
      } else {
        // push character into characters array
        foundBook.characters.push(req.body);
        // save the book with the new character
        foundBook.save();
        res.status(201).json(foundBook);
      }
    });
});


// Delete a character associated with a book
app.delete('/api/books/:book_id/characters/:character_id', function (req, res) {
  console.log('request url params:', req.params)
  // Get book id from url params (`req.params`)
  var bookId = req.params.book_id;
  var characterId = req.params.character_id;
  console.log(`deleting character ${characterId} from book ${bookId}`);
  db.Book.findById(bookId)
    .populate('author')
    .exec(function(err, foundBook) {
      if (err) {
        console.log('error!', err.message);
        res.status(500).send();
      } else if (foundBook === null) {
        res.status(500).send();
      } else {
        // find the character by id
        var deletedCharacter = foundBook.characters.id(characterId);
        // delete the found character
        deletedCharacter.remove();
        // save the found book with the character deleted
        foundBook.save();
        // send back the found book without the character
        res.json(foundBook);
      }
    });
});


////////////////////
//  LISTEN
///////////////////

app.listen(process.env.PORT || 3000, function () {
  console.log('Example app listening at http://localhost:3000/');
});
