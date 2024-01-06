const mongoose = require("mongoose")

const OTPSchena =  new mongoose.Schema({
    email:{type:String, unique:true},
    otp:String,
    createdAt:Date,
    expiresAt:Date
})

const OTP = mongoose.model("OTP",OTPSchena)
module.exports = { OTP }