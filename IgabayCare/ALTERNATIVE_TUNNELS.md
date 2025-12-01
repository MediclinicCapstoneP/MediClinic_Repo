# Free Alternatives to ngrok

## 🎯 Option 2: tunnelto.dev (Free, No Account Required)

### Setup:
```bash
# Install tunnelto
npm install -g tunnelto

# Start your app
npm run dev

# Create tunnel
tunnelto 5173
```

### Output:
```
Your tunnel is available at: https://abc123.tunnelto.org
```

### PayMongo Webhook URL:
```
https://abc123.tunnelto.org/api/paymongo-webhook
```

## 🎯 Option 3: localtunnel (Free)

### Setup:
```bash
# Install localtunnel
npm install -g localtunnel

# Start your app
npm run dev

# Create tunnel
lt --port 5173
```

### Output:
```
your url is: https://abc123.loca.lt
```

### PayMongo Webhook URL:
```
https://abc123.loca.lt/api/paymongo-webhook
```

## 🎯 Option 4: cloudflare tunnel (Free)

### Setup:
```bash
# Install cloudflared
npm install -g cloudflared

# Start tunnel
cloudflared tunnel --url http://localhost:5173
```

## 🏆 Recommendation: Supabase Edge Functions

**Best option for production:**
- ✅ No local setup needed
- ✅ Always available
- ✅ Secure and scalable
- ✅ Built-in logging

**Quick setup:**
```bash
supabase functions deploy paymongo-webhook
```

**Webhook URL:**
```
https://ovcafionidgcipmloius.supabase.co/functions/v1/paymongo-webhook
```
