const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

let cart = {}; // Store items with weight and price

// Add or update product
app.post("/product", (req, res) => {
    const { name, weight, price, freshness } = req.body;

    // Validate data
    if (!name || weight < 0 || price < 0) {
        return res.status(400).json({ message: "Invalid data received" });
    }

    if (!cart[name]) {
        // New item added
        cart[name] = { weight, price, freshness };
    } else {
        const prevWeight = cart[name].weight;

        if (weight > prevWeight + 5) {
            // Adding more to the same item batch
            cart[name].weight = weight;
            cart[name].price = price;
        } else if (weight < prevWeight - 5) {
            // Removing some of the item
            cart[name].weight = weight;
            cart[name].price = price;
        } else {
            // No significant weight change, ignore update
            return res.status(200).json({ message: "No significant update" });
        }
    }

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
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
