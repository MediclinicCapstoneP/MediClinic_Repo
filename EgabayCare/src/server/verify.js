const express = require('express');
const { Pool } = require('pg');

const app = express();
const pool = new Pool({
  connectionString: 'postgresql://postgres:143Death-4ever@db.warwewbeirhmqhbpdxoj.supabase.co:5432/postgres' // Replace with your actual connection string
});

app.get('/verify', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.send('No verification code provided.');
  }

  try {
    const result = await pool.query(
      'UPDATE users SET verification_code = NULL, is_verified = TRUE WHERE verification_code = $1 RETURNING *',
      [code]
    );

    if (result.rowCount > 0) {
      res.send('Your account has been verified! <a href="/login">Login</a>');
    } else {
      res.send('Invalid or expired verification code.');
    }
  } catch (err) {
    res.send('Error verifying account.');
  }
});

app.listen(3000, () => console.log('Verification server running on port 3000'));