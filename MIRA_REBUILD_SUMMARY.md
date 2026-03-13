# MIRA AI Landing Page - Full Rebuild Summary

## 🎯 Project Overview

Complete replacement of the MIRA AI landing page based on the provided HTML template (`/src/imports/mira-full-landing.html`). This is a comprehensive React rebuild with:

- **Premium minimal design** (inspired by Apple, Linear, Notion aesthetics)
- **8-step financial assessment** with 22 questions total
- **Scoring algorithm** for financial health
- **3-tier pricing system** (Personal/Duo/Combo) with 3 duration options each
- **Voucher system** with discount codes
- **WhatsApp registration** integration
- **Webhook integration** for payment processing

---

## 📁 File Structure Created

### Core Application
- `/src/app/App.tsx` - Main application entry point

### Styles
- `/src/styles/mira-theme.css` - Color system and base theme
- `/src/styles/mira-landing.css` - Global landing page styles

### Landing Page Components
```
/src/app/components/
├── Loader.tsx / Loader.css              # Animated loading screen
├── Navigation.tsx / Navigation.css      # Fixed navigation with scroll effects
├── Hero.tsx / Hero.css                  # Hero with rotating headlines & chat mockup
├── ValueProps.tsx / ValueProps.css      # 3-card value proposition section
├── Process.tsx / Process.css            # 4-step process showcase
├── Stats.tsx / Stats.css                # Stats section with gradient background
├── Testimonials.tsx / Testimonials.css  # 6 testimonial cards
├── Compare.tsx / Compare.css            # Comparison table (MIRA vs others)
├── FAQ.tsx / FAQ.css                    # Accordion FAQ section
├── Upsell.tsx / Upsell.css             # Final CTA section
└── Footer.tsx / Footer.css              # Footer with links
```

### Modal & Assessment System
```
/src/app/components/
├── Modal.tsx / Modal.css                # Main modal controller
└── modal/
    ├── AssessmentPanel.tsx / .css       # Assessment orchestration
    ├── OutcomesPanel.tsx / .css         # Results & scoring display
    ├── PricingPanel.tsx / .css          # Plan selection
    ├── WAPanel.tsx / .css               # WhatsApp number input
    ├── assessmentData.ts                # 8 steps, 22 questions structure
    ├── pricingData.ts                   # 3 plans x 3 durations
    ├── scoring.ts                       # Financial health algorithm
    └── questions/
        ├── RadioQuestion.tsx            # Single choice questions
        ├── CheckboxQuestion.tsx         # Multiple choice questions
        ├── RatioSlider.tsx              # Spending vs Saving slider
        ├── CheckboxGrouped.tsx          # Grouped checkboxes (banks)
        ├── RankingQuestion.tsx          # Drag-to-rank payment methods
        └── Questions.css                # Shared question styles
```

---

## 🎨 Design System

### Colors
```css
--blue: #2D4BFF
--blue-dark: #1F35B8
--blue-light: #6C82FF
--blue-ultra: #E9EDFF
--cyan: #22D3EE
--gradient: linear-gradient(135deg, #2D4BFF 0%, #22D3EE 100%)
```

### Typography
- **Headings**: Sora (800 weight)
- **Body**: DM Sans (400, 500 weights)

---

## 🧮 Assessment Flow

### Step 1: Pemasukan (Income Stability)
- Q1: Income range
- Q2: Income type (fixed/freelance)
- Q3: Payment schedule

### Step 2: Kewajiban (Obligations)
- Q4: Monthly obligations %
- Q5: Obligation types (multiple choice)

### Step 3: Pengeluaran (Spending Behavior)
- Q6: Where money goes
- Q7: Impulse buying frequency
- Q8: E-wallet micro-transactions

### Step 4: Tabungan (Savings)
- Q9: Saving habits
- Q10: **Ratio Slider** - Spending vs Saving %
- Q11: Saving goals (multiple choice)

### Step 5: Dana Darurat (Emergency Fund)
- Q12: Emergency fund coverage

### Step 6: Investasi (Investment)
- Q13: Investment status
- Q14: Investment instruments
- Q15: Investment % of income

