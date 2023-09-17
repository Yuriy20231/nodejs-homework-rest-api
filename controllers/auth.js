const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken')

const gravatar = require('gravatar') 
const path = require("path");
const fs = require("fs/promises")
const Jimp = require ("jimp")


const { User } = require("../models/user");

const { HttpError, ctrlWrapper } = require("../helpers");



const { SECRET_KEY } = process.env;


const avatarDir = path.join(__dirname, "../", "public", "avatars");


const register = async (req, res) => {

 
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (user) {
    throw HttpError(409, "Email already in use");
  }

  const hashPassword = await bcrypt.hash(password, 10);

 
  const avatarUrl = gravatar.url(email);

  const verificationToken = nanoid();
  
  const newUser = await User.create({
    ...req.body,
    password: hashPassword,
    avatarUrl,
    verificationToken,
  });
 
  const verifyEmail = {
    to: email,
    subject: "verify email", 
    html: `<a target="_blank" href="${BASE_URL}/api/auth/verify/${verificationToken}">Click for verify email</a>`,
  };

  await sendEmail(verifyEmail);


  res.status(201).json({
    email: newUser.email,
  });
};

const verifyEmail = async (req, res) => {
    const { verificationToken } = req.params;
    console.log("verificationToken", verificationToken);

    const user = await User.findOne({ verificationToken });
    console.log("user", user);
  
  if (!user) {
    throw HttpError(404, "User not found");
    }
   
    await User.findByIdAndUpdate(user._id, { verify: true, verificationToken: "" });
    
     res.status(200).json({
       message: "Verification successful",
     });
}

const resendVerifyEmail = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw HttpError(400, "missing required field email")
  }
  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(401, "Email not found");
  }
  if (user.verify) {
    throw HttpError(401, "Verification has already been passed");
  }

  const verifyEmail = {
    to: email,
    subject: "verify email",
    html: `<a target="_blank" href="${BASE_URL}/api/auth/verify/${user.verificationToken}">Click for verify email</a>`,
    };

    
}


 
   res.status(200).body({ email: email }).json({
     message: "Verification email sent",
   });



    const payload = {id: user._id}
   
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "23h" });
    
    await User.findByIdAndUpdate(user._id, { token })
    

    res.json({
        token: token,
    })



const getCurrent = async (req, res) => {
    const { email, subscription } = req.user;
    res.json({email, subscription})
}

const logout = async (req, res) => {
    const { _id } = req.user;
    await User.findByIdAndUpdate(_id, { token: "" }) 
    res.json({message: "Logout success"})
}


const updateAvatar = async (req, res) => {
    
    const { _id } = req.user; 
    const { path: tempUpload, originalname } = req.file;
 
    const image = await Jimp.read(tempUpload);
    const newHeight = Jimp.AUTO;
    await image.resize(250, newHeight).write(tempUpload);
    
    const fileName = `${_id}_${originalname}` 

   
    const resultUpload = path.join(avatarDir, fileName);
   
    await fs.rename(tempUpload, resultUpload);
  
    const avatarUrl = path.join("avatars", fileName);
  
    await User.findByIdAndUpdate(_id, { avatarUrl });
    
    res.json(avatarUrl, )
    

}





module.exports = {
  register: ctrlWrapper(register),
  login: ctrlWrapper(login),
  getCurrent: ctrlWrapper(getCurrent),
  logout: ctrlWrapper(logout),

  updateAvatar: ctrlWrapper(updateAvatar),

};