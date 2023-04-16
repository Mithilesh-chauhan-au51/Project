
let express = require("express")
const session = require('express-session');
const cookie_parser = require('cookie-parser');
const nodemailer = require('nodemailer');
const randomstring = require('randomstring');


let router = express.Router()
const fileupload=require("express-fileupload")
router.use(fileupload())


const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SECRET_KEY = "NOTESAPI"


let document = require("../models/schema")
let sliderdoc = require("../models/slider")
let services = require("../models/service")
let feedbackdoc = require("../models/feedback")
let registerdoc = require("../models/register")
let achdoc = require("../models/achievement")
let bookappodoc = require("../models/book-app")
// admin section
let adminnavdoc = require("../models/adminnavschema")


//mail and password
const mail = process.env['mail']
var password = process.env['password']
//console.log(mail,password)


router.use(cookie_parser())
router.use(session({
  secret: 'SECRET_KEY',
  resave: false,
  saveUninitialized: true,

}));


//express in built middle wear
router.use(express.json())


//creating register page
router.get('/', (req, res) => {
  res.render("register");

});


//check register
router.post("/", async (req, res) => {
  const { username, email, password } = req.body
  //console.log(username,email,password)
  try {
    //check existing user
    const existuser = await registerdoc.find({ email: email })
    // console.log(existuser)
    if (existuser.length > 0) {
      return res.status(400).json({ message: "user already exist" })
    }
    //hasing the password (10 called salt)
    const hashedpassword = await bcrypt.hash(password, 10)
    //user creating
    const createentry = new registerdoc({
      email: email,
      username: username,
      password: hashedpassword,

    })
    await createentry.save()
    //create token
    const token = jwt.sign({ email: createentry.email, id: createentry._id }, SECRET_KEY)
    res.status(200).redirect("/login")
  }
  catch (err) {
    console.log(err)
    res.status(200).redirect("/")
    res.status(500).json({ message: "somenthing went wrong" })
  }
})




//creating login page
router.get('/login', (req, res) => {
  res.render("login");

});



//authentication function
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    // User is authenticated, call the next middleware function
    return next();
  } else {
    // User is not authenticated, redirect to the login page
    res.redirect('/login');
  }
}




const transporter = nodemailer.createTransport({
  
  service: 'gmail',
  auth: {
    user: mail,
    pass: password
  }
});



// Generate OTP
function generateOTP() {
  const otp = randomstring.generate({
    length: 4,
    charset: 'numeric'
  });
  return otp;
}


// Send OTP to user's email
function sendOTP(email, otp) {
  //console.log(mail)
  const mailOptions = {
    from: mail,
    to: email,
    subject: 'Password change OTP',
    text: `Your OTP for changing password is ${otp}`
  };
  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.log(err);
     } 
      //else {
    //   console.log(`OTP sent to ${email}: ${otp}`);
    // }
  });
}

//render otpform page
router.get('/send-otp', (req, res) => {
  res.render("sendotp")
})

//generate otp
router.post('/send-otp', (req, res) => {
  const email = req.body.email;
  const otp = generateOTP();
  sendOTP(email, otp);
  req.session.email = email;
  req.session.otp = otp;
  res.redirect('/verify-otp');
});


//render verify otp page
router.get('/verify-otp', (req, res) => {
  res.render("verfiotp")
})


//verify otp
router.post('/verify-otp', (req, res) => {
  const otp = req.body.otp;
  if (otp === req.session.otp) {
    // OTP matched, allow password change
    req.session.verified = true;
    res.redirect('/change-password');
  } else {
    // OTP did not match, ask user to try again
    res.render('verfiotp', { error: 'Invalid OTP' });
  }
});


//get cahnge password form
router.get('/change-password', (req, res) => {
  res.render("changepassword")
})


