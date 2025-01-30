const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const port = 3000;

// Middleware to parse JSON data
app.use(bodyParser.json());

// Dummy endpoint for testing
app.get("/", (req, res) => {
    res.send("Backend is working!");
});

// Endpoint to handle POST requests from Raspberry Pi
app.post("/product", (req, res) => {
    const { name, weight, price, freshness } = req.body;

    // Log the received data for debugging
    console.log("Received product data:");
    console.log("Name:", name);
    console.log("Weight:", weight);
    console.log("Price:", price);
    console.log("Freshness:", freshness);

    // Validation: Ensure the necessary fields are present
    if (!name || weight === undefined || price === undefined || !freshness) {
        console.log("Missing required fields!");
        return res.status(400).json({ message: "Missing required fields" });
    }

    // Process the received data (e.g., storing or processing the product)
    console.log(`Processing Product: ${name}`);
    console.log(`Weight: ${weight}g, Price: $${price.toFixed(2)}, Freshness: ${freshness}`);

    // Respond back to the Raspberry Pi with a success message
    res.status(200).json({
        message: "Product data successfully received and processed",
        product: { name, weight, price, freshness }
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
});
