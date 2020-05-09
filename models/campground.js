const mongoose = require('mongoose');

// Schema Setup
const campgroundSchema = new mongoose.Schema({
  name: String,
  image: String,
  description: String,
  author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String
  },
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment'
    }
  ]
});

campgroundSchema.pre('remove', async () => {
  await Comment.remove({
    _id: {
      $in: this.comments
    }
  });
});


// Compile schema to model
module.exports = mongoose.model('Campground', campgroundSchema);