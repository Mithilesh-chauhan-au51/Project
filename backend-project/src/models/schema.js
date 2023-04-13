 let mongoose=require("mongoose")


// user nav bar schema
let schema=new mongoose.Schema({
  companyname:String,
  logo:String,
  link:[{
    label:String,
    url:String,
  }]//here ther is multiple links hence we put in array
})



















module.exports=mongoose.model("navbars",schema)