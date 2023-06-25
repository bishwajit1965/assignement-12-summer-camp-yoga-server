const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
// const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const { ObjectId } = require("mongodb");

// Middlewares
app.use(cors());
// const corsConfig = {
//   origin: "",
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "DELETE"],
// };
// app.use(cors(corsConfig));
// app.options("", cors(corsConfig));
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "Unauthorized access attempt !!!" });
  }
  // bearer token
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ err: true, message: "Unauthorized access attempt !!!" });
    }
    req.decoded = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.l3p6wcn.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // CODE BELOW
    const galleryCollection = client
      .db("summer-camp-yoga")
      .collection("gallery");
    const usersCollection = client.db("summer-camp-yoga").collection("users");
    const yogaClassesCollection = client
      .db("summer-camp-yoga")
      .collection("classes");
    const instructorsCollection = client
      .db("summer-camp-yoga")
      .collection("instructors");

    // JWT token to make the site secure
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const jwtToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ jwtToken });
    });

    // Classes APIs
    app.post("/classes", async (req, res) => {
      const yogaClass = req.body;
      const result = await yogaClassesCollection.insertOne(yogaClass);
      res.send(result);
    });

    app.get("/classes", async (req, res) => {
      const result = await yogaClassesCollection.find().toArray();
      const sortedClasses = result.sort(
        (a, b) => b.enrolledStudents - a.enrolledStudents
      );
      const sixClasses = sortedClasses.slice(0, 6);
      res.send(sixClasses);
    });

    // Instructors APIs
    app.post("/instructors", async (req, res) => {
      const instructor = req.body;
      const result = await instructorsCollection.insertOne(instructor);
      res.send(result);
    });

    app.get("/instructors", async (req, res) => {
      const result = await instructorsCollection.find().toArray();
      const sortedInstructors = result.sort(
        (a, b) => b.enrolledStudents - a.enrolledStudents
      );
      const sixInstructors = sortedInstructors.slice(0, 6);
      res.send(sixInstructors);
    });

    app.get("/instructors-all", async (req, res) => {
      const result = await instructorsCollection.find().toArray();
      res.send(result);
    });

    // Gallery API
    app.post("/gallery", async (req, res) => {
      const item = req.body;
      const result = await galleryCollection.insertOne(item);
      res.send(result);
    });

    app.get("/gallery", async (req, res) => {
      const result = await galleryCollection.find().toArray();
      res.send(result);
    });

    // Users APIs
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      console.log(existingUser);
      if (existingUser) {
        return res.send({ message: "User already exists" });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: { role: "admin" },
      };
      const result = await usersCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    app.get("/users/admin/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      if (req.decoded.email !== email) {
        res.send({ admin: false });
      }
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const result = { admin: user?.role === "admin" };
      res.send(result);
    });

    // CODE ABOVE
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Summer camp yoga is in good mood!");
});

app.listen(port, () => {
  console.log(`Summer camp yoga is listening on port: ${port}`);
});
