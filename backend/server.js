import dotenv from 'dotenv';
import connectDb from './config/database.js';
import app from './app.js';
dotenv.config({ path: './config/config.env' });
const port = process.env.PORT || 4000;
connectDb();

app.listen(port, (req, res) => {
  console.log(`server is working on ${port}`);
});
