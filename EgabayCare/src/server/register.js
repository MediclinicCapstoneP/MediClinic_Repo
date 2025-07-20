const express = require('express');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: 'YOUR_POSTGRES_CONNECTION_STRING' // Replace with your actual connection string
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'yourgmail@gmail.com',      // Replace with your Gmail
    pass: 'your-app-password'         // Use Gmail App Password
  }
});

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

  const password_hash = await bcrypt.hash(password, 10);
  const verification_code = crypto.randomBytes(16).toString('hex');

  try {
    // Insert clinic into database
    await pool.query(
      `INSERT INTO clinics (
        name, email, phone, address, license_number, accreditation, owner_name, password_hash, created_at, is_verified, verification_code
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, now(), false, $9
      )`,
      [name, email, phone, address, license_number, accreditation, owner_name, password_hash, verification_code]
    );

    // Send verification email
    const mailOptions = {
      from: 'yourgmail@gmail.com',
      to: email,
      subject: 'Clinic Account Verification',
      html: `Click the link to verify your clinic account: <a href="http://localhost:3000/verify?code=${verification_code}">Verify Account</a>`
    };

    await transporter.sendMail(mailOptions);

    res.json({ res: 'success', msg: 'Registration successful! Please check your email.' });
  } catch (err) {
    res.json({ res: 'error', msg: err.message });
  }
});

app.listen(3000, () => console.log('Registration server running on port 3000'));