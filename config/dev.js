const { DEV_DATABASE_URI, SENDGRID_API_KEY } = require('./secrets');

module.exports = {
    mongoUri: DEV_DATABASE_URI,
    sgApiKey: SENDGRID_API_KEY,
};
