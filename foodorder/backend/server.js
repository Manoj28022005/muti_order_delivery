import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import foodRouter from "./routes/foodRoute.js";
import userRouter from "./routes/userRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import porterRouter from "./routes/porterRoute.js"; // ✅ Import Porter Routes

dotenv.config();
connectDB();

const app = express();
const port = process.env.PORT || 4040;

// ✅ Middleware
app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173", // ✅ Allow frontend requests
  methods: "GET,POST",
  allowedHeaders: "Content-Type, Authorization, X-API-KEY, token"
}));

// ✅ Routes
app.use("/api/food", foodRouter);
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/porter", porterRouter); // ✅ Add Porter API route

app.get("/", (req, res) => {
  res.send("API Working");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
