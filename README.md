# USV Events Manager

O platformă centralizată pentru gestionarea evenimentelor universitare în cadrul Universității Ștefan cel Mare din Suceava (USV). Aplicația permite studenților să descopere și să se înscrie la evenimente, iar organizatorilor și administratorilor să le gestioneze eficient.

## 🚀 Funcționalități Principale

### 🎓 Student
- **Dashboard:** Vizualizare evenimente (Toate, Înscrieri, Favorite).
- **Interacțiune:** Înscriere/Anulare înscriere la evenimente, adăugare la favorite.
- **Profil:** Gestionare date personale, setare interese pentru recomandări.
- **Feedback:** Posibilitatea de a lăsa recenzii și note evenimentelor finalizate.

### 📋 Organizator
- **Management Evenimente:** Creare, editare și ștergere evenimente.
- **Flux Aprobare:** Trimiterea evenimentelor "Draft" spre aprobare către Admini.
- **Participanți:** Vizualizare listă participanți, filtrare.
- **Check-in:** Sistem de check-in rapid pe baza biletului/numelui.
- **Materiale:** Încărcare resurse (PDF, PPT) pentru participanți.

### 🛡️ Admin
- **Validare:** Aprobare sau respingere evenimente propuse (cu motivare).
- **Utilizatori:** Gestionare roluri utilizatori (promovare studenți la organizatori).
- **Structură:** Gestionare Facultăți și Departamente.

## 🛠️ Tehnologii Utilizate

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS
- **State Management:** React Context API (`AuthContext`)
- **API Communication:** Fetch API (servicii modulare)
- **Deployment:** Vercel

## 📦 Instalare și Rulare Locală

1. **Clonează repository-ul:**
   ```bash
   git clone <repository-url>
   cd usv-events
   ```

2. **Instalează dependențele:**
   ```bash
   npm install
   ```

3. **Configurează API-ul:**
   URL-ul API-ului este definit în `constants.ts`. Dacă dorești să lucrezi cu un backend local, modifică constanta:
   ```typescript
   export const API_BASE_URL = 'http://localhost:5000/api/v1'; // Exemplu local
   ```

4. **Pornește serverul de dezvoltare:**
   ```bash
   npm run dev
   ```
   Aplicația va rula la `http://localhost:3000`.

## 📂 Structura Proiectului

- `/components`: Componente UI reutilizabile și specifice fiecărui rol (auth, admin, student, organizer).
- `/context`: Gestionarea stării globale (Autentificare).
- `/services`: Logica de comunicare cu API-ul (auth, events, users, files).
- `/types`: Definiții TypeScript și interfețe pentru date.

## 🚀 Deployment

Aplicația este configurată pentru a fi găzduită pe **Vercel**.
Fișierul `vercel.json` gestionează rescrierea rutelor pentru SPA (Single Page Application).
