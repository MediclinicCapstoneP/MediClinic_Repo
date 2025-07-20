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
  const { first_name, last_name, email, gender, phone_number, user_address, birthdate, password, role } = req.body;
  const password_hash = await bcrypt.hash(password, 10);
  const verification_code = crypto.randomBytes(16).toString('hex');

  try {
    // Insert user into database
    await pool.query(
      `INSERT INTO users (first_name, last_name, email, gender, phone_number, course, user_address, birthdate, user_password, verification_code, role)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [first_name, last_name, email, gender, phone_number, course, user_address, birthdate, password_hash, verification_code, role]
    );

    // Send verification email
    const mailOptions = {
      from: 'yourgmail@gmail.com',
      to: email,
      subject: 'Account Verification',
      html: `Click the link to verify your account: <a href="http://localhost:3000/verify?code=${verification_code}">Verify Account</a>`
    };

    await transporter.sendMail(mailOptions);

    res.json({ res: 'success', msg: 'Registration successful! Please check your email.' });
  } catch (err) {
    res.json({ res: 'error', msg: err.message });
  }
});

app.listen(3000, () => console.log('Registration server running on port 3000'));