const { Schema, model } = require("mongoose");
 

const OTPSchena =  new Schema({
    email:{type:String, unique:false},
    otp:String,
    createdAt:Date,
    expiresAt:{type:Date}
})

const OTP = model("OTP",OTPSchena)
module.exports = { OTP }