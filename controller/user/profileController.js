const User = require("../../model/userSchema");
const Address = require("../../model/addressSchema")
const nodemailer = require("nodemailer");
const dotenv = require("dotenv")
const bcrypt = require("bcrypt");
const session = require("express-session")
dotenv.config()

 

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}


// sending verification email..

async function sendVerificationEmail(email,otp) {
    try {
        const transporter = nodemailer.createTransport({
            service:'gmail',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }           
        })

        const mailOptions = {
            from: process.env.NODEMAILER_EMAIL,
            to:email,
            subject:"OTP for password rest",
            text:`Your OTP is :${otp}`,
            html: `<b> Your OTP : ${otp} </b>`,
        }

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sended :',info.messageId);
        return true;

    } catch (error) {
        console.error("Error in sending Email",error);
        return false;
    }
}

// forget password page
const getForgotPassword = async(req,res)=>{
    try {
        res.render("forgetpass-verify")
    } catch (error) {
        res.render("/login")
    }
}


//forgotEmail Valid..

const forgotEmailValid = async(req,res)=>{
    try {
        const {email} = req.body;
        const findUser = await User.findOne({email:email});

        if(findUser){
            const otp = generateOtp();
            const sendMail = await sendVerificationEmail(email,otp)

            if(sendMail){
                req.session.userOtp = otp;
                req.session.email = email;

                res.render("forgetpass-otpVerify");
                console.log("Forget Pass OTP :",otp);
                
            }else{
                res.json({success:false,message:"Failed to send OTP, Please try again!"})
            }
        }else{
            res.render("forgetpass-verify",{message:"Entered Email not exist"})
        }
    } catch (error) {
        res.redirect("/login")
    }
}

//verify forget password.

const verifyForgetPassOtp = async(req,res)=>{
    try {
        const enteredOtp = req.body.otp;
      console.log("entered otp:",enteredOtp)
      console.log("user otp:",req.session.userOtp)

        if(enteredOtp === req.session.userOtp){
            res.json({success:true,redirectUrl:"/reset-Password"})
        }else{
            res.json({success:false,message:"OTP not matching"})
        }
    } catch (error) {
        res.status(500).json({success:false, message:"An Eroor occured, Please try again"})
    }
}

//reset password page

const getResetPassword = async(req,res)=>{
    try {
        res.render("reset-Password")
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}


//resending otp

const resendOtp = async(req,res)=>{
    try {
        const otp = generateOtp()
        req.session.userOtp = otp;
        const email = req.session.email

        const sendMail = await sendVerificationEmail(email,otp)
        if(sendMail){
            console.log("Resend OTP :",otp);
            res.status(200).json({success:true,message:"OTP Resend Successfully"})
        }else{
            res.status(500).json({success:false, message:"Failed to Resend OTP, please try again later!"})
        }
    } catch (error) {
        console.error("Error Re sending OTP",error);
        res.status(500).json({success:false,message:"Internal Server Error, Please try again!"})
    }
}

// bycrypt the password

const securePassword = async(newPass)=>{
    try {
        const passwordHash = await bcrypt.hash(newPass,10);
        return passwordHash
    } catch (error) {
        
    }
}

//validation for new password

const NewPassword = async(req,res)=>{
    try {
        const {newPass, confirmPass} =req.body;
        const email = req.session.email;

        if(newPass === confirmPass){
            const passwordHash = await securePassword(newPass);

            await User.updateOne(
                {email:email},
                {$set:{password:passwordHash}}
            )
            res.redirect("/login")
        }else{
            res.render("reset-password",{message:"Password do not match"})
        }
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}

const userProfile = async(req,res)=>{
    try {
        const userId = req.session.user
        const userData = await User.findById(userId)
        const addressData = await Address.findOne({userId:userId})

        // const orderData = await Order.find({userId:userId}).sort({createdAt:-1}).exec()
        // console.log("orders : ",orderData);
        
        res.render("profile",{user:userData,userAddress:addressData}) //  when add the address and orderadata that time you pass useradressand order to profile
    } catch (error) {
        console.error("Error in fetching user profile",error);
        res.redirect("/pageNotFound")   
    }
}


const changePassword = async(req,res)=>{
    try {
        res.render("change-password",{ message: null })
    } catch (error) {
      res.redirect("/pageNotFound")   
    }
}



const validateAndChangePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword, confirmPassword } = req.body;
        const userId = req.session.user; // Assuming session contains the logged-in user ID

        // Fetch the current user from the database
        const currentUser = await User.findById(userId);

        if (!currentUser) {
            return res.render("change-password", {
                message: "User not found.",
            });
        }

        // Validate the old password
        const isOldPasswordValid = await comparePassword(
            oldPassword,
            currentUser.password
        ); // Assume comparePassword is a function to compare passwords

        if (!isOldPasswordValid) {
            return res.render("change-password", {
                message: "Old password is incorrect.",
            });
        }

        // Check if newPassword matches confirmPassword
        if (newPassword !== confirmPassword) {
            return res.render("change-password", {
                message: "New passwords do not match.",
            });
        }

        // Hash the new password
        const hashedPassword = await securePassword(newPassword);

        // Update the user's password in the database
        await User.updateOne(
            { _id: userId },
            { $set: { password: hashedPassword } }
        );

        // Redirect to the profile page or another relevant page
        res.redirect("/userProfile");
    } catch (error) {
        res.redirect("/pageNotFound");
    }
};


