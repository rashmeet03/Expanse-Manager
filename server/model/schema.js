var mongoose = require('mongoose')
var logger = require('../helper/logger')

mongoose.connect(process.env.MONGODB_URI,
// {
// maxPoolSize: 50,
// wtimeoutMS: 2500,
// useNewUrlParser: true
// }
).then(() => {
    logger.info(`DB Connection Established`)
    console.log("DB Connected")
}).catch(err => {
    logger.error(`DB Connection Fail | ${err.stack}`)
    console.log(err)
})

const User = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
    },
    emailId: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    // New fields for enhanced security
    resetPasswordToken: {
        type: String,
        default: null
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    },
    failedLoginAttempts: {
        type: Number,
        default: 0
    },
    accountLocked: {
        type: Boolean,
        default: false
    },
    lockUntil: {
        type: Date,
        default: null
    },
    lastLogin: {
        type: Date,
        default: null
    },
    isDemo: {
        type: Boolean,
        default: false
    }
})

// Add methods for account lockout
User.methods.incrementLoginAttempts = function() {
    const maxAttempts = 5;
    const lockTime = 2 * 60 * 60 * 1000; // 2 hours

    this.failedLoginAttempts += 1;

    if (this.failedLoginAttempts >= maxAttempts && !this.accountLocked) {
        this.accountLocked = true;
        this.lockUntil = Date.now() + lockTime;
    }

    return this.save();
};

User.methods.resetLoginAttempts = function() {
    this.failedLoginAttempts = 0;
    this.accountLocked = false;
    this.lockUntil = null;
    this.lastLogin = new Date();
    return this.save();
};

const Group = new mongoose.Schema({
    groupName: {
        type: String,
        required: true
    },
    groupDescription: {
        type: String
    },
    groupCurrency: {
        type: String,
        default: "INR"
    },
    groupOwner: {
        type: String,
        required: true
    },
    groupMembers: {
        type: Array,
        required: true
    },
    groupCategory: {
        type: String,
        default: "Others"
    },groupTotal: {
        type: Number,
        default: 0
    },
    split: {
        type: Array
    }
})

const Expense = new mongoose.Schema({
    groupId: {
        type: String,
        required: true
    },
    expenseName: {
        type: String,
        required: true
    },
    expenseDescription: {
        type: String,
    },
    expenseAmount: {
        type: Number,
        required: true
    },
    expenseCategory:{
        type: String,
        default: "Others"
    },
    expenseCurrency:{
        type: String,
        default: "INR"
    },
    expenseDate:{
        type: Date,
        default: Date.now
    },
    expenseOwner: {
        type: String,
        required: true
    },
    expenseMembers: {
        type: Array,
        required: true
    },
    expensePerMember: {
        type: Number,
        required: true
    },
    expenseType: {
        type: String,
        default: "Cash"
    }
})

const Settlement = new mongoose.Schema({
    groupId:{
        type: String,
        required: true
    },
    settleTo:{
        type:String,
        required: true
    },
    settleFrom:{
        type:String,
        required: true
    },
    settleDate:{
        type:String,
        required: true
    },
    settleAmount:{
        type:Number,
        required: true
    }
})

module.exports.Expense = mongoose.model('expense', Expense)
module.exports.User = mongoose.model('user', User)
module.exports.Group = mongoose.model('group', Group)
module.exports.Settlement = mongoose.model('settlement', Settlement)