### Step 7: Hutang (Debt)
- Q16: Active debt/installments
- Q17: PayLater/credit card usage
- Q18: PayLater triggers

### Step 8: Pembayaran (Payment Methods)
- Q19: **Grouped Checkboxes** - Banks (BUMN, Private, Digital, Syariah)
- Q20: E-wallets (multiple choice)
- Q21: PayLater/Credit cards (multiple choice)
- Q22: **Drag Ranking** - Most-used payment method order

---

## 📊 Scoring Algorithm

Located in `/src/app/components/modal/scoring.ts`

### Dimensions (Total: 100 points)
- **Income Stability**: 0-15 points
- **Expense Pressure**: 0-15 points (lower = better)
- **Spending Control**: 0-15 points
- **Saving Discipline**: 0-15 points
- **Emergency Fund**: 0-10 points
- **Investment**: 0-10 points
- **Debt Risk**: 0-10 points
- **Behavior**: 0-10 points

### Categories
- **0-40**: 🔴 Rentan (Vulnerable)
- **41-60**: 🟠 Perlu Perhatian (Needs Attention)
- **61-80**: 🟢 Cukup Sehat (Fairly Healthy)
- **81-100**: 💎 Sangat Sehat (Very Healthy)

### Daily Limit Calculation
```typescript
calcDailyLimit(income, answers) {
  expRatio = answers.q4 percentage
  savRatio = 100 - answers.q10_ratio
  remaining = income * (1 - expRatio - savRatio)
  return remaining / 20 days
}
```

---

## 💰 Pricing Structure

Located in `/src/app/components/modal/pricingData.ts`

### Personal Plan (👤)
- 1 member
- 3mo: Rp69K (Rp23K/mo)
- 6mo: Rp109K (Rp18K/mo) - **Save 22%**
- 12mo: Rp199K (Rp16.5K/mo) - **Save 28%** ⭐

### Duo Plan (👥)
- 2 members
- 3mo: Rp99K (Rp16.5K/person/mo)
- 6mo: Rp179K (Rp14.9K/person/mo) - **Save 10%**
- 12mo: Rp349K (Rp14.5K/person/mo) - **Best Value** ⭐

### Combo Plan (🔥)
- 5 members
- 3mo: Rp179K (Rp11.9K/person/mo)
- 6mo: Rp299K (Rp9.97K/person/mo) - **Save 16%**
- 12mo: Rp599K (Rp9.98K/person/mo) - **BEST DEAL** ⭐

---

## 🎫 Voucher System

Located in `/src/app/components/modal/PricingPanel.tsx`

```typescript
const VOUCHER_CODES = {
  'MIRA10': 10,      // 10% discount
  'HEMAT20': 20,     // 20% discount
  'COBAMIRA': 15     // 15% discount
}
```

---

## 📱 WhatsApp Integration

### Registration Webhook
**Endpoint**: `https://n8n-nkpskgzjoaqk.jkt1.sumopod.my.id/webhook/register-mira`

**Parameters**:
- `plan`: personal | duo | combo
- `duration`: 3 | 6 | 12
- `amount`: final price after discount
- `wa`: comma-separated phone numbers (+62xxx,+62yyy)
- `voucher`: voucher code (if applied)

### Payment Transaction Webhook
**Endpoint**: `https://n8n-nkpskgzjoaqk.jkt1.sumopod.my.id/webhook/create-transaction`

---

## 🎯 Key Features

### 1. Loader Animation
- Animated MIRA logo
- Progress bar with easing
- "#SemuaMudah" tagline
- 1.3s duration

### 2. Rotating Headlines
Hero section cycles through 3 headlines every 2.8s:
1. "Kelola Uang dengan Cerdas."
2. "Lihat Ke Mana Uangmu Pergi."
3. "Pengeluaran Terpantau."

### 3. WhatsApp Chat Mockup
Live example showing:
- User sends transaction ("Belanja supermarket Rp185.000")
- MIRA auto-categorizes
- Running total displayed

### 4. Scroll Reveal Animations
All sections use IntersectionObserver for smooth entry animations

