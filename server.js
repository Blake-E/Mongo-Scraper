var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");
var db = require("./models");

var PORT = 8080;

var app = express();

app.use(logger("dev"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

var exphbs = require("express-handlebars");
app.engine("handlebars", exphbs({defaultLayout: "main"}));
app.set("view engine", "handlebars");

app.use(express.static("public"));

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongodbscraper3";

mongoose.connect(MONGODB_URI, {useNewUrlParser: true});

app.get("/scrape", function(req, res) {
  axios.get("https://www.investmentnews.com/section/news").then(function(response) {
    var $ = cheerio.load(response.data);
    
    $(".listingItem").each(function(i, element) {
      var result = {};
      result.title = $(element)
        .children("a")
        .find(".title")
        .text().trim();
      result.link = $(element)
        .children("a")
        .attr("href");
      result.imageLink = $(element)
        .children("a")
        .children(".listingImage")
        .attr("src")

      result.summary = $(element)
        .children("a")
        .children("summary")
        .children("h3")
        .children("a")
        .find(".title")
        .text().trim();

      console.log(result);
    });
    res.send("Scrape Complete");
  });
});

app.get("/articles", function(req, res) {
  db.Article.find({})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.get("/articles/:id", function(req, res) {
  db.Article.findOne({ _id: req.params.id })
    .populate("note")
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.post("/articles/:id", function(req, res) {
  db.Note.create(req.body)
    .then(function(dbNote) {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});