import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);


import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import cors from "cors";
import path from "path";
import { Server } from "socket.io";

import connectDB from "./config/db.js";
import apiRoutes from "./routes/api.js";
import { setupSocketHandlers } from "./socket/handlers.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(cors({ origin: "*" }));
app.use(express.json());

// REST API
app.use("/api", apiRoutes);

// Serve React build in production
// Uncomment when deploying
// app.use(express.static(path.join(process.cwd(), "public")));
// app.get("*", (req, res) => res.sendFile(path.join(process.cwd(), "public", "index.html")));

setupSocketHandlers(io);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(` NEXUS RAIL Server  →  http://localhost:${PORT}`);
    console.log(` Socket.io          →  ws://localhost:${PORT}`);
    console.log(` MongoDB            →  connected\n`);
  });
});