// app.js

const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const bodyParser = require('body-parser');
const app = express();
const port = 3000;


// Increase the payload limit to handle large files
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));


// MongoDB connection
mongoose.connect("mongodb://localhost:27017/fileupload", {
    // useNewUrlParser: true,
    useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

// Define a schema for the file metadata
const fileSchema = new mongoose.Schema({
    fileId: { type: String, required: true, unique: true },
    filename: { type: String, required: true },
    uploadDate: { type: Date, default: Date.now },
});

const File = mongoose.model("File", fileSchema);

// Multer storage configuration
const storage = multer.diskStorage({
    destination: "./uploads",
    filename: async (req, file, cb) => {
        // Generate a unique fileId for the file
        const fileId =
            Date.now().toString(36) + Math.random().toString(36).substr(2);
        const filename = fileId + "-" + "data-ext";
        cb(null, filename);

        // Save metadata to MongoDB
        const newFile = new File({
            fileId: fileId,
            filename: filename,
        });
        await newFile.save();
    },
});

const upload = multer({ storage: storage });

// API endpoint for file upload
app.post("/upload", upload.single("file"), (req, res) => {
    res.json({ fileId: req.file.filename,filename: req.file.filename, });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
