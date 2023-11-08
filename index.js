const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
require('dotenv').config();

app.use(cors({
    origin:['http://localhost:5173', 'http://localhost:5174'],
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())
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

//custom middlewares for verify token

const verifyToken = (req,res,next)=>{
    const token =req.cookies?.token;
    if(!token){
        return res.status(401).send({message: 'unauthorized access'})
    }
    jwt.verify(token ,process.env.SECRET_KEY, (error, decoded)=>{
        if(error){
            return res.status(401).send({message: 'unauthorized access'})
        }
        req.user = decoded;
        next();
    })
    
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const booksCategoryCollections = client.db("booksDB").collection("category")
        const booksCollections = client.db("booksDB").collection("books")
        const borrowedBookCollection = client.db("booksDB").collection("borrowedBooks")

        //Auth related api for secure
        app.post('/jwt', async(req,res)=>{
            const user = req.body
            const token = jwt.sign(user, process.env.SECRET_KEY, {expiresIn: '1h'})
            
            res
            .cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none'
            })
            .send({success : true})
        })

        app.post('/logOut', async(req,res)=>{
            const user = req.body
            res
            .clearCookie('token', {maxAge: 0})
            .send({success: true})
        })


        //Books Category
        app.get('/booksCategory', async (req, res) => {
            const result = await booksCategoryCollections.find().toArray();
            res.send(result)
        })
        //all books

        app.get('/allBooks',  async (req, res) => {
            const result = await booksCollections.find().toArray()
            // console.log('all book cookies',req.cookies)
            res.send(result)
        })

        //updated books from all books
        app.get('/allBooks/:id', verifyToken,  async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            // console.log('token owner info', req.user)
            // if(req.user.email  !== req.query.email){
            //     return res.status(403).send({message: 'forbidden access'})
            // }
            const result = await booksCollections.findOne(query)
            res.send(result)
        })
        app.put('/allBooks/:id',  async (req, res) => {
            const id = req.params.id;
            const updatedBooks = req.body;
            console.log(updatedBooks)
            const filter = { _id: new ObjectId(id) }
            const options = {upsert: true}
            const updatedDoc = {
                $set: {
    
                    photo:updatedBooks.photo,
                    bookName:updatedBooks.bookName,
                    quantity:updatedBooks.quantity,
                    authorName:updatedBooks.authorName,
                    category:updatedBooks.category,
                    rating:updatedBooks.rating,
                    description:updatedBooks.description,                }
            }
            const result = await booksCollections.updateOne(filter, updatedDoc, options)
            res.send(result)
        })


        //addBooks
        app.get('/books', async (req, res) => {
            const result = await booksCollections.find().toArray()
            res.send(result)
        })
        app.post('/books', verifyToken, async (req, res) => {
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
        app.patch('/books/:id',  async (req, res) => {
            const id = req.params.id;
            const updatedBooks = req.body;
            console.log(updatedBooks)
            const filter = { _id: new ObjectId(id) }
            const updatedDoc = {
                $set: {
                    quantity: updatedBooks.quantity
                }
            }
            const result = await booksCollections.updateOne(filter, updatedDoc)
            res.send(result)
        })

        //borrowed
        app.get('/borrowedBooks', async (req, res) => {
            let query = {};
            console.log(req.query.email)
            if (req.query?.email) {
                query = { email: req.query.email }
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
        app.delete('/borrowedBooks/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await borrowedBookCollection.deleteOne(query)
            res.send(result)
        })
        
        app.get('/reads/:id', async (res,req)=>{
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }

            const result = await booksCollections.findOne(query)

            res.send(result)
        })




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