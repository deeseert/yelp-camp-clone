const mongoose = require('mongoose');

// Schema Setup
const campgroundSchema = new mongoose.Schema({
  name: String,
  image: String,
  description: String,
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment"
    }
  ]
});

// Compile schema to model
module.exports = mongoose.model('Campground', campgroundSchema);