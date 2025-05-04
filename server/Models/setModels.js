const UserProfile = require("./User/userProfile");
const User = require("./User/users");

exports.setupModels = async () => {
  User.hasOne(UserProfile);
  UserProfile.belongsTo(User);
};
