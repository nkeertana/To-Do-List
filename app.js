//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your To-Do list!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item"
});

const item3 = new Item({
  name: "<--- Hit this to delete an item"
});
const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};
const List = mongoose.model("List", listSchema);



app.get("/", function(req, res) {

 Item.find({}, function(err, foundItems){
   
  if(foundItems.length === 0) {
    Item.insertMany(defaultItems, function(err){
      if (err) {
        console.log(err);
      } else {
        console.log("successfully saved default items to DB");
      }
    });  
    res.redirect("/");  

  } else {
    res.render("list", {listTitle: "Today", newListItems: foundItems});
  }

 });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item ({
    name: itemName
  });
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function (err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    })
  }


 
});

app.post("/delete", function (req, res){
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today")  {
    Item.findByIdAndRemove(checkedItemID, function(err){
      if (!err) {
        console.log("successfully deleted the checked");
        res.redirect("/");
      } else {
        console.log("was not successful");
      }
    }); 
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemID}}}, function (err, foundList){
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }


  
});

app.get("/:custom", function(req, res){
  console.log(req.params.custom);
  const pageTitle = _.capitalize(req.params.custom);

  List.findOne({name: pageTitle}, function(err, foundList){
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: pageTitle,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + pageTitle);
      } else {
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  })


});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
