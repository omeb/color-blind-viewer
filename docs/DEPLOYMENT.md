# Deployment Guide

This guide will help you deploy the Colorblind Viewer app to production.

## Quick Deploy to Vercel (Recommended - 2 minutes)

Vercel is the easiest and recommended way to deploy this Next.js app.

### Option 1: Deploy via GitHub (Automatic Deployments)

1. **Push to GitHub** (already done! ✓)
   - Your repo is at: https://github.com/omeb/color-blind-viewer

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "Add New Project"
   - Import `omeb/color-blind-viewer`
   - Click "Deploy"

3. **Done!**
   - Your app will be live in ~2 minutes
   - You'll get a URL like: `color-blind-viewer.vercel.app`
   - Every push to `main` will auto-deploy

### Option 2: Deploy via CLI

```bash
# Install Vercel CLI (one time)
npm install -g vercel

# Deploy
cd /path/to/colorblind
vercel --prod
```

Follow the prompts, and you'll get a live URL instantly.

## Configuration (Optional)

### Custom Domain

1. In Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Follow DNS instructions

### Environment Variables

This app doesn't require any environment variables! Everything works out of the box.

## Alternative Deployment Options

### Netlify

1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub and select your repo
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
5. Deploy

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t colorblind-viewer .
docker run -p 3000:3000 colorblind-viewer
```

### AWS Amplify

1. Go to AWS Amplify Console
2. Connect your GitHub repo
3. Configure build settings:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
   ```
4. Deploy

## Local Testing Before Deploy

Always test locally first:

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000

# Run tests
npm test

# Build for production
npm run build

# Test production build locally
npm start
```

## Monitoring & Troubleshooting

### Check Build Logs

- **Vercel**: Dashboard → Deployments → Click deployment → View logs
- **Netlify**: Site Dashboard → Deploys → Click deploy → View logs

### Common Issues

**Issue**: Build fails with "Cannot find module"
- **Solution**: Make sure all dependencies are in `package.json` and run `npm install` locally first

**Issue**: Website proxy not working
- **Solution**: Check that API routes are properly configured in Next.js. The `/api/proxy` route must be accessible.

**Issue**: Styles not loading
- **Solution**: Clear browser cache and rebuild with `npm run build`

## Performance Optimization

### Vercel Edge Functions

Your API routes automatically use Vercel Edge Functions for global performance.

### Caching

The proxy API has caching disabled for fresh content, but you can enable it:

```javascript
// In app/api/proxy/route.js
headers: {
  'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
}
```

## Security Considerations

✅ **Already Implemented**:
- URL validation to block localhost/private IPs
- CORS headers properly configured
- No sensitive data stored
- HTTPS enforced by default on Vercel

⚠️ **Consider Adding** (for production at scale):
- Rate limiting (use Vercel's rate limit API)
- Request logging (use Vercel Analytics)
- Error tracking (Sentry, LogRocket)

## Cost Estimation

### Vercel Free Tier Includes:
- Unlimited deployments
- Automatic HTTPS
- 100GB bandwidth/month
- Serverless function execution
- Preview deployments for PRs

**This app will stay in free tier** unless you get massive traffic (>100k requests/month).

### Scaling

If you need to scale beyond free tier:
- Vercel Pro: $20/month (1TB bandwidth)
- Add rate limiting to prevent abuse
- Consider CDN for static assets

## Post-Deployment Checklist

- [ ] Test all features on live site
- [ ] Test on mobile devices
- [ ] Run accessibility audit (Chrome DevTools)
- [ ] Check all external links work
- [ ] Test with real colorblind filters
- [ ] Share with users for feedback

## Support

If you encounter issues:
1. Check build logs
2. Test locally with `npm run build && npm start`
3. Review Vercel/Netlify documentation
4. Open a GitHub issue

## Next Steps

Once deployed, you can:
- Add Google Analytics (optional)
- Set up custom domain
- Enable preview deployments for branches
- Add more vision impairment filters
- Create a browser extension version

---

**Ready to deploy?** Just follow Option 1 above - it takes 2 minutes! 🚀