// Utility function to compare passwords
const comparePassword = async (inputPassword, hashedPassword) => {
    const bcrypt = require("bcrypt");
    return await bcrypt.compare(inputPassword, hashedPassword);
};



//address management

const addressPage = async(req,res)=>{
    try {
        const user = req.session.user;
        res.render("addAddress",{user:user})
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}

const postaddAddress = async (req, res) => {
    try {
        const {
            addressType,
            name,
            city,
            landMark,
            state,
            pincode,
            phone,
            altPhone,
            redirectTo
        } = req.body;

        const userId = req.session.user;
        const userData = await User.findOne({ _id: userId });
        const userAddress = await Address.findOne({ userId: userData._id });

        if (!userAddress) {
            const newAddress = new Address({
                userId: userData._id,
                address: [{ addressType, name, city, landMark, state, pincode, phone, altPhone }]
            });

            await newAddress.save();
        } else {
            userAddress.address.push({ addressType, name, city, landMark, state, pincode, phone, altPhone });
            await userAddress.save();
        }
        console.log("Address added successfully");

        // Redirecting to checkout and user profile
        if (redirectTo === 'checkout') {
            return res.redirect('/checkout');
        } else {
            return res.redirect('/userProfile');
        }
    } catch (error) {
        console.error("Error adding address:", error);
        res.redirect("/pageNotFound");
    }
};



const editAddress = async(req,res)=>{
    try {
        const addressId = req.query.id;
        const user = req.session.user;
        const userAddress = await Address.findOne({"address._id":addressId});

        const currentAddress =userAddress.address.find(address => address._id.toString() === addressId);

        if(!currentAddress){
            return res.status(404).send("Address not found!")
        }

        res.render("edit-address",{address:currentAddress, user:user})

        

    } catch (error) {
        console.error("Error in editing address",error);
        res.redirect("/pageNotFound")
        
    }
}

const postEditAddress = async(req,res)=>{
    try {
        const data = req.body;
        const addressId = req.query.id;
        const user = req.session.user;
        console.log("address id -",addressId)

        const findAddress = await Address.findOne({"address._id":addressId});
        console.log("address -",findAddress);
        
        if(!findAddress){
            return res.redirect("/pageNotFound")
        }
        await Address.updateOne(
            {"address._id":addressId},
            {$set:{"address.$":{
                _id:addressId,
                addressType:data.addressType,
                name:data.name,
                city:data.city,
                landMark:data.landMark,
                state:data.state,
                pincode:data.pincode,
                phone:data.phone,
                altPhone:data.altPhone
            }}}
        )

        res.redirect("/userProfile")
    } catch (error) {
        console.error(("Error in updating Address",error));
        res.redirect("/pageNotFound")
    }
}

//deletion

const deleteAddress = async(req,res)=>{
    try {
        const addressId = req.query.id
        const findAddress = await Address.findOne({"address._id":addressId});

        if(!findAddress){
            return res.status(404).send("Cannot find address!")
        }

        await Address.updateOne({"address._id":addressId},
            {$pull:{address:{_id:addressId}}}
        )
        res.redirect("/userProfile")
    } catch (error) {
        console.error("Error in delete address",error);
        res.redirect("/pageNotFound")
    }
}



module.exports ={
    getForgotPassword,
    forgotEmailValid,
    verifyForgetPassOtp,
    getResetPassword,
    resendOtp,
    NewPassword,
    userProfile,
    changePassword,
    validateAndChangePassword,
    addressPage,
    postaddAddress,
    editAddress,
    postEditAddress,
    deleteAddress
}