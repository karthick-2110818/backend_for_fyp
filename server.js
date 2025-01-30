const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 10000;

// Middleware to parse JSON body
app.use(bodyParser.json());

// Sample in-memory storage (You can replace it with a database like MongoDB, MySQL, etc.)
let products = [];

// Endpoint to receive product data from the Raspberry Pi
app.post('/product', (req, res) => {
    const { name, weight, price, freshness } = req.body;

    // Validate the incoming data
    if (!name || !weight || !price || !freshness) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    // Store or process the product data
    const product = {
        name,
        weight,
        price,
        freshness,
        timestamp: new Date().toISOString()
    };

    // For simplicity, store products in an array
    products.push(product);

    // For more complex applications, you can save this data to a database

    console.log(`Received product: ${JSON.stringify(product)}`);

    // Respond with success
    res.status(200).json({ message: 'Product data received successfully', product });
});

// Endpoint to retrieve all received products (for testing purposes)
app.get('/products', (req, res) => {
    res.json(products);
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
