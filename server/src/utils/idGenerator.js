const { v4: uuidv4 } = require('uuid');

// Generate a unique room ID
function generateRoomId() {
    // Generate UUID and take the first 8 characters
    return uuidv4().substring(0, 8);
}

// Generate a random name (optional)
function generateRoomName() {
    const adjectives = ['Creative', 'Brilliant', 'Amazing', 'Awesome', 'Fantastic'];
    const nouns = ['Whiteboard', 'Canvas', 'Space', 'Room', 'Board'];

    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];

    return `${adj} ${noun}`;
}

module.exports = {
    generateRoomId,
    generateRoomName
};