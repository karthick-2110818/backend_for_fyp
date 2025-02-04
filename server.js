const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(bodyParser.json());
app.use(cors());

let products = {};  // Stores product data
let clients = [];   // Stores connected SSE clients

// **[1] SSE Endpoint for Real-Time Updates**
app.get('/stream-products', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    clients.push(res);

    res.write(`data: ${JSON.stringify(getCurrentProducts())}\n\n`);

    req.on('close', () => {
        clients = clients.filter(client => client !== res);
    });
});

// **Helper Function: Send Updates to All Connected Clients**
function broadcastUpdate() {
    const data = JSON.stringify(getCurrentProducts());
    clients.forEach(client => client.write(`data: ${data}\n\n`));
}

// **Helper Function: Get Only Valid Products**
function getCurrentProducts() {
    return Object.entries(products)
        .filter(([_, product]) => product.weight > 0 && product.price > 0)  // Remove misdetections
        .map(([name, details]) => ({ name, ...details }));  
}

// **[2] Product Addition or Update**
app.post('/product', (req, res) => {
    const { name, weight, price, freshness } = req.body;

    if (!name || weight === undefined || price === undefined || !freshness) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (weight < 0 || price <= 0) {
        return res.status(400).json({ error: 'Invalid product detected (negative weight or zero price)' });
    }

    products[name] = { weight, price, freshness };
    console.log(`Product received: ${name} - Weight: ${weight}g - Price: ₹${price} - Freshness: ${freshness}`);

    broadcastUpdate();
    res.status(200).json({ message: 'Product data received successfully' });
});

// **[3] Get Products for Checkout (Filters Invalid Items)**
app.get('/products', (req, res) => {
    res.status(200).json(getCurrentProducts());
});

// **[4] Update Product Details**
app.post('/product/update', (req, res) => {
    const { name, weight, price, freshness } = req.body;

    if (!name || weight === undefined || price === undefined || !freshness) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (products[name]) {
        products[name].weight = weight;
        products[name].price = price;
        products[name].freshness = freshness;

        console.log(`Product updated: ${name} - Weight: ${weight}g - Price: ₹${price} - Freshness: ${freshness}`);
        broadcastUpdate();

        return res.status(200).json({ message: 'Product updated successfully' });
    }

    return res.status(404).json({ error: 'Product not found' });
});

// **[5] Delete Product**
app.delete('/product/:name', (req, res) => {
    const { name } = req.params;

    if (products[name]) {
        delete products[name];
        broadcastUpdate();
        return res.status(200).json({ message: `Product ${name} deleted successfully.` });
    }

    return res.status(404).json({ error: `Product ${name} not found.` });
});

// **Start the Server on Port 10000**
const PORT = 10000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
