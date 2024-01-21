const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken')


//  * Bcrypt hashing function
const makeHash = async (pass) => {
  try {
    pass = pass.trim()
    return await bcrypt.hash(pass, 10);
  } catch (error) {
    console.log(error.message);
  }
};

const bcryptCompare = async (str, bfr) => {
  try {
    return await bcrypt.compare(str.trim(), bfr);
  } catch (error) {
    console.log(error.message);
  }
}



const generateToken = async (userId) => {
  const secretKey = process.env.SECRET;
  const token = await jwt.sign({ userId }, secretKey, { expiresIn: '30d' });
  return token;
};

const getUserIdFromToken = async (token) => {
  try {
    const secretKey = process.env.SECRET;
    const decoded = await jwt.verify(token, secretKey);
    return decoded.userId;
  } catch (error) {
    throw new Error('Invalid token');
  }
};


module.exports = {
  makeHash,
  bcryptCompare,
  generateToken,
  getUserIdFromToken
}