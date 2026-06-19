const express = require("express");
const app = express();

const methodOverride = require("method-override");
const mongoose = require("mongoose");
const path = require("path");

const Post = require("./modals/post");
const expressError = require("./utils/expressError");
const wrapAsync = require("./utils/wrapAsync");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./modals/user.js")
const flash = require("connect-flash");

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

const sessionOptions = {
    secret: "mySuperSecretCode",
    resave: false,
    saveUninitialized: false,
};

app.use(session(sessionOptions));

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());

passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.currUser = req.user;
    next();
});

app.use((req,res,next) =>{
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");

  res.locals.currUser = req.user;
  next();
})

app.get("/signup",(req,res)=>{
  res.render("users/signup.ejs")
})


app.post("/signup", wrapAsync(async (req, res, next) => {

    let { username, password, email } = req.body;

    const newUser = new User({
        username,
        email
    });

    const registeredUser = await User.register(
        newUser,
        password
    );

    req.login(registeredUser, (err) => {

        if (err) {
            return next(err);
        }
        req.flash("success","Welcome To Mini Thread App")

        return res.redirect("/posts");
    });

}));

app.get("/login",(req,res) =>{
  res.render("users/login.ejs")
})

app.post("/login",passport.authenticate("local",{failureRedirect:"/login"}),(req,res)=>{
    console.log("Login Successful");
      req.flash("success","Welcome Back to Mini Thread App")
      res.redirect("/posts");

    }
);


app.get("/logout",(req,res,next)=>{
    req.logout((err)=>{
        if(err){
            return next(err);
        }
        req.flash("success","You Logged Out Successfully!")
        res.redirect("/posts");

    });

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
    req.flash("success","New Post Added Sucsessfully")

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
    req.flash("success","Post Updated")
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
    req.flash("success","Post Deleted")
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