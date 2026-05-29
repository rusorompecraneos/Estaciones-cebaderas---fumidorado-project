import express from 'express';
import { join } from 'path';

import authRoutes from './routes/auth.routes.js';


const app = express();
const port = 3000;
// SET
app.set("view engine", 'ejs');
app.set("views", "views")

// USE
app.use(express.static('public'));	
// AUTHENTICATION.
app.use('/auth', authRoutes);

// GET 
app.get('/', (req, res) => res.redirect('/auth/role-select'));





//LISTEN
app.listen(port, () => {
  console.log(`Server running 🚀 at http://localhost:${port}`);
});