import express from "express";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 8080;
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
