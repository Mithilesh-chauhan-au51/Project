const express = require("express")
const app = express()

let mongoose = require("mongoose")

const bodyParser = require('body-parser');

const username = process.env['MONGO_USERNAME']
const password = process.env['MONGO_PASSWORD']

let db = mongoose.connect(`mongodb+srv://${'mithilesh_chauhan'}:${'Mithiatlas%407'}@cluster0.1koergc.mongodb.net/test?retryWrites=true&w=majority`, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => { console.log("db connected sucessfully") }).catch((err) => { console.log(`err`, err.message) })


const ejs = require("ejs")
app.set("view engine", "ejs")

app.use(express.static(__dirname + "/public"))//dirname used when we are in parallel folder(here index and public is parlel)


app.use(bodyParser.urlencoded({ extended: true }));



let routersuser = require("./src/routers/user")
app.use("", routersuser)//we not assign endpont default it take first "/" is end point






app.listen(4040, () => { console.log("app run on port 4040") })