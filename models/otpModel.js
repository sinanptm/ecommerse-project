const mongoose = require("mongoose")

const OTPSchena =  new mongoose.Schema({
    email:{type:String, unique:false},
    otp:String,
    createdAt:Date,
    expiresAt:{type:Date}
})

const OTP = mongoose.model("OTP",OTPSchena)
module.exports = { OTP }