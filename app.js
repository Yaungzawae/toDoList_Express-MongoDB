// Setting Up the modules
const bodyParser = require("body-parser");
const formatedDate = require(__dirname + "/date.js");
const _ = require("lodash");

const express = require("express");
const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

const mongoose = require("mongoose");
mongoose.set("strictQuery",false)
const uri = "mongodb://0.0.0.0:27017/toDoListDB";
mongoose.connect(uri);

const itemSchema = {
    data : String
}

const Item = mongoose.model("item", itemSchema);

const item1 = new Item({
    data: "Welcome"
})

const item2 = new Item({
    data: "Hit + button to add a new task"
})

const item3 = new Item({
    data: "<--Hit checkbox to delete task"
})

const listSchema = {
    name: String,
    items: [{type: itemSchema, ref: Item}]
}

const List = mongoose.model("list", listSchema);

const defaultItems = [item1,item2, item3]
// Item.insertMany(defaultItems,err=>{
//     if(err){
//         console.log("An error occured in inserting default items.");
//     } else {
//         console.log("Successfully inserted default items.");
//     }
// })

//new task data storage
const data = [];

//main route get method
app.get("/", (req , res)=>{
    const today = formatedDate.getDate();
    Item.count({}, (err,c)=>{
        if(err){
            console.log("An error occured during counting");
        } else {
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

    Item.find({}, (err,items)=>{
        if(err){
            console.log("An error occured during fetching data.");
        } else {
            res.render("list", {today : today, items:items});
        }
    })
})

//main route post method
app.post("/", (req, res)=>{
    let task = req.body.task;
    let route = req.body.button;
    const item = new Item({
        data: task
    })
    if(route == formatedDate.getDate()){
        item.save();
        res.redirect("/")
    } else {
        List.findOne({name: route}, (err,foundList)=>{
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
    const deleteItemId = req.body.checkbox;
    const route = req.params.route;
    if(route == formatedDate.getDate()){
        Item.findByIdAndRemove({_id:deleteItemId},(err)=>{
            if(!err){
                console.log("finished")
            }
        })
        res.redirect("/");
    } else {
        List.findOneAndUpdate({name:route}, {$pull:{items : {_id: deleteItemId}}},(err)=>{
            if(err){
                console.log(err);
            }
        })
        res.redirect("/"+route);
    }
})

// Custom routes
app.get("/:field", (req,res)=>{
    const field = _.capitalize(req.params.field);
    List.findOne({name:field},(err,foundLists)=>{
        if(!err){
            if(!foundLists){
                const list = new List({
                    name: field,
                    items: defaultItems
                })
                list.save();
                res.redirect("/"+field);
            } else {
                // res.send(foundLists.items);
                res.render("list",{today:field, items:foundLists.items})
            }
        }
    })
    console.log(field)
})
//create server
app.listen(3000,()=>{
    console.log("Server is running in port 3000");
})
