# פונקציית Edge — זיהוי חכם מובנה (Gemini)

הפונקציה `gemini` מחזיקה את מפתח ה-Gemini **בשרת** ומתווכת אליו רק עבור משתמשים
מחוברים. כך הזיהוי החכם "מובנה" ומשותף לכל מי שנכנס לחשבון — בלי שאיש יזין מפתח
משלו, ובלי לחשוף את המפתח באתר הציבורי.

## התקנה חד-פעמית

### דרך לוח הבקרה (מומלץ, בלי CLI)

1. פותחים את הפרויקט ב-[supabase.com](https://supabase.com) → **Edge Functions**.
2. **Create a new function**, קוראים לה בדיוק `gemini`.
3. מדביקים את כל תוכן `gemini/index.ts` לעורך ולוחצים **Deploy**.

   > **שימו לב:** לפעמים לוח הבקרה של Supabase לא מכבד את השם שהוזן בשדה
   > "Function name" לפני הפריסה, ומשאיר את השם האוטומטי שהוצע (למשל
   > `clever-worker`). בודקים בכתובת ה-**Invoke function** בעמוד הפונקציה מה השם
   > בפועל, ואם הוא שונה מ-`gemini` — מעדכנים את הקבוע `AI_FUNCTION_NAME` בראש
   > `src/services/sync.js` לשם הנכון.

4. **Edge Functions → Secrets** (או Project Settings → Edge Functions) → מוסיפים סוד:
   - שם: `GEMINI_API_KEY`
   - ערך: מפתח Gemini חינמי מ-[aistudio.google.com](https://aistudio.google.com) → *Get API key*.

זהו. מעכשיו כל משתמש מחובר (אתם, בן/בת הזוג, וכל חבר שתוסיפו) נהנה מהזיהוי
אוטומטית, בלי להזין מפתח בשום מכשיר.

### דרך ה-CLI (חלופה)

```bash
supabase login
supabase link --project-ref <PROJECT_REF>
supabase functions deploy gemini
supabase secrets set GEMINI_API_KEY=<המפתח>
```

## איך זה עובד

- הלקוח קורא ל-`<SUPABASE_URL>/functions/v1/gemini` עם ה-JWT של המשתמש המחובר.
- הפונקציה מאמתת שזה משתמש אמיתי (`auth.getUser`) — מפתח ה-anon הציבורי נדחה.
- היא מוסיפה את `GEMINI_API_KEY` (מהסביבה) ומעבירה את הבקשה ל-Gemini, ומחזירה את
  התשובה כמות שהיא (כולל קוד הסטטוס).
- אם משתמש בכל זאת הזין מפתח פרטי משלו בהגדרות — הבקשה יוצאת ישירות לגוגל עם המפתח
  הזה, בלי הפרוקסי.

> משתני הסביבה `SUPABASE_URL` ו-`SUPABASE_ANON_KEY` מוזרקים אוטומטית לפונקציה — אין
> צורך להגדיר אותם. רק `GEMINI_API_KEY` צריך הגדרה ידנית.
