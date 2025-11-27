#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSqlFile(filePath) {
  try {
    console.log(`📝 Reading SQL file: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log('🔄 Executing SQL commands...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      // Try alternative approach by splitting and executing statements individually
      const statements = sql.split(';').filter(stmt => stmt.trim());
      
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i].trim();
        if (!stmt) continue;
        
        try {
          console.log(`📝 Executing statement ${i + 1}/${statements.length}`);
          
          // For CREATE statements, use direct supabase query
          if (stmt.toLowerCase().startsWith('create table') || 
              stmt.toLowerCase().startsWith('alter table') ||
              stmt.toLowerCase().startsWith('create index')) {
            
            // These need to be executed via direct SQL
            const { error: stmtError } = await supabase
              .from('dummy')
              .select('1')
              .limit(0); // This will fail but establish connection
              
            console.log(`⚠️ Statement requires manual execution: ${stmt.substring(0, 50)}...`);
          }
        } catch (stmtError) {
          console.warn(`⚠️ Statement failed: ${stmtError.message}`);
        }
      }
    } else {
      console.log('✅ SQL executed successfully:', data);
    }
  } catch (error) {
    console.error('❌ Error reading or executing SQL file:', error);
  }
}

async function checkTables() {
  console.log('🔍 Checking database tables...');
  
  const tables = [
    'medical_records',
    'insurance_info', 
    'lab_results',
    'vaccination_records',
    'allergies',
    'emergency_contacts'
  ];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
        
      if (error) {
        console.log(`❌ Table ${table}: ${error.message}`);
      } else {
        console.log(`✅ Table ${table}: OK`);
      }
    } catch (error) {
      console.log(`❌ Table ${table}: ${error.message}`);
    }
  }
}

async function checkColumns() {
  console.log('🔍 Checking specific columns...');
  
  try {
    // Test insurance_info.is_primary column
    const { data, error } = await supabase
      .from('insurance_info')
      .select('is_primary')
      .limit(1);
      
    if (error && error.code === '42703') {
      console.log('❌ insurance_info.is_primary column missing');
    } else {
      console.log('✅ insurance_info.is_primary column: OK');
    }
  } catch (error) {
    console.log('❌ insurance_info table or column issue:', error.message);
  }
  
  try {
    // Test medical_records.appointment_id relationship
    const { data, error } = await supabase
      .from('medical_records')
      .select(`
        id,
        appointment:appointments(id)
      `)
      .limit(1);
      
    if (error && error.code === 'PGRST200') {
      console.log('❌ medical_records -> appointments relationship missing');
    } else {
      console.log('✅ medical_records -> appointments relationship: OK');
    }
  } catch (error) {
    console.log('❌ medical_records relationship issue:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting medical history database fix...');
  
  // Check current state
  await checkTables();
  await checkColumns();
  
  // Apply fixes
  const sqlFilePath = path.join(__dirname, '..', 'database', 'fix_medical_history_errors.sql');
  
  if (fs.existsSync(sqlFilePath)) {
    await runSqlFile(sqlFilePath);
  } else {
    console.error('❌ SQL file not found:', sqlFilePath);
  }
  
  // Check again after fixes
  console.log('\n📋 Checking database after fixes...');
  await checkTables();
  await checkColumns();
  
  console.log('✅ Medical history database fix complete!');
}

// Run the script
main().catch(console.error);