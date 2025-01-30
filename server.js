const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Store last product details to avoid duplicate updates
let lastProduct = {
  name: null,
  weight: 0,
  price: 0,
};

// Function to check if a product update is significant
const isSignificantChange = (newProduct) => {
  if (lastProduct.name !== newProduct.name) return true; // New product detected
  if (Math.abs(lastProduct.weight - newProduct.weight) > 5) return true; // Weight change > 5g
  return false;
};

// Route to receive product data
app.post("/product", (req, res) => {
  try {
    const { name, weight, price, freshness } = req.body;

    if (!name || weight === undefined || price === undefined || !freshness) {
      return res.status(400).json({ error: "Invalid product data" });
    }

    const newProduct = { name, weight, price, freshness };

    if (isSignificantChange(newProduct)) {
      lastProduct = newProduct; // Update last detected product
      console.log(`✅ New Product Detected: ${JSON.stringify(newProduct)}`);
      res.status(200).json({ message: "Product updated", product: newProduct });
    } else {
      console.log("🔄 Duplicate/Insignificant update ignored.");
      res.status(200).json({ message: "No significant update" });
    }
  } catch (error) {
    console.error("⚠️ Error processing product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
