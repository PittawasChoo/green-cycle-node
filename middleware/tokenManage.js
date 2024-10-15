var jwt = require('jsonwebtoken');
var secretKey = '184FFAC6654C1B2358B9C8DD4C5DC'

module.exports = {
    encode: function(object) {
        return jwt.sign(object, secretKey)
    },
    decode: function(token) {
        return jwt.verify(token, secretKey)
    }
}