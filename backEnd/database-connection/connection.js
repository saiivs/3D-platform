const mongoose = require('mongoose')
mongoose.set('strictQuery', false);
require('dotenv').config();

mongoose.connect(process.env.DATABASE_CONNECTION).then(()=>{
    console.log("connection successfull");
}).catch((e)=>{
    console.log(e);
    console.log("connection to database is lost");
})