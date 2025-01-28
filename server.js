const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express()
const port = process.env.PORT || 3000;

let products = [];
let orders = [];
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send("API deployment successful");
});

// POST to add new product
app.post('/product', (req, res) => {
    const product = req.body;

    // Validate product data
    if (!product.id || !product.name || !product.price || !product.taken || !product.payable) {
        return res.status(400).send('Invalid product data');
    }

    console.log('Product added:', product);
    products.push(product);
    res.send('Product added successfully');
});

// GET all products
app.get('/product', (req, res) => {
    res.json(products);
});

// GET a specific product by id
app.get('/product/:id', (req, res) => {
    const id = req.params.id;
    const product = products.find(p => p.id === parseInt(id));

    if (product) {
        res.json(product);
    } else {
        res.status(404).send('Product not found');
    }
});

// DELETE product by id
app.delete('/product/:id', (req, res) => {
    const id = req.params.id;
    products = products.filter(i => i.id !== parseInt(id));
    res.send('Product deleted successfully');
});

// POST to update a product by id
app.post('/product/:id', (req, res) => {
    const id = req.params.id;
    const updatedProduct = req.body;

    const index = products.findIndex(p => p.id === parseInt(id));
    if (index === -1) {
        return res.status(404).send('Product not found');
    }

    products[index] = updatedProduct;
    res.send('Product updated successfully');
});

// POST to handle checkout
app.post('/checkout', (req, res) => {
    const order = req.body;
    if (!order || !order.items || order.items.length === 0) {
        return res.status(400).send('Invalid order data');
    }

    orders.push(order);
    console.log('Order placed:', order);
    res.send('Order placed successfully');
});

// GET all orders
app.get('/checkout', (req, res) => {
    res.json(orders);
});

app.listen(port, () => console.log(`Server listening on port ${port}!`));
