const express = require("express");
const server = express();
const path = require('path');
require('dotenv').config();

server.use(express.static(path.join(__dirname,"../../frontend")));

const links = [
  "/",
  "/dashboard",
  "/entries",
  "/gallery",
  "/contacts",
  "/passwords",
  "/login",
  "/home",
  "/signup",
];

function renderPage(res, link) {
  res.sendFile(path.join(__dirname, `../${link.toLowerCase()}.html`));
}

links.forEach((link) => {
  server.get(`/${link.toLowerCase()}`, (req, res) => {
    renderPage(res, "index");
  });
});

module.exports = server;