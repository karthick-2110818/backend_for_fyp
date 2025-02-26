const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(bodyParser.json());
app.use(cors());

let products = {};  // Stores product data
let clients = [];   // Stores connected SSE clients
const weightThreshold = 5; // Weight change threshold (grams)

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

// **Helper Function: Get Only Valid Products (Now Allows Rotten Products)**
function getCurrentProducts() {
    return Object.entries(products)
        .filter(([_, product]) => product.weight >= 2 && product.price > 0)  // Prevents filtering out rotten products
        .map(([name, details]) => ({ name, ...details }));  
}

// **[2] Product Addition or Update (Handles Weight Threshold)**
app.post('/product', (req, res) => {
    const { name, weight, price, freshness } = req.body;

    console.log(`Received product: ${name} | Weight: ${weight}g | Price: ₹${price} | Freshness: ${freshness}`);

    if (!name || weight === undefined || price === undefined || !freshness) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (weight < 0 || price <= 0) {
        return res.status(400).json({ error: 'Invalid product detected (negative weight or negative price)' });
    }

    if (products[name]) {
        const prevWeight = products[name].weight;

        // Check if weight change is significant
        if (Math.abs(weight - prevWeight) > weightThreshold) {
            products[name] = { weight, price, freshness };
            console.log(`✅ Updated product: ${name} - Weight: ${weight}g - Price: ₹${price} - Freshness: ${freshness}`);
            broadcastUpdate();
            return res.status(200).json({ message: 'Product updated successfully' });
        } else {
            console.log(`⚠️ No significant update for ${name}, Weight: ${weight}g`);
            return res.status(200).json({ message: 'No significant change in weight' });
        }
    } else {
        // New product detection
        products[name] = { weight, price, freshness };
        console.log(`🆕 New product detected: ${name} - Weight: ${weight}g - Price: ₹${price} - Freshness: ${freshness}`);
        broadcastUpdate();
        return res.status(200).json({ message: 'Product data received successfully' });
    }
});

// **[3] Get Products for Checkout (Filters Invalid Items)**
app.get('/products', (req, res) => {
    res.status(200).json(getCurrentProducts());
});

// **[4] Delete Product (Allows Re-detection)**
app.delete('/product/:name', (req, res) => {
    const { name } = req.params;

    if (products[name]) {
        delete products[name];
        broadcastUpdate();
        console.log(`❌ Product ${name} deleted. It can now be detected again.`);
        return res.status(200).json({ message: `Product ${name} deleted successfully.` });
    }

    return res.status(404).json({ error: `Product ${name} not found.` });
});

// **Start the Server on Port 10000**
const PORT = 10000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
