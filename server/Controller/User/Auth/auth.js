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
const { verifyAnyCode } = require("../TwoFactor/twoFactor");

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
  const { emailOrPhone, password, code } = req.body;

  try {
    if (!emailOrPhone || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const user = await User.findOne({
      where: { [Op.or]: [{ email: emailOrPhone }, { phone: emailOrPhone }] },
    });

    if (!user) {
      return res.status(404).json({ error: "User doesn't exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid Password" });
    }

    // 2FA gate — TOTP or backup code accepted.
    if (user.twoFactorEnabled) {
      if (!code) {
        return res.status(401).json({
          code: "2FA_REQUIRED",
          error: "Authenticator code required.",
        });
      }
      const ok = await verifyAnyCode(user, code);
      if (!ok) {
        return res.status(401).json({
          code: "2FA_INVALID",
          error: "Invalid code.",
        });
      }
    }

    const token = jwt.sign({ name: user.name, id: user.id }, JWT_SECRET_KEY, {
      expiresIn: UserTokenExpiresIn,
    });

    return res.status(200).json({
      message: "Login Successful",
      token,
      user: { id: user.id, twoFactorEnabled: user.twoFactorEnabled },
    });
  } catch (err) {
    console.error("Error during login:", err);
    return res
      .status(500)
      .json({ error: "Internal server error. Please try again later." });
  }
};
