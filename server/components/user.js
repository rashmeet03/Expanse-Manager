const model = require('../model/schema')
const bcrypt = require('bcryptjs')
const validator = require('../helper/validation')
const logger = require('../helper/logger')
const apiAuth = require('../helper/apiAuthentication')
const crypto = require('crypto')
const { createDemoData } = require('../helper/demoData')

/*
User Registeration function
Accepts: firstName, lastName, emailId, password
Validation: firstname, lastname not Null
	emailID - contain '@' and '.com'
	password - min 8, lowecase, uppercase, special character, numbers
API: /users/v1/register
*/
exports.userReg = async (req, res) => {
    try {
        //Checking email Id exist in DB
        const user = await model.User.findOne({
            emailId: req.body.emailId
        })
        //If email ID present in database thows error and retuen message
        if (user) {
            const err = new Error("Email Id already present please login!")
            err.status = 400
            throw err
        } else {
            //Accepts the inputs and create user model form req.body
            var newUser = new model.User(req.body)
            //Performing validations
            if (validator.emailValidation(newUser.emailId) &&
                validator.passwordValidation(newUser.password) &&
                validator.notNull(newUser.firstName)) {
                //Bcrypt password encription
                const salt = await bcrypt.genSalt(10);
                newUser.password = await bcrypt.hash(newUser.password, salt)

                //storing user details in DB
                var id = await model.User.create(newUser)
                res.status(200).json({
                    status: "Success",
                    message: "User Registeration Success",
                    userId: id.id
                })
            }
        }
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | staus : ${err.status} | message: ${err.message}`)
        res.status(err.status || 500).json({
            message: err.message
        })
    }
}

/*
User login function
Accepts: email Id & Pass & rememberMe
Updated with account lockout protection
*/
exports.userLogin = async (req, res) => {
    try {
        const { emailId, password, rememberMe } = req.body;

        //Checking email Id exist in DB
        const user = await model.User.findOne({ emailId })

        if (!user) {
            var err = new Error("Invalid email Id or Password!")
            err.status = 401
            throw err
        }

        // Check if account is locked
        if (user.accountLocked && user.lockUntil > Date.now()) {
            const timeLeft = Math.ceil((user.lockUntil - Date.now()) / (1000 * 60));
            var err = new Error(`Account is locked. Try again in ${timeLeft} minutes.`)
            err.status = 423
            throw err
        }

        // If lock time has expired, reset
        if (user.accountLocked && user.lockUntil <= Date.now()) {
            user.accountLocked = false;
            user.lockUntil = null;
            user.failedLoginAttempts = 0;
            await user.save();
        }

        //validating password using bcrypt
        const validCred = await bcrypt.compare(password, user.password)

        if (!validCred) {
            await user.incrementLoginAttempts();

            const attemptsLeft = 5 - user.failedLoginAttempts;
            let message = 'Invalid email Id or Password!';

            if (attemptsLeft > 0 && attemptsLeft <= 2) {
                message += ` ${attemptsLeft} attempts remaining.`;
            }

            var err = new Error(message)
            err.status = 401
            throw err
        }

        // Successful login - reset attempts
        await user.resetLoginAttempts();

        // Set token expiration based on remember me
        const tokenExpiration = rememberMe ? '30d' : '24h';
        const accessToken = apiAuth.generateAccessToken(emailId, tokenExpiration)

        res.status(200).json({
            status: "Success",
            message: "User Login Success",
            userId: user.id,
            emailId: user.emailId,
            firstName: user.firstName,
            lastName: user.lastName,
            accessToken,
            rememberMe
        })
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | staus : ${err.status} | message: ${err.message} ${err.stack}`)
        res.status(err.status || 500).json({
            message: err.message
        })
    }
}

/*
Demo login function
Creates demo data and logs in demo user
*/
exports.demoLogin = async (req, res) => {
    try {
        const demoUser = await createDemoData();

        const accessToken = apiAuth.generateAccessToken(demoUser.emailId, '24h')

        res.status(200).json({
            status: "Success",
            message: "Demo Login Success",
            userId: demoUser.id,
            emailId: demoUser.emailId,
            firstName: demoUser.firstName,
            lastName: demoUser.lastName,
            accessToken,
            isDemo: true
        })
    } catch (err) {
        logger.error(`Demo Login Error | ${err.stack}`)
        res.status(500).json({
            message: 'Demo login failed'
        })
    }
}

/*
Forgot Password function
Generates reset token for password reset
*/
exports.forgotPassword = async (req, res) => {
    try {
        const { emailId } = req.body;
        const user = await model.User.findOne({ emailId });

        if (!user) {
            var err = new Error('No user found with that email address')
            err.status = 404
            throw err
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        await user.save();

        // In a real app, you'd send an email here
        // For demo purposes, we'll return the token
        res.status(200).json({
            status: 'Success',
            message: 'Password reset instructions sent to your email',
            resetToken // Remove this in production
        });

    } catch (error) {
        logger.error(`Forgot password error | ${error.stack}`);
        res.status(error.status || 500).json({
            message: error.message
        });
    }
}

/*
Reset Password function
Resets password using token
*/
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        const user = await model.User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            var err = new Error('Token is invalid or has expired')
            err.status = 400
            throw err
        }

        // Validate new password
        if (!validator.passwordValidation(newPassword)) {
            var err = new Error('Password does not meet requirements')
            err.status = 400
            throw err
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        user.failedLoginAttempts = 0;
        user.accountLocked = false;
        user.lockUntil = null;

        await user.save();

        res.status(200).json({
            status: 'Success',
            message: 'Password has been reset successfully'
        });

    } catch (error) {
        logger.error(`Reset password error | ${error.stack}`);
        res.status(error.status || 500).json({
            message: error.message
        });
    }
}