// Route for changing password
router.post('/change-password',async (req, res) => {
try{
const email = req.session.email;
  const password = req.body.password;
  //console.log(password)
 const hashedpassword = await bcrypt.hash(password, 10)
   const user = await registerdoc.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.password = hashedpassword;
    await user.save();
  req.session.email = null;
  req.session.otp = null;
  req.session.verified = null;
  res.redirect('/login');
}
  catch (err) {
    console.log(err)
    res.status(200).redirect("/")
    res.status(500).json({ message: "somenthing went wrong" })
  }
});




//check login
router.post("/login", async (req, res) => {
  req.session.user = req.body
  req.session.save()
  const { email, password } = req.body
  // console.log(username,password)
  try {
    const existuser = await registerdoc.find({ email: email })
    let existemail = existuser[0].email
    let admin = existuser[0].role
    //console.log(email)  
    req.session.user = existemail;
    req.session.role = admin;
    req.session.save()
    if (existuser.length == 0) {
      return res.status(404).json({ message: "user not found" })
    }
    const matchpassword = await bcrypt.compare(password, existuser[0].password)
    if (!matchpassword) {
      return res.status(400).json({ message: "wrong password" })
    }
 const token = jwt.sign({ email: existuser.email, id: existuser._id }, SECRET_KEY)
    res.status(200).redirect("/home")
  }
  catch (err) {
    console.log(err)
    res.status(500).json({ message: "wrong register-email or password" })
  }
})




//logout
router.get("/home/logout", (req, res) => {
  res.clearCookie('session')
  req.session.destroy()
  // console.log("user loged out")
  
  res.redirect('/login');
});


// add services by admin
 router.get("/addServices", isAuthenticated, async (req, res) => {
  res.render("addservice")
 })


//admin can add achievements
router.post("/addServices", isAuthenticated, async (req, res) => {
     try {
        const subtitle = req.body.subtitle;
  const title = req.body.title;
  const img = req.files.url;
        img.mv("public/images/" + img.name)
 //console.log(img.name)
   let  serdataentry = new services({
      url:"/images/"+img.name,
      title:title,
      subtitle:subtitle
      
    });
         await serdataentry.save()
       res.status(200).redirect("/home") 
     } 
     catch (e) {
    console.log(e.message)
    res.status(500).redirect("/home")
  }
})



//creating user home page
router.get("/home", isAuthenticated, async (req, res) => {
  try {
    if(req.session.role=="admin"){
      var navbar=await adminnavdoc.find({"_id":"6437b78ff3284e59a286800a"}) //6437b78ff3284e59a286800a     64304ffde15cbed30ec8e81f
    }
    else {
   var  navbar = await document.find({ "_id": "64394ec0703b77d5be88149c" }) //64394ec0703b77d5be88149c    6425912e18d06441716f6ddf
    }
    //console.log(navbar[0].logo)
    let sliderdata = await sliderdoc.find();
    // console.log(sliderdata)
    let servicedata = await services.find();


    res.render("index", { data: navbar, sliderdata: sliderdata, servicedata: servicedata })
  }
  catch (err) { console.log(err) }
})




//show acheviments to user
router.get("/home/achievements", isAuthenticated, async (req, res) => {
  try {
    let navbar = await document.find({ "_id": "64394ec0703b77d5be88149c" })  //64394ec0703b77d5be88149c     6425912e18d06441716f6ddf
    //console.log(navbar[0].logo)
    let achdata = await achdoc.find()

    res.render("achievements", { data: navbar, achdata: achdata })
  }
  catch (err) { console.log(err) }
})



//admin add achievement
 router.get("/addAchievements", isAuthenticated, async (req, res) => {
  res.render("addachievements")
 })
//admin can add achievements
router.post("/addAchievements", isAuthenticated, async (req, res) => {
     try {
        const subtitle = req.body.subtitle;
  const title = req.body.title;
  const img = req.files.url;
        img.mv("public/achimages/" + img.name)
// console.log(img.name)
   let  achdataentry = new achdoc({
      url:"/achimages/"+img.name,
      title:title,
      subtitle:subtitle
      
    });
         await achdataentry.save()
       res.status(200).redirect("/home") 
     } 
     catch (e) {
    console.log(e.message)
    res.status(500).redirect("/home")
  }
})



