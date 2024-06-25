import "dotenv/config";
import express from "express";
import * as paypal from "./paypal-api.js";
//require('dotenv').config(); //dani 25 giu
const {PORT = 8888} = process.env;

const app = express();
app.set("view engine", "ejs"); //if "view engine" is not set "ejs" is the default
app.use(express.static("public"));

// render checkout page with client id & unique client token
app.get("/", async (req, res) => {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const merchantId = process.env.PAYPAL_MERCHANT_ID; //testare
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const mymerchantId = process.env.PAYPAL_MERCHANT_ID;
  try {
    if (!clientId || !mymerchantId ||  !clientSecret){
      throw new Error("Client Id or App Secret or Merchant Id is missing.");
    }
    const clientToken = await paypal.generateClientToken();
    res.render("checkout", { clientId, clientToken, merchantId });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// create order
app.post("/api/orders", async (req, res) => {
  try {
    const order = await paypal.createOrder();
    res.json(order);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Get order
app.post("/api/orders/:orderID", async (req, res) => {
  const { orderID } = req.params;
  try {
    const order = await paypal.getOrder(orderID);
    res.json(order);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// capture payment
app.post("/api/orders/:orderID/capture", async (req, res) => {
  const { orderID } = req.params;
  try {
    const captureData = await paypal.capturePayment(orderID);
    res.json(captureData);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// health check
app.get("/check" ,(req,res) => {
  res.json({
    message: "ok",
    env: process.env.NODE_ENV, 
    baseUrl: process.env.BASE_URL
  })
})

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}/`);
});
