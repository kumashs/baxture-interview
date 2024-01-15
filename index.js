// app.js

const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const bodyParser = require('body-parser');
const fs = require('fs');

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

app.post('/:fileId', async (req, res) => {
    const { fileId } = req.params;
    const { operation, options } = req.body;

    try {
        // Validate the fileId and operation
        const file = await File.findOne({ fileId });

        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        if (!['countWords', 'countUniqueWords', 'findTopKWords'].includes(operation)) {
            return res.status(400).json({ error: 'Invalid operation' });
        }

        // Perform the analysis based on the specified operation
        let result;
        switch (operation) {
            case 'countWords':
                result = await countWords(file);
                console.log(result)
                break;
            case 'countUniqueWords':
                result = await countUniqueWords(file);
                break;
            case 'findTopKWords':
                const k = options && options.k ? options.k : 10; // Default to top 10
                result = await findTopKWords(file, k);
                break;
            default:
                break;
        }

        // Generate a unique taskId for tracking and retrieving the analysis results
        const taskId = generateTaskId();

        // Update the File model with the new task information
        await File.updateOne(
            { fileId },
            { $push: { tasks: { taskId, operation, options } } }
        );

        res.json({ taskId, result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Helper functions for analysis operations
async function countWords(file) {
    const content = await fs.promises.readFile(`./uploads/${file.filename}`,{encoding:'utf8'});
    const words = content.split(/\s+/); // Split by spaces
    const count = words.length;
    return { count };
}

async function countUniqueWords(file) {
    const content = await fs.promises.readFile(`./uploads/${file.filename}`,{encoding:'utf8'});
    const words = content.split(/\s+/); // Split by spaceses
    const uniqueWords = new Set(words);
    const count = uniqueWords.size;
    return { count };
}

async function findTopKWords(file, k) {
    const content = await fs.promises.readFile(`./uploads/${file.filename}`,{encoding:'utf8'});
    const words = content.split(/\s+/); // Split by spaces
    console.log(words)
    const wordCountMap = {};
    words.forEach((word) => {
        wordCountMap[word] = (wordCountMap[word] || 0) + 1;
    });

    // Sort words by frequency
    const sortedWords = Object.keys(wordCountMap).sort((a, b) => wordCountMap[b] - wordCountMap[a]);

    // Take the top k words
    const topWords = sortedWords.slice(0, k);

    return { topWords };
}


function generateTaskId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}




app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
