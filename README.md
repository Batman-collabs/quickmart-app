# QuickMart — 10-Minute Quick-Commerce App

A Zepto / Swiggy Instamart inspired quick-commerce mobile & web app built with **React Native (Expo)** and **TypeScript**.

## Features
- **Home Screen:** Delivery ETA header, free-delivery progress bar, `ZEPTO50` promo banner, Flash Deals horizontal carousel, 8-category grid, and Bestsellers.
- **Categories Split-View:** Vertical category rail with sorted product grid (`Popular`, `Price: Low to High`, `Max Discount`).
- **Search & Saved:** Live search across products and brands, trending search chips, and wishlist filter.
- **Cart & Checkout:** Floating cart bar, quick add-ons, promo coupons (`ZEPTO50`, `FIRST10`, `FREEDEL`), itemized bill summary, address picker, and payment selector.
- **Live Order Tracking:** Real-time countdown timer, 5-stage progress tracker, rider card, and 1-tap Reorder.

## Run Locally
```bash
npm install
npx expo start        # Mobile (Expo Go)
npx expo start --web  # Web browser
```

## Build Web Bundle & Serve
```bash
npx expo export --platform web --output-dir dist-web
node server.js
```
