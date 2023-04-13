const mongoose = require("mongoose");



const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};


// register user schema
const registerschema = new mongoose.Schema({
  username: {
    type: String,
    lowercase: true,
  }, 
   email:{
    type:String,
    required:true,
    lowercase:true,
    maxLength:60,
    minLength:5,
    validate:{
      validator:(v)=>validateEmail(v),
      message:props=>`${ props.value}is not mail`
    }
  }, 
  password:{
    type: String,
    required:true},
  role: { type: String,
         enum: ['user', 'admin'], 
         default: 'user' }
 
  
});



module.exports = mongoose.model("register", registerschema);