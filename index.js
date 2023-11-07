const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
require('dotenv').config();

app.use(cors())
app.use(express.json())

const port = process.env.port || 5000;



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fhm2lqj.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const booksCategoryCollections = client.db("booksDB").collection("category")
        const booksCollections = client.db("booksDB").collection("books")
        const borrowedBookCollection = client.db("booksDB").collection("borrowedBooks")

        //Books Category
        app.get('/booksCategory', async (req, res) => {
            const result = await booksCategoryCollections.find().toArray();
            res.send(result)
        })
        //all books

        app.get('/allBooks', async(req,res)=>{
            const result = await booksCollections.find().toArray()
            res.send(result)
        })

        //addBooks
        app.get('/books', async (req, res) => {
            const result = await booksCollections.find().toArray()
            res.send(result)
        })
        app.post('/books', async (req, res) => {
            const book = req.body;
            const result = await booksCollections.insertOne(book)
            res.send(result)
        })
        app.get('/books/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }

            const result = await booksCollections.findOne(query)

            res.send(result)
        })
        app.patch('/books/:id', async(req,res)=>{
            const id = req.params.id;
            const updatedBooks = req.body;
            console.log(updatedBooks)
            const filter = {_id: new ObjectId(id)}
            const updatedDoc = {
                $set: {
                    quantity: updatedBooks.quantity
                }
            }
            const result= await booksCollections.updateOne(filter,updatedDoc)
            res.send(result)
        })

        //borrowed
        app.get('/borrowedBooks', async (req, res) => {
            let query ={};
            console.log(req.query.email)
            if(req.query?.email){
                query= {email: req.query.email}
            }
            console.log(query)
            const result = await borrowedBookCollection.find(query).toArray()
            res.send(result)
        })
        app.post('/borrowedBooks', async (req, res) => {
            const borrowedBook = req.body;
            const result = await borrowedBookCollection.insertOne(borrowedBook)
            res.send(result)
        })
        app.delete('/borrowedBooks/:id', async(req,res)=>{
            const id = req.params.id
            const query = {_id: new ObjectId(id)}
            const result = await borrowedBookCollection.deleteOne(query)
            res.send(result)
        })
        //read
        // app.get('/reads/:id', async (res,req)=>{
        //     const id = req.params.id;
        //     const query = { _id: new ObjectId(id) }

        //     const result = await booksCollections.findOne(query)

        //     res.send(result)
        // })
       



        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send("Library Management System is running")
})
app.listen(port, () => {
    console.log(`app is running on port ${port}`)
})