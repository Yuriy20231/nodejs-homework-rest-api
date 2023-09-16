const { ctrlWrapper, HttpError } = require("../helpers");

const { User } = require("../models/user");
const updateSubscription = async (req, res) => {
  const { id } = req.user;
  const { subscription } = req.body;


  const result = await User.findByIdAndUpdate( id , {subscription}, {
    new: true,
  });
  if (!result) {
    throw HttpError(404, "Not found");
  }
  res.json( result );
};

const verifyEmail = async (req, res) => {
  const { verificationToken } = req.params;
  console.log("verificationToken", verificationToken);
 
  const user = await User.findOne({ verificationToken });
  console.log("user", user);

  if (!user) {
    throw HttpError(404, "User not found");
  }
  
  await User.findByIdAndUpdate(user._id, {
    verify: true,
    verificationToken: "",
  });
  

  res.status(200).json({
    message: "Verification successful",
  });
};

const resendVerifyEmail = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw HttpError(400, "missing required field email");
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

  
  await sendEmail(verifyEmail);

  
  res.status(200).body({ email: email }).json({
    message: "Verification email sent",
  });
};

module.exports = {
  verifyEmail: ctrlWrapper(verifyEmail),
  updateSubscription: ctrlWrapper(updateSubscription),
  resendVerifyEmail: ctrlWrapper(resendVerifyEmail),
};