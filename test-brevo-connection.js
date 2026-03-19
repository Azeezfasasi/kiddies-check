#!/usr/bin/env node

/**
 * Test Brevo Connection and Email Sending
 * Run this script to diagnose email sending issues
 * 
 * Usage: node test-brevo-connection.js
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const brevoApiKey = process.env.BREVO_API_KEY;
const brevoSenderEmail = process.env.BREVO_SENDER_EMAIL;
const brevoSenderName = process.env.BREVO_SENDER_NAME;

console.log('🔍 Brevo Connection Diagnostic\n');
console.log('Configuration Check:');
console.log('─'.repeat(50));

// Check if API key exists
if (!brevoApiKey) {
  console.log('❌ BREVO_API_KEY is NOT set in .env.local');
  process.exit(1);
} else {
  console.log('✓ BREVO_API_KEY is set');
  console.log(`  Key (first 20 chars): ${brevoApiKey.substring(0, 20)}...`);
}

if (!brevoSenderEmail) {
  console.log('❌ BREVO_SENDER_EMAIL is NOT set in .env.local');
  process.exit(1);
} else {
  console.log('✓ BREVO_SENDER_EMAIL:', brevoSenderEmail);
}

if (!brevoSenderName) {
  console.log('❌ BREVO_SENDER_NAME is NOT set in .env.local');
  process.exit(1);
} else {
  console.log('✓ BREVO_SENDER_NAME:', brevoSenderName);
}

console.log('\n' + '─'.repeat(50));
console.log('\n🧪 Testing Brevo API Connection\n');

// Test 1: Verify API Key
async function testApiKey() {
  try {
    console.log('Test 1: Verifying API Key...');
    const response = await fetch('https://api.brevo.com/v3/account', {
      method: 'GET',
      headers: {
        'api-key': brevoApiKey,
      },
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✓ API Key is valid');
      console.log('  Account Email:', data.email);
      console.log('  Plan:', data.plan);
      return true;
    } else {
      console.log('❌ API Key verification failed');
      console.log('  Error:', data.message || data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Connection error:', error.message);
    return false;
  }
}

// Test 2: Send Test Email
async function testEmailSend() {
  try {
    console.log('\nTest 2: Sending test email...');
    
    const testEmail = brevoSenderEmail; // Send to ourselves
    
    const emailPayload = {
      to: [{ email: testEmail }],
      sender: {
        email: brevoSenderEmail,
        name: brevoSenderName,
      },
      subject: '[TEST] Kiddies Check - Email Service Test',
      htmlContent: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .success { color: green; }
              .info { background: #f0f0f0; padding: 10px; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>✓ Email Service Test Successful!</h1>
              <p>If you're reading this, your Brevo email integration is working correctly.</p>
              <div class="info">
                <p><strong>Details:</strong></p>
                <ul>
                  <li>Sender: ${brevoSenderName} &lt;${brevoSenderEmail}&gt;</li>
                  <li>Time: ${new Date().toLocaleString()}</li>
                  <li>Service: Brevo API</li>
                </ul>
              </div>
              <p>Your newsletter system is ready to send emails!</p>
            </div>
          </body>
        </html>
      `,
      textContent: 'Email Service Test - If you received this, your Brevo integration is working!',
      tags: ['test', 'diagnostic'],
    };

    console.log('  Sending to:', testEmail);
    console.log('  From:', `${brevoSenderName} <${brevoSenderEmail}>`);
    console.log('  Payload size:', JSON.stringify(emailPayload).length, 'bytes');

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': brevoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✓ Email sent successfully!');
      console.log('  Message ID:', data.messageId);
      return true;
    } else {
      console.log('❌ Email send failed');
      console.log('  Status:', response.status);
      console.log('  Error:', data.message || data.error);
      console.log('  Full response:', JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    console.log('❌ Email send error:', error.message);
    return false;
  }
}

// Test 3: Check Sender Configuration
async function testSenderConfig() {
  try {
    console.log('\nTest 3: Checking sender configuration in Brevo...');
    
    const response = await fetch('https://api.brevo.com/v3/senders', {
      method: 'GET',
      headers: {
        'api-key': brevoApiKey,
      },
    });

    const data = await response.json();

    if (response.ok) {
      const senders = data.senders || [];
      console.log(`✓ Found ${senders.length} configured sender(s)`);
      
      const matchingSender = senders.find(s => s.email === brevoSenderEmail);
      if (matchingSender) {
        console.log(`✓ Sender "${brevoSenderEmail}" is configured`);
        console.log('  Status:', matchingSender.status);
        console.log('  Verified:', matchingSender.verified ? '✓ Yes' : '❌ No - CHECK BREVO DASHBOARD');
      } else {
        console.log(`⚠ Sender "${brevoSenderEmail}" NOT found in Brevo`);
        console.log('  Available senders:');
        senders.forEach(s => {
          console.log(`    - ${s.email} (${s.status})`);
        });
        return false;
      }
      return true;
    } else {
      console.log('❌ Failed to fetch senders');
      console.log('  Error:', data.message || data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Sender check error:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  const test1 = await testApiKey();
  const test2 = await testSenderConfig();
  const test3 = await testEmailSend();

  console.log('\n' + '─'.repeat(50));
  console.log('\n📋 Summary\n');
  
  const results = {
    'API Key Valid': test1,
    'Sender Configured': test2,
    'Email Send': test3,
  };

  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✓' : '❌'} ${test}`);
  });

  if (test1 && test2 && test3) {
    console.log('\n✓ All tests passed! Your email system is working correctly.');
    console.log('\n✅ Next steps:');
    console.log('  1. Check your email inbox for the test message');
    console.log('  2. Try subscribing to the newsletter from your website');
    console.log('  3. Monitor the server console for email logs');
  } else {
    console.log('\n❌ Some tests failed. See errors above.');
    console.log('\n🔧 Troubleshooting:');
    if (!test1) console.log('  - Verify BREVO_API_KEY in .env.local');
    if (!test2) console.log('  - Verify sender email is added in Brevo dashboard');
    if (!test3) console.log('  - Check Brevo dashboard for sender verification status');
  }
}

runAllTests().catch(console.error);
