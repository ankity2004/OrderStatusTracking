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

// Delete webhook data from index to index
app.delete('/data/:fromIndex/:toIndex', (req, res) => {
  try {
    const fromIndex = parseInt(req.params.fromIndex);
    const toIndex = parseInt(req.params.toIndex);
    
    if (isNaN(fromIndex) || isNaN(toIndex)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid indices. Both fromIndex and toIndex must be numbers.'
      });
    }
    
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= webhookData.length || toIndex >= webhookData.length) {
      return res.status(400).json({
        success: false,
        message: 'Indices out of range.'
      });
    }
    
    if (fromIndex > toIndex) {
      return res.status(400).json({
        success: false,
        message: 'fromIndex should be less than or equal to toIndex.'
      });
    }
    
    const deletedItems = webhookData.splice(fromIndex, toIndex - fromIndex + 1);
    
    res.json({
      success: true,
      message: `Deleted ${deletedItems.length} items from index ${fromIndex} to ${toIndex}`,
      deletedCount: deletedItems.length,
      remainingCount: webhookData.length
    });
    
  } catch (error) {
    console.error('❌ Error deleting data:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting data'
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
});
// For Vercel deployment
module.exports = app;
