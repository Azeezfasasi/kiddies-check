# SEO Implementation Guide - Ardor Aegis

## Overview
Your Next.js project has been configured with comprehensive SEO optimizations to improve visibility on Google and other search engines.

## ✅ Implemented SEO Features

### 1. **Metadata & Meta Tags**
- ✅ Root layout metadata with comprehensive tags
- ✅ Page-specific metadata for all major pages
- ✅ OpenGraph tags for social media sharing
- ✅ Twitter Card support
- ✅ Canonical URLs

**Files Updated:**
- `src/app/layout.js` - Root metadata with Open Graph and Twitter tags
- `src/app/page.js` - Home page metadata
- `src/app/about-us/page.js` - About Us metadata
- `src/app/services/page.js` - Services metadata
- `src/app/blog/page.js` - Blog metadata
- `src/app/gallery/page.js` - Gallery metadata
- `src/app/contact-us/page.js` - Contact Us metadata
- `src/app/available-programmes/page.js` - Programmes metadata

### 2. **Sitemap Generation**
- ✅ `src/app/sitemap.js` - Auto-generated XML sitemap with all major pages
- Lists all public pages with priority levels and change frequencies
- Helps Google discover and crawl your content

### 3. **Robots.txt**
- ✅ `public/robots.txt` - Basic robots.txt file
- ✅ `src/app/robots.ts` - Dynamic robots.ts route for proper serving

**Disallowed paths (kept private):**
- `/admin` - Admin pages
- `/dashboard` - Dashboard pages
- `/login` - Login pages
- `/register` - Registration pages
- `/api` - API routes

### 4. **Structured Data (JSON-LD)**
- ✅ `src/app/json-ld.jsx` - Organization schema markup
- Includes company information, contact details, and social links
- Helps search engines understand your business

**To use this feature:**
Update the JSON-LD file with:
- Actual company address
- Phone number
- Founder information
- Employee count
- Any other relevant business details

### 5. **Performance & Security Headers**
- ✅ DNS prefetch control
- ✅ Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- ✅ Referrer policy
- ✅ Image optimization with WebP/AVIF support
- ✅ Cache control headers

## 📋 Next Steps to Complete SEO Setup

### 1. **Environment Configuration**
Add to your `.env.local` file:
```env
NEXT_PUBLIC_BASE_URL=https://your-actual-domain.com
```

### 2. **Update JSON-LD Schema**
Edit `src/app/json-ld.jsx` and add your actual information:
```javascript
address: {
  streetAddress: 'Your Street Address',
  addressLocality: 'City',
  addressRegion: 'State',
  postalCode: 'Postal Code',
  addressCountry: 'NG'
},
contactPoint: {
  telephone: '+234-XXX-XXX-XXXX',
  email: 'contact@your-domain.com'
}
```

### 3. **Google Search Console**
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add your domain
3. Upload or submit the sitemap at: `https://your-domain.com/sitemap.xml`
4. Submit the robots.txt file

### 4. **Bing Webmaster Tools**
1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Add your site
3. Submit sitemap

### 5. **Social Media Tags**
Update the OpenGraph images in `src/app/layout.js`:
- Create high-quality images for sharing (1200x630 pixels)
- Upload to your CDN or Cloudinary
- Update image URLs in the metadata

### 6. **Local SEO (if applicable)**
Update `src/app/json-ld.jsx` with:
- Business address
- Phone number
- Business hours
- Service areas

### 7. **Additional Metadata for Dynamic Pages**
For blog posts and dynamic content, add metadata:

```javascript
export async function generateMetadata({ params }) {
  const post = await getPost(params.slug);
  
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://your-domain.com/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author],
    },
  };
}
```

## 🎯 SEO Checklist

- [ ] Set `NEXT_PUBLIC_BASE_URL` in `.env.local`
- [ ] Update JSON-LD schema with actual company information
- [ ] Create and upload OpenGraph images (1200x630px)
- [ ] Submit sitemap to Google Search Console
- [ ] Submit sitemap to Bing Webmaster Tools
- [ ] Verify domain ownership in Google Search Console
- [ ] Set preferred domain (www vs non-www)
- [ ] Set mobile-first indexing preference
- [ ] Create Google Business Profile (if local business)
- [ ] Add structured data for all dynamic pages
- [ ] Implement breadcrumb schema for better navigation
- [ ] Add FAQ schema if applicable
- [ ] Test metadata with [og.library](https://www.opengraph.xyz/)
- [ ] Monitor search performance in Search Console
- [ ] Set up Google Analytics 4 integration
- [ ] Check Core Web Vitals in PageSpeed Insights

## 📱 Technical SEO Features Enabled

1. **Responsive Design** - Tailwind CSS ensures mobile-friendly layout
2. **Fast Loading** - Next.js optimization & image compression
3. **Automatic Sitemap** - Updated on each build
4. **Canonical URLs** - Prevents duplicate content
5. **Security Headers** - Improves trustworthiness
6. **Open Graph** - Better social sharing
7. **Mobile Viewport** - Proper mobile meta tags

## 🔍 Testing & Monitoring

### Test Your SEO:
1. **Google Mobile-Friendly Test** - [Mobile Friendly Test](https://search.google.com/test/mobile-friendly)
2. **Page Speed Insights** - [PageSpeed Insights](https://pagespeed.web.dev/)
3. **Structured Data Testing** - [Schema.org Validator](https://validator.schema.org/)
4. **OpenGraph Preview** - [og.library](https://www.opengraph.xyz/)

### Monitor Performance:
1. Google Search Console - Track rankings and clicks
2. Google Analytics 4 - User behavior and conversions
3. Bing Webmaster Tools - Crawl and indexing stats

## 📝 Additional Recommendations

### For Blog Posts:
Add article schema metadata:
```javascript
{
  '@type': 'BlogPosting',
  headline: 'Article Title',
  description: 'Article description',
  image: 'article-image-url',
  datePublished: 'ISO-8601-date',
  dateModified: 'ISO-8601-date',
  author: 'Author Name'
}
```

### For Local Services:
Add LocalBusiness schema:
```javascript
{
  '@type': 'LocalBusiness',
  name: 'Ardor Aegis',
  areaServed: 'Service areas',
  priceRange: '$$',
  telephone: '+234-XXX-XXX-XXXX'
}
```

### Content Optimization:
- Use natural keywords in headings and paragraphs
- Keep title tags under 60 characters
- Keep meta descriptions under 160 characters
- Use descriptive image alt texts
- Create high-quality, original content
- Update content regularly for freshness

## 🚀 Deployment Checklist

Before deploying:
1. ✅ Build and test locally: `npm run build`
2. ✅ Check for any build warnings
3. ✅ Test metadata on localhost
4. ✅ Verify robots.txt is accessible at `/robots.txt`
5. ✅ Verify sitemap is accessible at `/sitemap.xml`
6. ✅ Deploy to production
7. ✅ Submit sitemap to search engines
8. ✅ Monitor in Search Console

## 📚 Resources

- [Next.js SEO Best Practices](https://nextjs.org/learn/seo/introduction-to-seo)
- [Google Search Central](https://developers.google.com/search)
- [Schema.org Documentation](https://schema.org/)
- [OpenGraph Protocol](https://ogp.me/)
- [Core Web Vitals Guide](https://web.dev/vitals/)

---

**Last Updated:** May 2026
**Status:** SEO foundation implemented and ready for optimization
