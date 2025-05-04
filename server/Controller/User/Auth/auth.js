const User = require("../../../Models/User/users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { Op } = require("sequelize");
const {
  JWT_SECRET_KEY,
  UserTokenExpiresIn,
  sequelize,
} = require("../../../importantInfo");
const UserProfile = require("../../../Models/User/userProfile");

exports.userSignUp = async (req, res, next) => {
  let transaction;
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        message: "All fields are required - name, email, phone, password",
      });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }
    if (phone.length !== 10) {
      return res
        .status(400)
        .json({ message: "Phone number must be 10 digits long" });
    }

    const existingUser = await User.findOne({
      where: { [Op.or]: [{ email }, { phone }] },
    });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    transaction = await sequelize.transaction();

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create(
      {
        name,
        email,
        phone,
        password: hashedPassword,
      },
      { transaction }
    );

    const newUserProfile = await UserProfile.create(
      {
        UserId: newUser.id,
      },
      { transaction }
    );

    await transaction.commit();

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    // If any error occurs, rollback the transaction
    if (transaction) {
      await transaction.rollback();
    }
    console.log(err);

    return res
      .status(500)
      .json({ message: "Internal server error. Please try again later." });
  }
};

exports.userLogin = async (req, res, next) => {
  const { emailOrPhone, password } = req.body;

  try {
    // Step 1: Start a transaction

    if (!emailOrPhone || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Step 2: Find the user by phone number
    const user = await User.findOne({
      where: { [Op.or]: [{ email: emailOrPhone }, { phone: emailOrPhone }] },
    });

    if (!user) {
      return res.status(404).json({ error: "User doesn't exist" });
    }

    // Step 3: Compare the provided password with the stored password hash
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid Password" });
    }

    const token = jwt.sign({ name: user.name, id: user.id }, JWT_SECRET_KEY, {
      expiresIn: UserTokenExpiresIn,
    });

    // Step 8: Return the response
    return res.status(200).json({
      message: "Login Successful",
      token,
      userId: user.id,
    });
  } catch (err) {
    console.error("Error during login:", err);
    return res
      .status(500)
      .json({ error: "Internal server error. Please try again later." });
  }
};
