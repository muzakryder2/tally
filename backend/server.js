import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/connectDB.js";
import listRoutes from "./routes/listRoutes.js";
import { clerkMiddleware } from "@clerk/express";

const port = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());

app.use("/api/lists", listRoutes);

app.use(express.static(path.join(__dirname, "../frontend/dist")));
app.get("*any", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

connectDB();
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
