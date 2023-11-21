// Add Expres
const express = require("express");
const bodyParser = require("body-parser");
const { MongoClient, ServerApiVersion } = require("mongodb");

// Initialize Express
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
require("dotenv").config();
const uri = process.env.MONGODB_URI;
console.log(uri);
async function connect_to_db() {
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
  await client.connect();
  const dbName = "get-cookbook-cluster";
  const collectionName = "recipes";

  const database = client.db(dbName);
  const collection = database.collection(collectionName);
  return [database, collection];
}

const connectMiddleware = async (req, res, next) => {
  const [db, col] = await connect_to_db();
  req.db = db;
  req.collection = col;
  next();
};

app.post("/make_a_recipe", connectMiddleware, async (req, res) => {
  const recipe = req.body;
  try {
    const result = await req.collection.insertOne(recipe);
    res.sendStatus(200); // 200 OK
  } catch (e) {
    res.sendStatus(500); // 500 internal server error
    console.log(e);
  }
});

app.get("/get_all_recipes", connectMiddleware, async (req, res) => {
  try {
    const result = await req.collection.find({}).toArray();
    res.json(result);
  } catch (e) {
    res.sendStatus(500);
    console.log(e);
  }
});

app.get("/get_recipes_per_user", connectMiddleware, async (req, res) => {
  const user = req.query.user_id;
  try {
    const result = await req.collection
      .find({ created_by_user_id: user })
      .toArray();
    res.json(result);
  } catch (e) {
    res.sendStatus(500);
    console.log(e);
  }
});

app.post("/search_ingredients", connectMiddleware, async (req, res) => {
  const search_term = req.body.searchTerm;
  const regex = new RegExp(search_term);
  const collection = req.db.collection("ingredients");

  const result = await collection.find({ name: { $regex: regex } }).toArray();

  res.json(result);
});

app.get("/", (req, res) => {
  res.send("You've reached the API for Get Cookbook!");
});

// Initialize server
app.listen(6000, () => {
  console.log("Running on port 6000.");
});

// export it so that it can be recognised by vercel's serverless function
module.exports = app;
