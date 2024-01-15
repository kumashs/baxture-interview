const express = require("express");
const multer = require("multer");
const File = require("../models/File"); // Import the File model
const fileController = require("../controllers/fileController");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads"); // Set the destination folder to ./uploads
    },
    filename: async (req, file, cb) => {
        const fileId =
            Date.now().toString(36) + Math.random().toString(36).substr(2);
        const filename = fileId + "-" + file.originalname; // Use the original filename
        cb(null, filename);

        const newFile = new File({
            fileId: fileId,
            filename: filename,
        });
        await newFile.save();
    },
});

const upload = multer({ storage: storage });

const router = express.Router();

router.post("/upload", upload.single("file"), (req, res) => {
    res.json({ fileId: req.file.filename, filename: req.file.filename });
});

router.post('/:fileId', async (req, res) => {
    const { fileId } = req.params;
    const { operation, options } = req.body;

    try {
        const file = await File.findOne({ fileId });

        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        if (!['countWords', 'countUniqueWords', 'findTopKWords'].includes(operation)) {
            return res.status(400).json({ error: 'Invalid operation' });
        }

        let result;
        switch (operation) {
            case 'countWords':
                result = await fileController.countWords(file);
                break;
            case 'countUniqueWords':
                result = await fileController.countUniqueWords(file);
                break;
            case 'findTopKWords':
                const k = options && options.k ? options.k : 10;
                result = await fileController.findTopKWords(file, k);
                break;
            default:
                break;
        }

        const taskId = fileController.generateTaskId();

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

module.exports = router;
