import express from "express";
import { MongoClient, ServerApiVersion } from "mongodb";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

const app = express();
const setupMiddlewares = () => {
  app.use(express.json());

  // When type is not equal to module
  // Frontend Server
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  app.use(express.static(path.join(__dirname, "../build")));
  app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(__dirname, "../build/index.html"));
  });

  //export GOOGLE_APPLICATION_CREDENTIALS=<path>/credentials.json local
  app.use(async (req, res, next) => {
    const { authtoken } = req.headers;
    if (authtoken) {
      try {
        req.user = await admin.auth().verifyIdToken(authtoken);
      } catch (error) {
        console.log(error.message);
        return res.sendStatus(400);
      }
    }
    req.user = req.user || {};
    next();
  });

  app.use((req, res, next) => {
    if (req.user) next();
    else res.sendStatus(401);
  });
};

let db;
const connectDb = async () => {
  const uri = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_USERNAME}.h9cug.mongodb.net/?retryWrites=true&w=majority&appName=${process.env.MONGO_USERNAME}`;
  const connection = await new MongoClient(
    uri,
    {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    }
  ).connect();
  const database = process.env.MONGO_DB || 'react-blog-db';
  await connection.db(database).command({ ping: 1 });
  console.log("Pinged your deployment. You successfully connected to MongoDB!");
  return connection.db(database);
};

const setupRoutes = () => {
  app.get("/api/articles", async (req, res, next) => {
    const articles = await db.collection("articles").find().toArray();
    res.json(articles);
  });

  app.get("/api/articles/:name", async (req, res, next) => {
    const { name } = req.params;
    const { uid } = req.user;
    const article = await db.collection("articles").findOne({ name: name });
    if (article) {
      const upvoteIds = article.upvoteIds || [];
      article.canUpvote = uid && !upvoteIds.includes(uid);
      res.json(article);
    } else {
      res.sendStatus(404);
    }
  });

  app.put("/api/articles/:name/upvote", async (req, res) => {
    const { name } = req.params;
    const { uid } = req.user;
    const article = await db.collection("articles").findOne({ name: name });
    if (article) {
      const upvoteIds = article.upvoteIds || [];
      const canUpvote = uid && !upvoteIds.includes(uid);
      if (canUpvote) {
        await db.collection("articles").updateOne(
          { name: name },
          {
            $inc: { upvotes: 1 },
            $push: { upvoteIds: uid },
          },
        );
      }
      const updatedArticle = await db.collection("articles").findOne({ name });
      res.json(Object.assign(updatedArticle, { canUpvote }));
    } else res.send(`The article ${name} doesn't exist`);
  });

  app.post("/api/articles/:name/comments", async (req, res) => {
    const { name } = req.params;
    const { text } = req.body;
    const { email } = req.user;
    await db.collection("articles").updateOne(
      { name: name },
      {
        $push: { comments: { postedBy: email, text } },
      },
    );
    const article = await db.collection("articles").findOne({ name: name });
    if (article) {
      res.json(article);
    } else res.send(`The article ${name} doesn't exist`);
  });
};

const initFireBase = () => {
  const credentials = JSON.parse(fs.readFileSync("./credentials.json"));
  admin.initializeApp({
    credentials: admin.credential.cert(credentials),
  });
};

const startServer = async () => {
  db = await connectDb();
  initFireBase();
  setupMiddlewares();
  setupRoutes();
  const PORT = process.env.PORT || 8000; // This is for hosting
  app.listen(PORT, () => console.log(`Server is Listening on Port ${PORT}`));
};

startServer();
