const { v4: uuidv4 } = require('uuid');

const generateUserId = (req, res) => {
    try {
        // Check if user already has an ID in their cookies
        const existingUserId = req.cookies && req.cookies.userId;

        if (existingUserId) {
            // If user already has an ID, return it
            return res.status(200).json({
                success: true,
                userId: existingUserId
            });
        }

        // Generate a new unique user ID
        const userId = uuidv4();

        // Set the ID as a cookie (1 year expiry)
        res.cookie('userId', userId, {
            httpOnly: true, // For security
            maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
            sameSite: 'strict',
            path: '/'
        });

        // Return the new ID
        return res.status(201).json({
            success: true,
            userId: userId
        });
    } catch (error) {
        console.error('Error generating user ID:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate user ID',
            error: error.message
        });
    }
};

module.exports = {
    generateUserId
};