const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const userSchema = new Schema({
    openId:{
        type:String,
    },
    userInfo:{
        type:Object
    },
    
})
module.exports = mongoose.model('userDb',userSchema);