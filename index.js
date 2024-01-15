// app.js
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require('body-parser');
const fileRoutes = require('./routes/fileRoutes');

const app = express();
const port = 3000;

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

mongoose.connect("mongodb://localhost:27017/fileupload", {
    useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

app.use('/api', fileRoutes);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