### 5. FAQ Accordion
5 questions with expandable answers

### 6. Comparison Table
7-point comparison: MIRA vs Traditional Apps

---

## 🔧 Technical Details

### Question Types Implemented
1. **Radio** - Single choice
2. **Checkbox** - Multiple choice
3. **Ratio Slider** - Interactive percentage slider
4. **Checkbox Grouped** - Categorized multi-select (banks)
5. **Ranking** - Drag-and-drop ordering

### State Management
- React hooks (useState, useEffect)
- Props drilling for modal panels
- Scroll state for navigation

### Animations
- CSS transitions & keyframes
- IntersectionObserver for scroll reveals
- Transform-based shake animation for validation errors

### Responsive Design
- Mobile-first approach
- Breakpoint: 768px
- Simplified layouts on mobile
- Touch-friendly interactions

---

## 🚀 Usage

### Opening Modal
```tsx
<button onClick={() => setModalOpen(true)}>
  Coba Gratis
</button>
```

### Panel Flow
1. **Assessment** → User answers 22 questions
2. **Outcomes** → Display score, insights, recommendations
3. **Pricing** → Select plan & duration, apply voucher
4. **WhatsApp** → Input phone numbers
5. **Payment** → Redirect to webhook with params

### Sample Webhook Call
```
https://n8n-nkpskgzjoaqk.jkt1.sumopod.my.id/webhook/register-mira?
  plan=personal&
  duration=12&
  amount=199000&
  wa=+6281234567890&
  voucher=MIRA10
```

---

## 📝 Content (Bahasa Indonesia)

### Tagline
"#SemuaMudah — Asisten Keuangan 24/7"

### Value Props
1. **Catat Anti Ribet** - WhatsApp-based input
2. **Pembukuan Otomatis** - Auto-categorization
3. **Laporan Instan** - Excel export

### Stats
- **12,732+** Pengguna Aktif
- **Rp11,1M+** Pengeluaran Terdokumentasi

---

## ✅ Completion Checklist

### Landing Sections
- [x] Loader animation
- [x] Navigation (fixed, scroll effects)
- [x] Hero (rotating headlines, chat mockup)
- [x] Value Props (3 cards)
- [x] Process (4 steps)
- [x] Stats (gradient background)
- [x] Testimonials (6 cards)
- [x] Comparison table
- [x] FAQ (5 questions)
- [x] Final upsell
- [x] Footer

### Modal System
- [x] Modal container with panels
- [x] Assessment Panel (8 steps, 22 questions)
- [x] All 5 question types
- [x] Outcomes Panel (scoring, insights)
- [x] Pricing Panel (3 plans, vouchers)
- [x] WhatsApp Panel (number input)
- [x] Webhook integration

### Interactivity
- [x] Scroll reveal animations
- [x] FAQ accordion
- [x] Modal open/close
- [x] Form validation
- [x] Drag-and-drop ranking
- [x] Ratio slider
- [x] Voucher validation

---

## 🎨 Design Philosophy

**Ultra-minimal, Premium, Typography-driven**

- No template-like gradients or blobs
- Extensive whitespace
- Strong hierarchy with Sora headings
- Subtle shadows and borders
- Professional blue gradient (#2D4BFF → #22D3EE)
- Apple/Linear/Notion-inspired aesthetics

---

## 🔄 Next Steps (Optional Enhancements)

1. **Add micro-interactions** to buttons
2. **Implement actual payment gateway** instead of direct webhook
3. **Add form persistence** (localStorage)
4. **Email confirmation** after registration
5. **A/B testing** for headlines
6. **Analytics integration** (Google Analytics, Mixpanel)
7. **SEO optimization** (meta tags, structured data)
8. **Performance optimization** (lazy loading, code splitting)

---

## 📄 License & Attribution

Built for MIRA AI - Asisten Keuangan WhatsApp
© 2026 MIRA. All Rights Reserved.

---

**Built with React, TypeScript, and CSS3**
**Design System: Sora + DM Sans fonts, Custom CSS Variables**
**No UI libraries used (except core React)**
