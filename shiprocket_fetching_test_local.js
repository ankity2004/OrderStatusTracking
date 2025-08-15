// index.js - Simple Shiprocket Webhook Receiver
const express = require('express');
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Store webhook data in memory (for demo purposes)
let webhookData = [];

// Configuration
const PORT = process.env.PORT || 3000;

// Main webhook endpoint - receives data from Shiprocket
app.post('/webhook', (req, res) => {
  try {
    console.log('🔔 Webhook received from Shiprocket');
    
    // Store the webhook data
    const receivedData = {
      timestamp: new Date().toISOString(),
      headers: req.headers,
      body: req.body,
      query: req.query
    };
    
    // Add to beginning of array (latest first) and keep only last 50 entries
    webhookData.unshift(receivedData);
    if (webhookData.length > 50) {
      webhookData = webhookData.slice(0, 50);
    }
    
    console.log('Received data:', JSON.stringify(req.body, null, 2));
    
    // Respond to Shiprocket
    res.status(200).json({ 
      success: true, 
      message: 'Webhook received successfully' 
    });
    
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error processing webhook' 
    });
  }
});

// Display webhook data in browser as JSON
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json({
    message: "Shiprocket Webhook Receiver",
    webhook_endpoint: "/webhook",
    total_webhooks_received: webhookData.length,
    latest_webhooks: webhookData
  });
});

// Alternative endpoint to view data with better formatting
app.get('/data', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Shiprocket Webhook Data</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .webhook-item { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
            .timestamp { color: #666; font-size: 14px; }
            pre { background: #f5f5f5; padding: 10px; border-radius: 3px; overflow-x: auto; }
            .no-data { text-align: center; color: #888; padding: 50px; }
        </style>
    </head>
    <body>
        <h1>Shiprocket Webhook Data</h1>
        <p>Total webhooks received: <strong>${webhookData.length}</strong></p>
        <div id="webhooks">
            ${webhookData.length === 0 ? 
              '<div class="no-data">No webhook data received yet</div>' :
              webhookData.map((webhook, index) => `
                <div class="webhook-item">
                    <div class="timestamp">Received: ${webhook.timestamp}</div>
                    <pre>${JSON.stringify(webhook.body, null, 2)}</pre>
                </div>
              `).join('')
            }
        </div>
        <script>
            // Auto-refresh every 10 seconds
            setTimeout(() => location.reload(), 10000);
        </script>
    </body>
    </html>
  `;
  res.send(html);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    webhooks_received: webhookData.length 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Shiprocket Webhook Receiver Started`);
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`🔗 Webhook URL: http://localhost:${PORT}/webhook`);
  console.log(`📊 View data: http://localhost:${PORT}/data`);
  console.log(`📋 Raw JSON: http://localhost:${PORT}/`);
});

// For Vercel deployment
module.exports = app;