// feedback render

router.get("/usersubmit", isAuthenticated, async (req, res) => {
  let sessionemail = req.session.user
  res.render("feedback", { email: sessionemail })
})

//feed back
router.post("/usersubmit", isAuthenticated, async (req, res) => {
  
  let email = req.body.email
  let phone = req.body.phone
  let fb = req.body.feedback
  //console.log(email,query,phone)
  try {
    let feedbackentry = new feedbackdoc({
      email: email,
      phone: phone,
      feedback: fb
    })
    await feedbackentry.save()
    res.status(200).redirect("/home")
  }
  catch (e) {
    console.log(e.message)
    res.status(500).redirect("/home")
  }
})


//render all feed backs
router.get("/seefeedback",isAuthenticated,async(req,res)=>{
  try {
    let feedbackdata=await feedbackdoc.find()
    res.render("seefeedback",{feeddata:feedbackdata})      
  }
  catch (e) {
    console.log(e.message)
    res.status(500).redirect("/home")
  }
})



//get appointment form 
router.get("/make-appointments", isAuthenticated, async (req, res) => {
  let sessionemail = req.session.user
  res.render("makeAppo", { email: sessionemail })
})



//post appointmentdata 
router.post("/make-appointments", isAuthenticated, async (req, res) => {
  let { firstname, lastname, email, phonenumber, date, time, address, city, state, service } = req.body
  //console.log(phonenumber, date, time)
  try {
    const bookentry = new bookappodoc({
      email: email,
      firstname: firstname,
      lastname: lastname,
      phone: phonenumber,
      appointmentDate: date,
      appointmentTime: time,
      address: address,
      city: city,
      state: state,
      service: service
    })

    const existingdata = await bookappodoc.find({ appointmentDate: date });
    let c = []
    for (let ele of existingdata) {
      c.push(ele.appointmentTime)
    }
    // console.log(c)
    const existingTimeSlot = await bookappodoc.findOne({ appointmentDate: date, appointmentTime: time });
    if (existingTimeSlot) {   
      res.render("msg", { arr: c, date: date, time: time })
    }

    else {
      await bookentry.save()
      res.status(200).redirect("/home/our-appointments")
    }
  }
  catch (err) {
    console.log(err)
    res.status(200).redirect("/")
    res.status(500).json({ message: "somenthing went wrong" })
  }
})




//get our appointments
router.get("/home/our-appointments", isAuthenticated, async (req, res) => {
  try {
    if(req.session.role=="admin"){
       var navbar=await adminnavdoc.find({"_id":"6437b78ff3284e59a286800a"})
      let appofulldata = await bookappodoc.find()
    
    res.render("ourAppo", {data: navbar,appodata: appofulldata,admin:true })
    }
    else{
       let navbar = await document.find({ "_id": "64394ec0703b77d5be88149c" })
    //console.log(req.session.user)
    let sessionemail = req.session.user
    let appodata = await bookappodoc.find({ email: sessionemail })
    // console.log(appodata)
    res.render("ourAppo", { data: navbar, appodata: appodata,disabled:"disabled",admin:false})
    }
  }
  catch (err) { console.log(err) }

})



//delete appointment
router.get("/:id",getbyid,isAuthenticated,async (req, res) => {
  try{
    await res.entry.deleteOne()
   res.status(200).redirect("/home/our-appointments")
    
  }
  catch(err){
    res.status(500).json({message:err.message})
  }
  
});



async function getbyid(req,res,next){
  let entry
  try{
    entry=await bookappodoc.findById(req.params.id)
    if(entry==null){
      return res.status(400).json({message:"canot find id"})
    }
  }
  catch(err){
    return res.status(500).json({message:err.message})
  }
  
  res.entry=entry
  next()
  
}













