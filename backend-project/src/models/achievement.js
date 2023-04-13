let mongoose=require("mongoose")

//achievement schema

let achschema=new mongoose.Schema({
    url:String,
    title:String,
    subtitle:String   
})


module.exports=mongoose.model("achievements",achschema)