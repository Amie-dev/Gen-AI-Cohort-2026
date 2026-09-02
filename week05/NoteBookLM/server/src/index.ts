import express from "express";
import "dotenv/config";
import { auth } from "./lib/auth.js";
import {toNodeHandler} from "better-auth/node"

const app = express();
const PORT = process.env.PORT || 8080;

app.all('/api/auth/{*any}', toNodeHandler(auth));
app.use(express.json())
app.get("/", (req, res) => {
  res.send("Hello world");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    message: "Server is up an running",
    statusCode: 200,
    status:"ok"
  });
});

app.listen(PORT, () => {
  console.log(`server is running at 8080`);
});
