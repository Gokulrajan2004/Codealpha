const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/user');
const sendMail = require('./utils/sendmail');

dotenv.config();
const app = express();
const cors = require("cors");

app.use(cors({
  origin: "http://127.0.0.1:5500",
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'ToyCraze_secret',
  resave: false,
  saveUninitialized: false
}));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error(err));

// ✅ Register Route
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.json({ success: false, message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const user = new User({
      username,
      email,
      password: hashed,
      verificationCode: otp,
      isVerified: false
    });

    await user.save();
    await sendMail(email, otp, username);

    return res.status(200).json({ success: true, message: "OTP sent to your email", email });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ success: false, message: "Server error during registration" });
  }
});

// ✅ Verify OTP Route
app.post('/api/verify', async (req, res) => {
  const { email, code } = req.body;
  const user = await User.findOne({ email });

  if (!user || user.verificationCode !== code) {
    return res.json({ success: false, message: "Invalid code" });
  }

  user.isVerified = true;
  user.verificationCode = undefined;
  await user.save();
  res.json({ success: true, message: "Verified! You can now log in." });
});


// ✅ Login Route (username-based login)
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password required" });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ success: false, message: "Verify email first" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: "Wrong password" });
    }

    req.session.user = { id: user._id, username: user.username, email: user.email };
    return res.json({ success: true, message: "Logged in", user: req.session.user });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});


// ✅ Get Logged In User
app.get('/api/user', (req, res) => {
  if (!req.session.user) return res.json({ user: null });
  res.json({ user: req.session.user });
});

// ✅ Logout
app.get('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// ✅ Order Schema
const OrderSchema = new mongoose.Schema({
  userId: String,
  items: Array,
  totalAmount: String,
  shipping: {
    name: String,
    email: String,
    address: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
const Order = mongoose.model("Order", OrderSchema);

// ✅ Save Order
const nodemailer = require("nodemailer");

// Create transporter (use your email credentials or OAuth)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,      // your email
    pass: process.env.MAIL_PASS       // app password
  }
});

app.post("/api/order", async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();

    const { email, items, totalAmount, shipping } = req.body;

    // Create invoice-style HTML
    const itemList = items.map(item =>
      `<li>${item.title} × ${item.quantity} — ${item.price}</li>`
    ).join("");

    const html = `
      <h2>🧾 Your ToyCraze Invoice</h2>
      <p><strong>Name:</strong> ${shipping.name}</p>
      <p><strong>Shipping Address:</strong> ${shipping.address}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
      <ul>${itemList}</ul>
      <p><strong>Total Amount:</strong> ${totalAmount}</p>
      <p>Thanks for shopping with ToyCraze! 💼</p>
    `;

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "ToyCraze - Order Invoice",
      html
    });

    res.json({ success: true, message: "Order saved and email sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error saving order or sending email", error: err });
  }
});

app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});
