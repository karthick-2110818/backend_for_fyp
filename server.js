const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser"); // Body-parser for legacy support

const app = express();
app.use(cors());

// Middleware to parse incoming request bodies in JSON format
app.use(express.json()); // For modern Express versions
app.use(bodyParser.json()); // For backward compatibility, if needed

let cart = {}; // Store items with weight and price

// Add or update product
app.post("/product", (req, res) => {
    const { name, weight, price, freshness } = req.body;

    // Validate data
    if (!name || weight < 0 || price < 0) {
        return res.status(400).json({ message: "Invalid data received" });
    }

    // New item or update existing item
    cart[name] = { weight, price, freshness };

    console.log(`✅ Updated Cart:`, cart);
    return res.status(200).json({ message: "Product updated", cart });
});

// Get cart data
app.get("/cart", (req, res) => {
    res.json(cart);
});

// Clear cart (for checkout/reset)
app.post("/clear-cart", (req, res) => {
    cart = {};
    console.log("🛒 Cart Cleared");
    res.json({ message: "Cart cleared" });
});

// Start Server
const PORT = 10000; // Listen on port 10000
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
