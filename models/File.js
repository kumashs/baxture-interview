// models/File.js
const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
    fileId: { type: String, required: true, unique: true },
    filename: { type: String, required: true },
    uploadDate: { type: Date, default: Date.now },
    tasks: [
        {
            taskId: { type: String, required: true },
            operation: { type: String, required: true },
            options: { type: mongoose.Schema.Types.Mixed },
        },
    ],
});

const File = mongoose.model("File", fileSchema);

module.exports = File;
