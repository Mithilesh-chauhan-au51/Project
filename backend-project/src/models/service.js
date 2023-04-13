let mongoose=require("mongoose")


//service section schema
let sliderschema=new mongoose.Schema({
    url:String,
    title:String,
    subtitle:String   
})


module.exports=mongoose.model("service",sliderschema)