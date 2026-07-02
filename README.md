# מעקב הון אישי — Personal Finance Dashboard

אפליקציית ווב למעקב אחר שווי נכסים והתחייבויות, עם לוח בקרה ויזואלי, גרפים, וחיסכון חודשי. רצה כולה כאתר סטטי על GitHub Pages — ללא שרת, ללא בסיס נתונים. הנתונים נשמרים בדפדפן (localStorage), עם אפשרות לייצוא/ייבוא קובץ גיבוי JSON.

## פיתוח מקומי

```bash
npm install
npm run dev
```

## בנייה

```bash
npm run build
```

## טכנולוגיות

React + Vite, Tailwind CSS, Zustand, Recharts, Framer Motion.

## פריסה

פריסה אוטומטית ל-GitHub Pages בכל push ל-`main`, דרך `.github/workflows/deploy.yml`.
