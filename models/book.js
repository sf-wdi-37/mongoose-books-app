// models/book.js
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// var Character = require('./character.js')
// var characterSchema = Character.schema;

var BookSchema = new Schema({
     title: String,
    //  author: String,
     author: {
       type: Schema.Types.ObjectId,
       ref: 'Author'
     },
    //  characters: [characterSchema],
     image: String,
     releaseDate: String
});

var Book = mongoose.model('Book', BookSchema);
module.exports = Book;
