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