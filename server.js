const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs')

const campgrounds = [
  { name: 'Torino Camp', image: 'https://pixabay.com/get/52e3d5404957a514f6da8c7dda793f7f1636dfe2564c704c7d2d7ddc9244c45f_340.jpg' },
  { name: 'Another Camp', image: 'https://pixabay.com/get/52e7d0454d55a814f6da8c7dda793f7f1636dfe2564c704c7d2d7ddc9244c45f_340.jpg' },
  { name: 'Scampia Camp', image: 'https://pixabay.com/get/52e5d7414355ac14f6da8c7dda793f7f1636dfe2564c704c7d2d7ddc9244c45f_340.jpg' },
  { name: 'Torino Camp', image: 'https://pixabay.com/get/52e3d5404957a514f6da8c7dda793f7f1636dfe2564c704c7d2d7ddc9244c45f_340.jpg' },
  { name: 'Another Camp', image: 'https://pixabay.com/get/52e7d0454d55a814f6da8c7dda793f7f1636dfe2564c704c7d2d7ddc9244c45f_340.jpg' },
  { name: 'Scampia Camp', image: 'https://pixabay.com/get/52e5d7414355ac14f6da8c7dda793f7f1636dfe2564c704c7d2d7ddc9244c45f_340.jpg' },
  { name: 'Torino Camp', image: 'https://pixabay.com/get/52e3d5404957a514f6da8c7dda793f7f1636dfe2564c704c7d2d7ddc9244c45f_340.jpg' },
  { name: 'Another Camp', image: 'https://pixabay.com/get/52e7d0454d55a814f6da8c7dda793f7f1636dfe2564c704c7d2d7ddc9244c45f_340.jpg' },
  { name: 'Scampia Camp', image: 'https://pixabay.com/get/52e5d7414355ac14f6da8c7dda793f7f1636dfe2564c704c7d2d7ddc9244c45f_340.jpg' },
  { name: 'Torino Camp', image: 'https://pixabay.com/get/52e3d5404957a514f6da8c7dda793f7f1636dfe2564c704c7d2d7ddc9244c45f_340.jpg' },
  { name: 'Another Camp', image: 'https://pixabay.com/get/52e7d0454d55a814f6da8c7dda793f7f1636dfe2564c704c7d2d7ddc9244c45f_340.jpg' },
  { name: 'Scampia Camp', image: 'https://pixabay.com/get/52e5d7414355ac14f6da8c7dda793f7f1636dfe2564c704c7d2d7ddc9244c45f_340.jpg' },
  { name: 'Torino Camp', image: 'https://pixabay.com/get/52e3d5404957a514f6da8c7dda793f7f1636dfe2564c704c7d2d7ddc9244c45f_340.jpg' },
  { name: 'Another Camp', image: 'https://pixabay.com/get/52e7d0454d55a814f6da8c7dda793f7f1636dfe2564c704c7d2d7ddc9244c45f_340.jpg' },
  { name: 'Scampia Camp', image: 'https://pixabay.com/get/52e5d7414355ac14f6da8c7dda793f7f1636dfe2564c704c7d2d7ddc9244c45f_340.jpg' },
  { name: 'Torino Camp', image: 'https://pixabay.com/get/52e3d5404957a514f6da8c7dda793f7f1636dfe2564c704c7d2d7ddc9244c45f_340.jpg' },
  { name: 'Another Camp', image: 'https://pixabay.com/get/52e7d0454d55a814f6da8c7dda793f7f1636dfe2564c704c7d2d7ddc9244c45f_340.jpg' },
  { name: 'Scampia Camp', image: 'https://pixabay.com/get/52e5d7414355ac14f6da8c7dda793f7f1636dfe2564c704c7d2d7ddc9244c45f_340.jpg' },
  { name: 'Torino Camp', image: 'https://pixabay.com/get/52e3d5404957a514f6da8c7dda793f7f1636dfe2564c704c7d2d7ddc9244c45f_340.jpg' },
  { name: 'Another Camp', image: 'https://pixabay.com/get/52e7d0454d55a814f6da8c7dda793f7f1636dfe2564c704c7d2d7ddc9244c45f_340.jpg' },
  { name: 'Scampia Camp', image: 'https://pixabay.com/get/52e5d7414355ac14f6da8c7dda793f7f1636dfe2564c704c7d2d7ddc9244c45f_340.jpg' },
];

app.get('/', (req, res) => {
  res.render('landing');
});

app.get('/campgrounds', (req, res) => {

  res.render('campgrounds', { campgrounds })
});

app.post('/campgrounds', (req, res) => {
  const { name, image } = req.body;

  const newCampground = {
    name,
    image
  };
  campgrounds.push(newCampground);

  res.redirect('/campgrounds');
});

app.get('/campgrounds/new', (req, res) => {
  res.render('new');
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server started on ${port}`);
});