const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const axios = require("axios");
const crypto = require("crypto");

const authentcationToken = require("./authToken");
async function getAuthToken() {
  const response = await axios.post(
    "https://accept.paymob.com/api/auth/tokens",
    {
      api_key: process.env.PAYMOB_API_KEY,
    }
  );
  return response.data.token;
}

async function createOrder(authToken, amount, items) {
  const response = await axios.post(
    "https://accept.paymob.com/api/ecommerce/orders",
    {
      auth_token: authToken,
      delivery_needed: false,
      amount_cents: amount * 100,
      currency: "EGP",
      api_source: "INVOICE",
      shipping_data: {
        first_name: "Test",
        last_name: "Account",
        phone_number: "01010101010",
        email: "test@account.com",
      },
      integrations: [123, 4696811], // mhm gdn aw mmkn nzbt al auth bta3 el user

      items: items,
    }
  );
  return response.data.id;
}

async function getPaymentKey(authToken, orderId, amount, integrationId) {
  const response = await axios.post(
    "https://accept.paymob.com/api/acceptance/payment_keys",
    {
      auth_token: authToken,
      order_id: orderId,
      amount_cents: amount * 100,
      currency: "EGP",
      integration_id: integrationId,
    }
  );
  return response.data.token;
}
router.post("/charge", authentcationToken, async (req, res) => {
  try {
    const authToken = await getAuthToken();
    console.log(authToken);
    const orderId = await createOrder(
      authToken,
      req.body.amount,
      req.body.items
    );
    const paymentKey = await getPaymentKey(
      authToken,
      orderId,
      req.body.amount,
      4696811
    );
    console.log(paymentKey, "token");
    res.json({ token: paymentKey });
    // you need to tupe in req {amount,items}
    // Redirect to PayMob payment page
    // res.redirect(
    //   `https://accept.paymob.com/api/acceptance/iframes/861868?payment_token={paymentKey}`
    // );
  } catch (error) {
    console.error(error.response);
    res.status(500).send("Error processing payment");
  }
});

function verifyPaymobHMAC(req, res, next) {
  ///recieve payload to genereate it  console.log(req.query);
  const keysOrders = [
    "amount_cents",
    "created_at",
    "currency",
    "error_occured",
    "has_parent_transaction",
    "id",
    "integration_id",
    "is_3d_secure",
    "is_auth",
    "is_capture",
    "is_refunded",
    "is_standalone_payment",
    "is_voided",
    "orderId",
    "owner",
    "pending",
    "source_dataPan",
    "source_data_sub_type",
    "source_data_type",
    "success",
  ];
  let stringValues = "1";
  const data = req.body; //we should sort data
  console.log(data.obj);
  const keyStringObject = {
    amount_cents: data.obj.amount_cents,
    currency: data.obj.currency,
    created_at: data.obj.created_at,
    error_occured: data.obj.error_occured,
    has_parent_transaction: data.obj.has_parent_transaction,
    id: data.obj.id,
    integration_id: data.obj.integration_id,
    is_3d_secure: data.obj.is_3d_secure,
    is_auth: data.obj.is_auth,
    is_capture: data.obj.is_capture,
    is_refunded: data.obj.is_refunded,
    is_standalone_payment: data.obj.is_standalone_payment,
    is_voided: data.obj.is_voided,
    orderId: data.obj.order.id,
    owner: data.obj.owner,
    pending: data.obj.pending,
    source_dataPan: data.obj.source_data.pan,
    source_data_sub_type: data.obj.source_data.sub_type,
    source_data_type: data.obj.source_data.type,
    success: data.obj.success,
  };

  console.log(keyStringObject.hasOwnProperty(keysOrders[0]));
  console.log("data", data);
  if (!data.type) {
    return res.status(400).send("No data received");
  }

  keysOrders.forEach((key) => {
    if (keyStringObject.hasOwnProperty(key)) {
      stringValues += keyStringObject.obj[key];
      console.log("stringValues", stringValues);
    }
  });

  ///end payload
  const hmacHeader = req.query.hmac;
  console.log("hmacheader", hmacHeader);
  if (!hmacHeader) {
    return res.status(401).send("HMAC header is missing");
  }

  const calculatedHmac = crypto
    .createHmac("sha512", process.env.PAYMOB_HMAC_SECRET)
    .update(stringValues)
    .digest("hex");
  console.log(calculatedHmac !== hmacHeader);
  // if (calculatedHmac !== hmacHeader) {
  //   return res.status(401).send("HMAC verification failed");
  // }

  next();
}

// Use the middleware in your callback route

router.post("/callback", verifyPaymobHMAC, async (req, res) => {
  // Handle the callback from PayMob
  // Verify the payment status and update your database

  res.status(200).json(req.query);
});
module.exports = router;
