# Deploy Behavioral Auth to Vercel

## 🚀 Quick Deployment Steps

### 1. Update CORS Origins
Edit each file in `api/behavior/` and replace:
```javascript
origin: ['https://your-vercel-domain.vercel.app', 'http://localhost:5173'],
```
With your actual Vercel domain:
```javascript
origin: ['https://your-app-name.vercel.app', 'http://localhost:5173'],
```

### 2. Deploy to Vercel
```bash
# Commit and push to GitHub
git add api/ vercel.json src/services/behaviorAuthService.ts
git commit -m "Add behavioral auth serverless functions"
git push origin main

# Or deploy directly
vercel --prod
```

### 3. Test Deployment
```bash
# Test health endpoint
curl https://your-app-name.vercel.app/api/behavior/health

# Test verification endpoint
curl -X POST https://your-app-name.vercel.app/api/behavior/verify \
  -H "Content-Type: application/json" \
  -d '{"snapshot":{"mouseMoveCount":156,"keyPressCount":42,"timeOnPageSeconds":127.3,"mouseMoveRate":1.225,"keyPressRate":0.33,"interactionBalance":0.576,"interactionScore":0.779,"idleRatio":0.234,"sessionId":"test-123","captureTimestamp":"2026-02-10T05:20:00.000Z"}}'
```

## 📁 File Structure After Deployment
```
your-project/
├── src/ (React app)
├── api/
│   └── behavior/
│       ├── health.js     ✅ Health check
│       ├── verify.js     ✅ Human/bot detection
│       ├── log.js        ✅ Data logging
│       └── failed.js    ✅ Failed attempts
├── vercel.json          ✅ Vercel config
└── package.json         ✅ Dependencies
```

## 🔧 Environment Variables (Optional)
Set in Vercel dashboard:
- `VITE_BEHAVIOR_API_BASE` (if custom API endpoint needed)

## 📊 Monitoring
- Check Vercel Functions logs for API requests
- Monitor behavior patterns in Supabase
- Set up alerts for high bot detection rates

## 🔄 Next Steps
1. Deploy Python ML model to Railway/Render
2. Update serverless functions to call real ML endpoint
3. Set up database logging to Supabase
4. Configure monitoring and alerts

## 🎯 Benefits of Vercel Deployment
- ✅ Same domain as React app (no CORS)
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Built-in rate limiting
- ✅ Server logs and monitoring
- ✅ Free tier available
- ✅ Easy deployment with git push
