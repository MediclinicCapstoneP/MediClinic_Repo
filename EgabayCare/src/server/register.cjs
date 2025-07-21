require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors()); // handles CORS automatically

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('❌ Database connection error:', err);
  } else {
    console.log('✅ Database connected to Supabase');
  }
});

// Email setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Registration route
app.post('/register', async (req, res) => {
  const {
    name,
    email,
    phone,
    address,
    license_number,
    accreditation,
    owner_name,
    password
  } = req.body;

  if (!name || !email || !phone || !address || !license_number || !owner_name || !password) {
    return res.status(400).json({ res: 'error', msg: 'All required fields must be filled.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ res: 'error', msg: 'Invalid email format.' });
  }

  try {
    const exists = await pool.query('SELECT id FROM clinics WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      return res.status(400).json({ res: 'error', msg: 'Email is already registered.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const verification_code = crypto.randomBytes(16).toString('hex');

    const dbResult = await pool.query(
      `INSERT INTO clinics (
        name, email, phone, address, license_number, accreditation, owner_name, password_hash, created_at, is_verified, verification_code
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, now(), false, $9
      ) RETURNING id`,
      [name, email, phone, address, license_number, accreditation, owner_name, password_hash, verification_code]
    );

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Clinic Account Verification - EgabayCare',
      html: `
        <h2>Welcome to EgabayCare!</h2>
        <p>Please verify your clinic account by clicking the link below:</p>
        <a href="${process.env.FRONTEND_URL}/verify?code=${verification_code}" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">
          Verify Account
        </a>
        <p>If the button doesn't work, copy and paste this link:</p>
        <p>${process.env.FRONTEND_URL}/verify?code=${verification_code}</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      res: 'success',
      msg: 'Registration successful! Please check your email to verify your account.',
      clinicId: dbResult.rows[0].id
    });

  } catch (err) {
    console.error('❌ Registration Error:', err);
    res.status(500).json({ res: 'error', msg: 'Registration failed. Try again later.' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Registration server running' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
