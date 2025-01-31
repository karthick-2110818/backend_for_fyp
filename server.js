const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Initialize the Express app
const app = express();

// Middleware to parse incoming JSON requests
app.use(bodyParser.json());

// Enable Cross-Origin Resource Sharing (CORS) to allow your Raspberry Pi to communicate with the server
app.use(cors());

// In-memory store for product data (you can switch to a database in production)
let products = {};

// Endpoint to receive product data from Raspberry Pi and store it
app.post('/product', (req, res) => {
    const { name, weight, price, freshness } = req.body;

    if (!name || weight === undefined || price === undefined || !freshness) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if the product already exists, and update it if necessary
    if (products[name]) {
        // Update the existing product data with the new information
        products[name].weight = weight;
        products[name].price = price;
        products[name].freshness = freshness;
    } else {
        // Add a new product to the store
        products[name] = { weight, price, freshness };
    }

    console.log(`Product received: ${name} - Weight: ${weight}g - Price: $${price} - Freshness: ${freshness}`);
    
    res.status(200).json({ message: 'Product data received successfully' });
});

// Endpoint to get the list of products (for debugging or frontend)
app.get('/products', (req, res) => {
    res.status(200).json(products);
});

// Start the server on port 3000 (you can change this port if needed)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
