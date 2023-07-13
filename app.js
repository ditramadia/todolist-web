const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/todolistDB", {useNewUrlParser: true});

const itemSchema = {
    name: String
};
const Item = mongoose.model("Item", itemSchema);

const listSchema = {
    name: String,
    items: [itemSchema]
}
const List = mongoose.model("List", listSchema);


function addDefaultItems() {
    const item1 = new Item({
        name: "Welcome to your todo list!"
    });
    const item2 = new Item({
        name: "Hit the + button to add a new item."
    });
    const item3 = new Item({
        name: "<-- Hit this to delete."
    });
    
    return [item1, item2, item3];
};

app.get("/", async function(req, res) {
    const items = await Item.find({});
    if (items.length === 0) {
        Item.insertMany(addDefaultItems()).then(() => {
            console.log("Data inserted");
        });
        res.redirect("/");
    } else {
        res.render("list", {listTitle: "Today", newListItems: items});
    }
});

app.post("/", async function(req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const newItem = new Item({
        name: itemName
    });

    if (listName === "Today") {
        newItem.save();
        res.redirect("/");
    } else {
        const foundList = await List.findOne({name: listName});
        foundList.items.push(newItem);
        foundList.save();
        res.redirect("/" + listName);
    }
});

app.post("/delete", async function(req, res) {
    const listName = req.body.listName;
    const todoId =  req.body.checkbox;

    if (listName === "Today") {
        await Item.deleteOne({_id: todoId});
        res.redirect("/");
    } else {
        await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: todoId}}});
        res.redirect("/" + listName);
    }

});

app.get("/:customListName", async function(req, res) {
    const customListName = _.capitalize(req.params.customListName);
    const flag = await List.exists({name: customListName});
    if (flag === null) {
        const list = new List({
            name: customListName,
            items: addDefaultItems()
            });
        list.save();
        res.redirect("/:customListName");
    } else {
        const list = await List.findOne({name: customListName});
        res.render("list", {listTitle: customListName, newListItems: list.items});
    }
});

app.get("/about", (req, res) => {
    res.render("about");
})

app.listen(3000, () => {
    console.log("Server started on port 3000");
});