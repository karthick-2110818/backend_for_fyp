const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Initialize the Express app
const app = express();

// Middleware to parse incoming JSON requests
app.use(bodyParser.json());

// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors());

// In-memory store for product data (could use database for production)
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

// Endpoint to get the list of products (fetches current products for checkout)
app.get('/products', (req, res) => {
    // Simulate fetching products for a particular session
    // (can be enhanced with session or user ID to track customer-specific products)
    res.status(200).json(products);
});

// Start the server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
