const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Your N-Genius Sandbox credentials
const API_KEY = "NGNjMjE0NWUtOWU3Yy00NzhkLWI2YmMtNmZhYTRkNDk0YmU2OjYwODAwYWFiLTk4MzEtNDQwYy1iY2NhLWZjNDFlM2QyM2QxYw==";
const OUTLET_ID = "eefabde6-f3bf-481a-9f47-e69ae1e9700f";

// Tilda sends payment amount here — expected in 'amount' field
app.post("/pay", async (req, res) => {
  try {
    const { amount } = req.body;

    // Step 1: Get access token
    const tokenRes = await axios.post(
      "https://api-gateway.sandbox.ngenius-payments.com/identity/auth/access-token",
      {},
      {
        headers: {
          Authorization: `Basic ${API_KEY}`,
          "Content-Type": "application/vnd.ni-identity.v1+json",
        },
      }
    );
    const accessToken = tokenRes.data.access_token;

    // Step 2: Create payment order
    const orderRes = await axios.post(
      `https://api-gateway.sandbox.ngenius-payments.com/transactions/outlets/${OUTLET_ID}/orders`,
      {
        action: "SALE",
        amount: {
          currencyCode: "AED",
          value: parseInt(amount) * 100 // Tilda sends 10.00 → convert to 1000
        },
        merchantAttributes: {
          redirectUrl: "https://your-tilda-site.com/thank-you" // Replace with your Tilda thank-you page URL
        }
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/vnd.ni-payment.v2+json",
          Accept: "application/vnd.ni-payment.v2+json",
        },
      }
    );

    // Step 3: Redirect to payment page
    const paymentLink = orderRes.data._links.payment.href;
    res.redirect(paymentLink);
  } catch (err) {
    console.error("N-Genius Error:", err.response?.data || err.message);
    res.status(500).send(`
      <h3>Error creating payment link</h3>
      <pre>${JSON.stringify(err.response?.data || err.message, null, 2)}</pre>
    `);
  }
});

app.listen(3000, () => {
  console.log("✅ N-Genius payment server running on port 3000");
});
