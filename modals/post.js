const mongoose = require('mongoose');
const Schema =  mongoose.Schema;

const threadPost = new Schema({
    username:{
        type:String,
        required:true,
    },
    content:{
        type:String,
        required:true
    },
});

const Post = mongoose.model("Post",threadPost);
module.exports = Post;


// const postSchema = new mongoose.Schema({
//     username:{
//         type:String,
//         required:true,
//     },
//     content:{
//         type:String,
//         required:true,
//     },
// });

// const Post = mongoose.model("Post",postSchema);
// module.exports = Post;