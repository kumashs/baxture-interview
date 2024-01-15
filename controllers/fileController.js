// controllers/fileController.js
const fs = require('fs');
const File = require('../models/File');


// Define functions for file-related operations
const getFileById = async (fileId) => {
    return await File.findOne({ fileId });
};

const isValidOperation = (operation) => {
    return ['countWords', 'countUniqueWords', 'findTopKWords'].includes(operation);
};

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

module.exports = {
    getFileById,
    isValidOperation,
    countWords,
    countUniqueWords,
    findTopKWords,
    generateTaskId,
};
