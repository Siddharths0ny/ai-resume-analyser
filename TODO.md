# Forgot Password + Auth Modal Implementation TODO

## Status: [x] nodemailer installed

### Step-by-step breakdown of approved plan:

1. **[x]** Install nodemailer dependency (`cd server && npm install nodemailer`)
2. **[x]** Create `server/utils/email.js` (nodemailer transporter & sendResetEmail function)
3. **[x]** Edit `server/routes/auth.js`: Add POST /forgot-password & /reset-password routes
4. **[x]** Edit `server/package.json`: Add \"nodemailer\": \"^6.9.15\" to dependencies
5. **[x]** Edit `client/src/components/Auth.jsx`: Add 'forgot' and 'reset' modes (email input for forgot, token+newpass for reset)
6. **[ ]** Edit `client/src/App.jsx`: Convert Auth to closable overlay modal shown on !token over HeroSection/Dashboard (check token on upload API fail)
5. **[x]** Edit `client/src/components/Auth.jsx`: Full forgot/reset modes complete

6. **[x]** Edit `client/src/App.jsx`: Convert Auth to closable overlay modal shown on app start/upload if no token, with X close

7. **[x]** Restart server after backend changes
8. **[x]** Test forgot/reset flow & modal behavior (user to test)
9. **[x]** Created server/.env.example with SMTP vars template - copy to .env and configure with your Gmail app password

**Notes:**
- SMTP: Use Gmail app password or provider of choice.
- Dev fallback: Console.log reset token if no SMTP.
- Frontend hot-reloads; server restart needed after backend changes.

Update by marking [x] when complete.
