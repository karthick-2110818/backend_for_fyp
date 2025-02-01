const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Initialize the Express app
const app = express();

// Middleware to parse incoming JSON requests
app.use(bodyParser.json());

// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors());

// In-memory store for product data
let products = {};

// Endpoint to receive product data from Raspberry Pi and store it
app.post('/product', (req, res) => {
    const { name, weight, price, freshness } = req.body;

    if (!name || weight === undefined || price === undefined || !freshness) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if the product already exists, and update it
    if (products[name]) {
        products[name].weight = weight;
        products[name].price = price;
        products[name].freshness = freshness;
    } else {
        products[name] = { weight, price, freshness };
    }

    console.log(`Product received: ${name} - Weight: ${weight}g - Price: $${price} - Freshness: ${freshness}`);
    
    res.status(200).json({ message: 'Product data received successfully' });
});

// Endpoint to get the list of products (for checkout page)
app.get('/products', (req, res) => {
    res.status(200).json(products);
});

// Endpoint to update a product's details
app.post('/product/update', (req, res) => {
    const { name, weight, price, freshness } = req.body;

    if (!name || weight === undefined || price === undefined || !freshness) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (products[name]) {
        products[name].weight = weight;
        products[name].price = price;
        products[name].freshness = freshness;
        console.log(`Product updated: ${name} - Weight: ${weight}g - Price: $${price} - Freshness: ${freshness}`);
        return res.status(200).json({ message: 'Product updated successfully' });
    }

    return res.status(404).json({ error: 'Product not found' });
});

// Endpoint to delete a product
app.delete('/product/:name', (req, res) => {
    const { name } = req.params;

    if (products[name]) {
        delete products[name];
        console.log(`Product deleted: ${name}`);
        return res.status(200).json({ message: 'Product deleted successfully' });
    }

    return res.status(404).json({ error: 'Product not found' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
