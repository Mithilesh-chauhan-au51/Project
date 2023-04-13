let mongoose=require("mongoose")


//sliders schema
let sliderschema=new mongoose.Schema({
    title:String,
   subtitle:String,
  url:String,
})


module.exports=mongoose.model("sliders",sliderschema)