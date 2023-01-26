// Setting Up the modules
const bodyParser = require("body-parser");
const formatedDate = require(__dirname + "/date.js");
const _ = require("lodash");

// Setting Up Express
const express = require("express");
const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

// Setting Up Mongoose dataBase with Atlas
const mongoose = require("mongoose");
mongoose.set("strictQuery",false)
const uri = "mongodb+srv://YeZawAung:FfRGVzFHt1C6c3yG@cluster0.pubzrqq.mongodb.net/toDoListDB";
mongoose.connect(uri);


// Creating a schema that will store "data" which is user input string
const itemSchema = {
    data : String
}
// Creating the mongoose model for the previous Schema
const Item = mongoose.model("item", itemSchema);


// Creating an another schema that will store the user provided route string(name) and tasks(items)
const listSchema = {
    name: String,
    items: [{type: itemSchema, ref: Item}]
}
// Creating mongoose model for the previous Schema
const List = mongoose.model("list", listSchema);


// Setting Up the the default items to display for the new Users

const item1 = new Item({
    data: "Hit + button to add a new task"
})
const item2 = new Item({
    data: "<--Hit checkbox to delete task"
})
const item3 = new Item({
    data: "Create a separate list by adding the list name in the url (e.g url/work)"
})
const defaultItems = [item1,item2, item3]

//main route get method
app.get("/", (req , res)=>{

    const today = formatedDate.getDate(); // getting date from self-made module "date.js"

    Item.count({}, (err,c)=>{ // check whether database is empty or not

        if(err){ // log error if error happens
            console.log("An error occured during counting");
        } else { // insert defaultItems if there is no error
            if(c === 0) {
                Item.insertMany(defaultItems,err=>{
                    if(err){
                        console.log("An error occured in inserting default items.");
                    } else {
                        console.log("Successfully inserted default items.");
                    }
                })
                
            }
        }
    });

    Item.find({}, (err,foundItems)=>{ //get items from Database
        if(err){
            console.log("An error occured during fetching data.");
        } else { // Render the layout("views/list.ejs") with the {date, foundItems}
            res.render("list", {today : today, items:foundItems});
        }
    })
})

//main route post method
app.post("/", (req, res)=>{
    let task = req.body.task; //get the user input string task
    let route = req.body.button; //get the value of route the user is using

    //Create a new item from Item model
    const item = new Item({
        data: task
    })

    //Check if user is in the main route("/")
    if(route == formatedDate.getDate()){
        item.save();
        res.redirect("/")
    } else { // if user is not in main route
        List.findOne({name: route}, (err,foundList)=>{ //find List with the name = user's route and add the task to respective list 
            if(!err){
                foundList.items.push(item);
                foundList.save();
                res.redirect("/" + route);
            }
        })
    }
})

// delete tasks from respective routes
app.post("/delete/:route",(req,res)=>{
    //get the id of the item user want to create
    const deleteItemId = req.body.checkbox;
    //get the route user is currently using
    const route = req.params.route;

    //check if the route is main route("/")
    if(route == formatedDate.getDate()){
        Item.findByIdAndRemove({_id:deleteItemId},(err)=>{ // find the id and delete
            if(!err){
                console.log("finished")
            }
        })
        res.redirect("/"); //redirect to the main route
    } else { // if user is not in main route("/")
        List.findOneAndUpdate({name:route}, {$pull:{items : {_id: deleteItemId}}},(err)=>{ // find the list with name = user's route and pull the item with the same id from item array
            if(err){
                console.log(err);
            }
        })
        res.redirect("/"+route); // redirect to the route user is using
    }
})

// Custom routes
app.get("/:route", (req,res)=>{
    // get the route user is using
    const route = _.capitalize(req.params.route);
    List.findOne({name:route},(err,foundLists)=>{ // check if the user has already used the same route already
        if(!err){

            if(!foundLists){ // if the route is new, add the defaultItems and redirect to the same route
                const list = new List({
                    name: route,
                    items: defaultItems
                })
                list.save();
                res.redirect("/"+route);
            } else { // if the user has already used this route, render the layout("views/list.ejs") with respective data
                res.render("list",{today:route, items:foundLists.items})
            }
            
        }
    })
})

//create server with port 3000
app.listen(3000,()=>{
    console.log("Server is running in port 3000");
})
