const express = require('express');
const router = express.Router();
const Post = require('../models/post');
const User = require('../models/user'); // 🔧 Needed for profile pic update
const multer = require('multer');
const path = require('path');
const { storage } = require('../routes/cloudinary');
const { cloudinary } = require('../routes/cloudinary'); // ✅ cloudinary.js is in backend folder

const upload = multer({ storage });
// 🗑️ DELETE a post by ID
router.delete('/delete/:postId', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // 🧹 Optional: Delete from Cloudinary if it's a Cloudinary image
    if (post.imageUrl && post.imageUrl.includes("res.cloudinary.com")) {
      try {
        const publicId = post.imageUrl
          .split('/')
          .slice(-1)[0]
          .split('.')[0]; // crude but works
        await cloudinary.uploader.destroy(publicId);
      } catch (cloudErr) {
        console.warn("Cloudinary delete failed:", cloudErr.message);
      }
    }

    await Post.findByIdAndDelete(req.params.postId);
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});


// 📝 2. Create a Post
// 📝 2. Create a Post
router.post('/create', upload.single('image'), async (req, res) => {
  try {
    const { userId, caption } = req.body;

    const newPost = new Post({
      userId,
      caption,
      imageUrl: req.file ? req.file.path : '' // ✅ use full URL from Cloudinary
    });

    const savedPost = await newPost.save();
    res.status(201).json({
      message: 'Post created successfully!',
      post: savedPost
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create post' });
  }
});



// ❤️ 3. Like / Unlike a Post
router.put('/like/:postId', async (req, res) => {
  try {
    const { userId } = req.body;
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    if (!post.likes.includes(userId)) {
      post.likes.push(userId);
    } else {
      post.likes = post.likes.filter(id => id !== userId);
    }

    await post.save();
    res.status(200).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error liking post' });
  }
});


// 💬 4. Comment on Post
router.post('/comment/:postId', async (req, res) => {
  try {
    const { userId, text } = req.body;
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    post.comments.push({ userId, text });
    await post.save();

    res.status(200).json({ message: 'Comment added!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to comment' });
  }
});


// 📰 5. Get All Posts (Feed)
router.get('/all', async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'username profilePic')         // post author info
      .populate('comments.userId', 'username profilePic'); // commenter info

    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load posts' });
  }
});

module.exports = router;