//here we hardcode and send the navbar data to database because here no need any userinteraction to nav bar so we hard code it
//run below function for once to push data
// async function run(){
//   try{
//     let navbar=new document ({
//       companyname:"The Barber Shop",
//   logo:"https://thumbs.dreamstime.com/z/barber-shop-logo-label-retro-illustration-design-suitable-product-cover-labels-banner-print-etc-144595135.jpg",
//   link:[{
//     label:"Home",
//     url:"/Home"
//   },
//         {
//           label:"Achievements",
//           url:"/home/achievements"
//         },
//         {
//           label:"Services",
//           url:"/Home"
//         },
//         {
//           label:"My-Appointment",
//           url:"/home/our-appointments"
//         },
//         {
//           label:"Feedback",
//           url:"/usersubmit"
//         },
//         {
//           label:"Make-Appointment",
//           url:"/make-appointment"
//          },
//         {
//          label:"Logout",
//          url:"/logout"
//         }
//        ]
//     })
//     await navbar.save()
//    console.log(navbar)
//   }
//   catch(e){
//      console.log(e.message)
//    }
// }
// run()


//this is for send sliderdata to db no need to user intercation so hard code it

// async function run(){
//   try{
//    let sliderdata=new sliderdoc(
//  {
//  title:"We Are waiting for Angels.",
//  subtitle:"Invest in your hair, it's the crown you never take off.",
//    url:"https://m.media-amazon.com/images/I/71hSIkIgadL._AC_UF350,350_QL80_.jpg"   
// }

//      )
//    await sliderdata.save()
//          let sliderData = await sliderdoc.find();
//  console.log(sliderData);
 
// //  this two lines is for checking


//   }
//   catch(e){
//      console.log(e.message)
//    }
// }
// run()

//   {
//       title:"our shop is open",
//       subtitle:"Looking good isn't self-importance, it's self-respect.",
//       url:"https://png.pngtree.com/png-clipart/20190611/original/pngtree-cartoons-depicting-barber-png-image_2820272.jpg"
//     }
// {
//   title:"Comfortable,Relaxing,Invigorating. ",
//     subtitle:"Come take your rightful place on our throne",
//     url:"/images/pic2.jpg"    
//  }
//  {
//  title:"we are witing for angels ",
//  subtitle:"Invest in your hair, it's the crown you never take off.",
//    url:"https://m.media-amazon.com/images/I/71hSIkIgadL._AC_UF350,350_QL80_.jpg" 
// }

// above function send this two object also one by one for once it can save only one object


//push service data
// async function run(){
//   try{
//     let servicedata=new services({
//       url:"https://i0.wp.com/www.weddingforward.com/wp-content/uploads/2022/07/indian-bridal-makeup-main-image.jpg?fit=313%2C500&ssl=1",
//       title:"Bridal packages",
//       subtitle:"Provide special packages for brides-to-be that include hair and makeup services for their wedding day."   
//     })
//    await servicedata.save()
//       let sliderData = await sliderdoc.find();
// console.log(servicedata);

// // this two lines is for checking

//     }
//   catch(e){
//      console.log(e.message)
//    }
// }
// run()

// above i insert 6 different service data see in database in service tabel

//     let servicedata=new services({
//       url:"/images/service6.jpg",
//       title:"Bridal packages",
//       subtitle:" Provide special packages for brides-to-be that include hair and makeup services for their wedding day."   
//     })



// push achievement data
// async function run(){
//   try{
//     let achdata=new achdoc({
//       url:"https://i.pinimg.com/originals/7c/ad/cb/7cadcb26acbbcf50fbc3e8d2c4016359.jpg",
//       title:"Trendy Haircuts for the Cool Kids",
//       subtitle:"A child's hair is a reflection of their innocence and joy."
//     })
//    await achdata.save()
//       let sliderData = await sliderdoc.find();
//    console.log(achdata);

// // this two lines is for checking
//     }
//   catch(e){
//      console.log(e.message)
//    }
// }
// run()











module.exports = router;