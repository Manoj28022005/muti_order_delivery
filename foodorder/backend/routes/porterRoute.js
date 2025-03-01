import express from "express";
import axios from "axios";
import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// ✅ Razorpay API Variables
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_TEST_KEY_ID,
  key_secret: process.env.RAZORPAY_TEST_KEY_SECRET,
});

// ✅ Porter API Variables
const PORTER_API_KEY = process.env.PORTER_API_KEY;
const PORTER_BASE_URL = "https://pfe-apigw-uat.porter.in";

// ✅ Fixed Restaurant Pickup Location
const pickupDetails = {
  address: {
    apartment_address: "27",
    street_address1: "Sona Towers",
    street_address2: "Krishna Nagar Industrial Area",
    landmark: "Hosur Road",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560029",
    country: "India",
    lat: 12.939391726766775,
    lng: 77.62629462844717,
    contact_details: {
      name: "Porter Test User",
      phone_number: "+911234567890",
    },
  },
};

// ✅ Route to Fetch Delivery Fee (Only for Bikes)
router.post("/get_quote", async (req, res) => {
  try {
    console.log("📩 Received Request:", JSON.stringify(req.body, null, 2));

    // ✅ Construct Correct API Request Format
    const requestData = {
      pickup_details: { lat: pickupDetails.address.lat, lng: pickupDetails.address.lng },
      drop_details: req.body.drop_details,
      customer: req.body.customer,
    };

    const response = await axios.post(`${PORTER_BASE_URL}/v1/get_quote`, requestData, {
      headers: {
        "X-API-KEY": PORTER_API_KEY,
        "Content-Type": "application/json",
      },
    });

    console.log("📦 Porter API Response:", JSON.stringify(response.data, null, 2));

    // ✅ Extract correct fare value
    const twoWheeler = response.data.vehicles.find(v => v.type === "2 Wheeler");

    if (!twoWheeler) {
      return res.status(404).json({ message: "2 Wheeler option not available" });
    }

    const eta = twoWheeler.eta?.value || "N/A";
    const fare = twoWheeler.fare?.minor_amount / 100 || "N/A"; // ✅ Convert Paise to INR

    res.json({ type: "2 Wheeler", eta, fare });
  } catch (error) {
    console.error("❌ Error fetching delivery fee:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || "Internal Server Error",
    });
  }
});

// ✅ Route to Create Order (AFTER PAYMENT)
router.post("/create_order", async (req, res) => {
  try {
    console.log("📦 Received Create Order Request:", JSON.stringify(req.body, null, 2));

    const requestData = {
      request_id: `order_${Date.now()}`,
      pickup_details: pickupDetails, // ✅ Use Corrected Pickup Details
      drop_details: req.body.drop_details, // ✅ Use Given Drop Details
      customer: req.body.customer,
      additional_comments: req.body.additional_comments || "Handle with care",
      delivery_instructions: req.body.delivery_instructions || {
        instructions_list: [
          { type: "text", description: "Keep the package upright" },
        ],
      },
    };

    const response = await axios.post(`${PORTER_BASE_URL}/v1/orders/create`, requestData, {
      headers: {
        "X-API-KEY": PORTER_API_KEY,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ Order Created:", response.data);

    res.json({
      message: "Order placed successfully!",
      order_id: response.data.order_id,
      tracking_url: response.data.tracking_url,
    });

  } catch (error) {
    console.error("❌ Error placing order:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || "Internal Server Error",
    });
  }
});

// ✅ Route to Track an Order
router.get("/track_order/:order_id", async (req, res) => {
  try {
    const { order_id } = req.params;

    const response = await axios.get(`${PORTER_BASE_URL}/v1/orders/${order_id}`, {
      headers: { "X-API-KEY": PORTER_API_KEY },
    });

    res.json(response.data);
  } catch (error) {
    console.error("❌ Error tracking order:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || "Internal Server Error",
    });
  }
});


// ✅ 2️⃣ Create Razorpay Order (Before Placing Order)
router.post("/checkout", async (req, res) => {
  try {
    const { amount, currency } = req.body;
    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert INR to paise
      currency,
      payment_capture: 1,
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Error creating payment order", error: error.message });
  }
});

// ✅ 3️⃣ Verify Razorpay Payment & Call `create_order`
router.post("/verify", async (req, res) => {
  try {
    const { success, orderDetails } = req.body;
    
    if (!success) {
      return res.status(400).json({ success: false, message: "Payment failed" });
    }

    // ✅ Call Porter API to Create Order After Payment Success
    const response = await axios.post(`${PORTER_BASE_URL}/v1/orders/create`, orderDetails, {
      headers: {
        "X-API-KEY": PORTER_API_KEY,
        "Content-Type": "application/json",
      },
    });

    res.json({
      success: true,
      message: "Order placed successfully!",
      order_id: response.data.order_id,
      tracking_url: response.data.tracking_url,
    });

  } catch (error) {
    console.error("❌ Error placing order:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || "Internal Server Error",
    });
  }
});


export default router;
