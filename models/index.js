var mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/book-app");

// Use native JavaScript promises to avoid warning
mongoose.Promise = global.Promise;

module.exports.Book = require("./book.js");
module.exports.Author = require("./author.js");