/*
View User function
This function is to view the user details
Accepts: user email Id
Returns: user details (ensure password is removed)
*/
exports.viewUser = async (req, res) => {
    try {
        //check if the login user is same as the requested user
        apiAuth.validateUser(req.user, req.body.emailId)
        const user = await model.User.findOne({
            emailId: req.body.emailId
        }, {
            password: 0
        })
        if(!user) {
            var err = new Error("User does not exist!")
            err.status = 400
            throw err
        }
        res.status(200).json({
            status: "Success",
            user: user
        })
    } catch(err) {
        logger.error(`URL : ${req.originalUrl} | staus : ${err.status} | message: ${err.message}`)
        res.status(err.status || 500).json({
            message: err.message
        })
    }
}


/*
View All User EmailIs function
This function is to get all the user email Id
Accepts: none
Returns: all user Email ID
*/
exports.emailList = async (req, res) => {
    try {
        //check if the login user is same as the requested user
        const userEmails = await model.User.find({
        }, {
            emailId: 1,
            _id: 0
        })
        if(!userEmails) {
            var err = new Error("User does not exist!")
            err.status = 400
            throw err
        }
        var emailList = []
        for(var email of userEmails){
            emailList.push(email.emailId)
        }
        res.status(200).json({
            status: "Success",
            user: emailList
        })
    } catch(err) {
        logger.error(`URL : ${req.originalUrl} | staus : ${err.status} | message: ${err.message}`)
        res.status(err.status || 500).json({
            message: err.message
        })
    }
}


/*
Delete User function
This function is used to delete an existing user in the database
Accepts: user email id
*/
exports.deleteUser = async (req, res) => {
    try {
        //check if the login user is same as the requested user
        apiAuth.validateUser(req.user, req.body.emailId)
        const userCheck = await validator.userValidation(req.body.emailId)
        if (!userCheck) {
            var err = new Error("User does not exist!")
            err.status = 400
            throw err
        }
        const delete_response = await model.User.deleteOne({
            emailId: req.body.emailId
        })
        res.status(200).json({
            status: "Success",
            message: "User Account deleted!",
            response: delete_response
        })
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | staus : ${err.status} | message: ${err.message}`)
        res.status(err.status || 500).json({
            message: err.message
        })
    }
}

/*
Edit User function
This function is used to edit the user present in the database
Accepts: User data (user email id can not be changed)
This function can not be used to change the password of the user
*/
exports.editUser = async (req, res) => {
    try {
        //check if the login user is same as the requested user
        apiAuth.validateUser(req.user, req.body.emailId)
        const userCheck = await validator.userValidation(req.body.emailId)
        if (!userCheck) {
            var err = new Error("User does not exist!")
            err.status = 400
            throw err
        }
        //Accepts the inputs and create user model form req.body
        var editUser = req.body
        //Performing validations
        if (validator.notNull(editUser.firstName) &&
            validator.notNull(editUser.lastName)) {
            //storing user details in DB
            var update_response = await model.User.updateOne({
                emailId: editUser.emailId
            }, {
                $set: {
                    firstName: editUser.firstName,
                    lastName: editUser.lastName,
                }
            })
            res.status(200).json({
                status: "Success",
                message: "User update Success",
                userId: update_response
            })
        }
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | staus : ${err.status} | message: ${err.message}`)
        res.status(err.status || 500).json({
            message: err.message
        })
    }
}

/*
Update Password function
This function is used to update the user password
Accepts : emailId
	new password
	old password
validation : old password is correct
	new password meet the requirements
*/
exports.updatePassword = async (req, res) => {
    try {
        //check if the login user is same as the requested user
        apiAuth.validateUser(req.user, req.body.emailId)
        const user = await model.User.findOne({
            emailId: req.body.emailId
        })
        if (!user) {
            var err = new Error("User does not exist!")
            err.status = 400
            throw err
        }

        //Performing basic validations
        validator.notNull(req.body.oldPassword)
        validator.passwordValidation(req.body.newPassword)

        //validating password using bcrypt
        const validCred = await bcrypt.compare(req.body.oldPassword, user.password)
        if (!validCred) {
            var err = new Error("Old Password does not match")
            err.status = 400
            throw err
        }
        //Bcrypt password encription
        const salt = await bcrypt.genSalt(10);
        var hash_password = await bcrypt.hash(req.body.newPassword, salt)
        var update_response = await model.User.updateOne({
            emailId: req.body.emailId
        }, {
            $set: {
                password: hash_password
            }
        })
        res.status(200).json({
            status: "Success",
            message: "Password update Success",
            userId: update_response
        })
    } catch (err) {
        logger.error(`URL : ${req.originalUrl} | staus : ${err.status} | message: ${err.message} ${err.stack}`)
        res.status(err.status || 500).json({
            message: err.message
        })
    }
}
