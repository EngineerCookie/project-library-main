/*
*
*
*       Complete the API routing below
*       
*       
*/

'use strict';

module.exports = function (app) {

  let mongoose = require('mongoose');
  mongoose.set('strictQuery', true);

  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  let bookSchema = mongoose.Schema({
    title: {
      type: String,
      required: true
    },
    comments: [String]
  });

  let books = mongoose.model('books', bookSchema);

  app.route('/api/books')
    .get(async function (req, res){
      //response will be array of book objects
      //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
      let result = await books.aggregate([
        {$match: {}},
        {$project: {
          title: 1,
          comments: 1,
          commentcount: {$size: '$comments'}
        }}
      ])
      res.send(result);
    })
    
    .post(async function (req, res){
      console.log(req.body.title)
      try {
        let title = req.body.title;
        //response will contain new book object including atleast _id and title
        let savedBook = await books.create({ title: title});
        let returnObj = await books.findOne({_id: savedBook._id }).select({title: 1, _id: 1})
        res.json(returnObj);

      } catch(err) {
        res.send('missing required field title')
      }
    })
    
    .delete(async function(req, res){
      //if successful response will be 'complete delete successful'
      await books.deleteMany({});
      res.send('complete delete successful')
    });



  app.route('/api/books/:id')
    .get(async function (req, res){
      let bookid = req.params.id;
      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
      let result = await books.aggregate([
        {$match: {_id: mongoose.Types.ObjectId(`${bookid}`)}},
        {$project: {
          _id: 1,
          title: 1,
          comments: 1,
          commentcount: {$size: "$comments"}
        }}
      ]);
      res.json(result[0]);
    })
    
    .post(async function(req, res){
      let bookid = req.params.id;
      let comment = req.body.comment;
      //json res format same as .get
      await books.findOneAndUpdate(
        {_id : bookid},
        {$push: {comments: comment}},
        {new: true}
      );
      let result = await books.aggregate([
        {$match: { _id: mongoose.Types.ObjectId(`${bookid}`)}},
        {$project: {
          _id: 1,
          title: 1,
          comments: 1,
          commentcount: {$size: "$comments"}
        }}
      ]);
      res.json(result);
    })
    
    .delete(async function(req, res){
      let bookid = req.params.id;
      //if successful response will be 'delete successful'
      await books.findOneAndDelete({ _id: bookid })
      res.send('delete successful')
    });
  
};
