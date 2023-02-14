const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const collectSchema = new Schema({
    filePath:{
        type:String,
    },
    fileName:{
        type:String
    },
    fileCreateAt:{
        type:String,
    },
    fileUrl:{
        type:String
    },
    account:{
        type:String
    },
    collectName:{
        type:String
    }
    
})
module.exports = mongoose.model('collectDb',collectSchema);