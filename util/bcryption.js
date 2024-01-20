const bcrypt = require("bcrypt");

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

module.exports = {
  makeHash,
  bcryptCompare
}