const express = require("express");
const app = express();

const methodOverride = require("method-override");
const mongoose = require("mongoose");
const path = require("path");

const Post = require("./modals/post");
const expressError = require("./utils/expressError");
const wrapAsync = require("./utils/wrapAsync");

const port = 8080;



// Parse form data
app.use(express.urlencoded({ extended: true }));

// Enable PATCH and DELETE requests
app.use(methodOverride("_method"));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));


// View Engine Setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


// MongoDB Connection
mongoose
  .connect("mongodb://127.0.0.1:27017/threadPosts")
  .then(() => {
    console.log("Database Connected!");
  })
  .catch((err) => {
    console.log(err);
  });


// Home Route
app.get("/", (req, res) => {
  res.redirect("/posts");
});


// GET Route - Show All Posts
app.get(
  "/posts",
  wrapAsync(async (req, res) => {
    let posts = await Post.find();

    res.render("index.ejs", { posts });
  })
);

// GET Route - New Post Form
app.get("/post/new", (req, res) => {
  res.render("new.ejs");
});


// POST Route - Create New Post
app.post(
  "/posts",
  wrapAsync(async (req, res) => {
    let { username, content } = req.body;

    // Basic Validation
    if (!username || !content) {
      throw new expressError(
        400,
        "Username and Content are required"
      );
    }

    let newPost = new Post({
      username,
      content,
    });

    await newPost.save();

    res.redirect("/posts");
  })
);


// GET Route - Show Single Post
app.get(
  "/posts/:id",
  wrapAsync(async (req, res) => {
    let { id } = req.params;

    let post = await Post.findById(id);

    if (!post) {
      throw new expressError(
        404,
        "Post Not Found"
      );
    }

    res.render("show.ejs", { post });
  })
);


// GET Route - Edit Form
app.get(
  "/posts/:id/edit",
  wrapAsync(async (req, res) => {
    let { id } = req.params;

    let post = await Post.findById(id);

    if (!post) {
      throw new expressError(
        404,
        "Post Not Found"
      );
    }

    res.render("edit.ejs", { post });
  })
);


// PATCH Route - Update Post
app.patch(
  "/posts/:id",
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    let { content } = req.body;

    let updatedPost =
      await Post.findByIdAndUpdate(
        id,
        { content },
        { new: true }
      );

    if (!updatedPost) {
      throw new expressError(
        404,
        "Post Not Found"
      );
    }

    res.redirect("/posts");
  })
);


// DELETE Route - Delete Post
app.delete(
  "/posts/:id",
  wrapAsync(async (req, res) => {
    let { id } = req.params;

    let deletedPost =
      await Post.findByIdAndDelete(id);

    if (!deletedPost) {
      throw new expressError(
        404,
        "Post Not Found"
      );
    }

    res.redirect("/posts");
  })
);

// 404 Middleware
app.use((req, res, next) => {
  next(
    new expressError(
      404,
      "Page Not Found"
    )
  );
});


// Global Error Middleware
app.use((err, req, res, next) => {
  let {
    statusCode = 500,
    message = "Something Went Wrong",
  } = err;

  res.status(statusCode).send(message);
});


// Server
app.listen(port, () => {
  console.log(
    `Server is listening on port ${port}`
  );
});