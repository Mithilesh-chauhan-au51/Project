let mongoose=require("mongoose")



// email validation function
  const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

//book appointment schema
let bookappo=new mongoose.Schema({
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
  phone:{
    type:Number,
    minLength:10
    
  },
  firstname:String,
  lastname:String,
 appointmentDate: {
    type: Date,
    required: true
  },
  
  appointmentTime: {
    type: String,
    required: true
   
  },
  address:String,
  address2:String,
  
  city:String,
  state:String,
  service:String
  
  })





module.exports=mongoose.model("bookappo",bookappo)