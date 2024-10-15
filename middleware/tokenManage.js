var jwt = require("jsonwebtoken");
var secretKey = process.env.SECRET_KEY;

module.exports = {
    encode: function (object) {
        return jwt.sign(object, secretKey);
    },
    decode: function (token) {
        return jwt.verify(token, secretKey);
    },
};
