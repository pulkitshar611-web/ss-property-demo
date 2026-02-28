const db = require('../config');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const multer = require('multer');
require('dotenv').config();
const path = require('path');
const fs = require("fs");
const nodemailer = require('nodemailer');
const cloudinary = require('cloudinary').v2;

// Cloudinary Configuration
cloudinary.config({
    cloud_name: 'dkqcqrrbp',
    api_key: '418838712271323',
    api_secret: 'p12EKWICdyHWx8LcihuWYqIruWQ'
});


//Register User
// const signUp = async (req, res) => {
//     try {
//         const { firstName, lastName, mobileNumber, email, password, role, sellerId, permissions} = req.body;

//         // Check if user already exists
//         const [existingUser] = await db.query('SELECT * FROM user WHERE email = ?', [email]);
//         if (existingUser.length > 0) {
//             return res.status(400).json({ status: "false", message: 'User already exists with this email', data: [] });
//         }

//         // Hash password once
//         const hashedPassword = await bcrypt.hash(password, 10);

               
       
//     // ✅ SellerId (optional handling)
//     let finalSellerIds = [];
//     if (sellerId) {
//       if (Array.isArray(sellerId)) {
//         finalSellerIds = sellerId;
//       } else if (typeof sellerId === "string") {
//         try {
//           finalSellerIds = JSON.parse(sellerId);
//         } catch {
//           finalSellerIds = sellerId.split(",").map(id => id.trim());
//         }
//       }
//     }

//           // ✅ Default image is NULL (if no upload)
//         let profileImage = null;

//         // ✅ Upload image if provided
//         if (req.files && req.files.image) {
//             const file = req.files.image; // single image
//             const result = await cloudinary.uploader.upload(file.tempFilePath, {
//                 folder: 'users',
//                 resource_type: 'image'
//             });
//             profileImage = result.secure_url;
//         }

//        // ✅ Handle permissions safely
//         let userPermissions;
//         if (permissions) {
//             try {
//                 // agar string hai to parse karo, agar already object hai to direct use karo
//                 userPermissions = typeof permissions === "string" ? JSON.parse(permissions) : permissions;
//             } catch (err) {
//                 return res.status(400).json({ status: "false", message: "Invalid permissions JSON format", data: [] });
//             }
//         } else {
//             userPermissions = {
//                 dashboard: { view: false, add: false, edit: false, delete: false },
//                 category: { view: false, add: false, edit: false, delete: false },
//                 product: { view: false, add: false, edit: false, delete: false },
//                 brokerinvite: { view: false, add: false, edit: false, delete: false },
//                 orders: { view: false, add: false, edit: false, delete: false }
//             };
//         }


//         // Insert new user (exclude confirmPassword)
//         const [result] = await db.query(
//             'INSERT INTO user (firstName, lastName, mobileNumber, email, password, role, sellerId, image, permissions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
//             [firstName, lastName, mobileNumber, email, hashedPassword, role, JSON.stringify(finalSellerIds), profileImage, JSON.stringify(userPermissions)]
//         );

//         // Get new user from DB (excluding confirmPassword from response)
//         const [newUser] = await db.query('SELECT * FROM user WHERE id = ?', [result.insertId]);

//         // Generate JWT token
//         const token = jwt.sign(
//             { id: newUser[0].id, email: newUser[0].email, role: newUser[0].role },
//             process.env.JWT_SECRET,
//             { expiresIn: '3h' }
//         );

//         // ✅ Format user object (safe permissions parse + image array conversion)
//         let parsedPermissions;
//         try {
//             parsedPermissions = typeof newUser[0].permissions === "string"
//                 ? JSON.parse(newUser[0].permissions)
//                 : newUser[0].permissions;
//         } catch (e) {
//             parsedPermissions = {};
//         }

//         let parsedSellerIds;
//     try {
//       parsedSellerIds = typeof newUser[0].sellerId === "string"
//         ? JSON.parse(newUser[0].sellerId)
//         : newUser[0].sellerId;
//     } catch {
//       parsedSellerIds = [];
//     }

//        // ✅ Format user object (image array conversion)
//     const formattedUser = {
//       ...newUser[0],
//       image: newUser[0].image ? newUser[0].image.split(",") : [],
//       permissions: parsedPermissions,
//       sellerId: parsedSellerIds  
//     };

//     // ✅ Send response with token OUTSIDE data
//     res.status(201).json({
//       status: "true",
//       message: 'User registered successfully',
//       data: formattedUser,
//       token
//     });

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ status: "false", message: 'Server error', data: [] });
//     }
// };


const signUp = async (req, res) => {
  try {
    const { firstName, lastName, mobileNumber, email, password, role, sellerId, permissions } = req.body;

    // Check if user already exists
    const [existingUser] = await db.query('SELECT * FROM user WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ status: "false", message: 'User already exists with this email', data: [] });
    }

    // Hash password once
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Default role to "user" if not provided
    const userRole = role && role.trim() !== "" ? role : "user";

    // ✅ Handle sellerId (optional)
    let finalSellerIds = [];
    if (sellerId) {
      if (Array.isArray(sellerId)) {
        finalSellerIds = sellerId;
      } else if (typeof sellerId === "string") {
        try {
          finalSellerIds = JSON.parse(sellerId);
        } catch {
          finalSellerIds = sellerId.split(",").map(id => id.trim());
        }
      }
    }

    // ✅ Default image is NULL (if no upload)
    let profileImage = null;

    // ✅ Upload image if provided
    if (req.files && req.files.image) {
      const file = req.files.image; // single image
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: 'users',
        resource_type: 'image'
      });
      profileImage = result.secure_url;
    }

    // ✅ Handle permissions safely
    let userPermissions;
    if (permissions) {
      try {
        userPermissions = typeof permissions === "string" ? JSON.parse(permissions) : permissions;
      } catch (err) {
        return res.status(400).json({ status: "false", message: "Invalid permissions JSON format", data: [] });
      }
    } else {
      userPermissions = {
        dashboard: { view: false, add: false, edit: false, delete: false },
        category: { view: false, add: false, edit: false, delete: false },
        product: { view: false, add: false, edit: false, delete: false },
        brokerinvite: { view: false, add: false, edit: false, delete: false },
        orders: { view: false, add: false, edit: false, delete: false }
      };
    }

    // ✅ Insert new user
    const [result] = await db.query(
      'INSERT INTO user (firstName, lastName, mobileNumber, email, password, role, sellerId, image, permissions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [firstName, lastName, mobileNumber, email, hashedPassword, userRole, JSON.stringify(finalSellerIds), profileImage, JSON.stringify(userPermissions)]
    );

    // ✅ Get newly created user
    const [newUser] = await db.query('SELECT * FROM user WHERE id = ?', [result.insertId]);

    // ✅ Generate JWT token
    const token = jwt.sign(
      { id: newUser[0].id, email: newUser[0].email, role: newUser[0].role },
      process.env.JWT_SECRET,
      { expiresIn: '3h' }
    );

    // ✅ Parse permissions and seller IDs safely
    let parsedPermissions;
    try {
      parsedPermissions = typeof newUser[0].permissions === "string"
        ? JSON.parse(newUser[0].permissions)
        : newUser[0].permissions;
    } catch {
      parsedPermissions = {};
    }

    let parsedSellerIds;
    try {
      parsedSellerIds = typeof newUser[0].sellerId === "string"
        ? JSON.parse(newUser[0].sellerId)
        : newUser[0].sellerId;
    } catch {
      parsedSellerIds = [];
    }

    // ✅ Format user object
    const formattedUser = {
      ...newUser[0],
      image: newUser[0].image ? newUser[0].image.split(",") : [],
      permissions: parsedPermissions,
      sellerId: parsedSellerIds
    };

    // ✅ Send response
    res.status(201).json({
      status: "true",
      message: 'User registered successfully',
      data: formattedUser,
      token
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "false", message: 'Server error', data: [] });
  }
};


const editProfile = async (req, res) => {
    try {
        const { firstName, lastName, mobileNumber, email, password, role, sellerId, permissions  } = req.body;
        const { userId } = req.params;

        // Check if user exists
        const [user] = await db.query('SELECT * FROM user WHERE id = ?', [userId]);
        if (user.length === 0) {
            return res.status(404).json({ status: "false", message: 'User not found', data: [] });
        }

        // Hash password only if it's provided
        let hashedPassword = user[0].password; // keep existing
        if (password && password.trim() !== "") {
            hashedPassword = await bcrypt.hash(password, 10);
        }


          // ✅ SellerId from form-data (string parsing)
    let finalSellerIds = [];
    if (req.body.sellerId) {
      try {
        // case 1: JSON array string e.g. "[1,2,3]"
        if (req.body.sellerId.trim().startsWith("[")) {
          finalSellerIds = JSON.parse(req.body.sellerId);
        } else {
          // case 2: comma separated e.g. "1,2,3"
          finalSellerIds = req.body.sellerId.split(",").map(id => id.trim());
        }
      } catch (err) {
        console.error("SellerId parse error:", err);
        finalSellerIds = [];
      }
    }

         

        // ✅ Handle profile image (optional with Cloudinary)
    let profileImage = user[0].image; // keep existing
    if (req.files && req.files.image) {
      const file = req.files.image;
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: 'users',
        resource_type: 'image'
      });
      profileImage = result.secure_url;
    }

        // ✅ Handle permissions safely (same as signUp)
        let userPermissions;
        if (permissions) {
            try {
                userPermissions = typeof permissions === "string" ? JSON.parse(permissions) : permissions;
            } catch (err) {
                return res.status(400).json({ status: "false", message: "Invalid permissions JSON format", data: [] });
            }
        } else {
            // If not provided → keep old permissions
            userPermissions = typeof user[0].permissions === "string"
                ? JSON.parse(user[0].permissions)
                : user[0].permissions;
        }

        // Update user
        await db.query(
            'UPDATE user SET firstName = ?, lastName = ?, mobileNumber = ?, email = ?, password = ?, role = ?, sellerId = ?, image = ?, permissions = ? WHERE id = ?',
           [
        firstName || user[0].firstName,
        lastName || user[0].lastName,
        mobileNumber || user[0].mobileNumber,
        email || user[0].email,
        hashedPassword,
        role || user[0].role,
        JSON.stringify(finalSellerIds),
        profileImage,
        JSON.stringify(userPermissions),
        userId
      ]
        );

        // Fetch updated user without password
        const [updatedUser] = await db.query(
            'SELECT * FROM user WHERE id = ?',
            [userId]
        );

        // Generate new token
        const token = jwt.sign(
            { id: updatedUser[0].id, email: updatedUser[0].email, role: updatedUser[0].role },
            process.env.JWT_SECRET,
            { expiresIn: '3h' }
        );

         // ✅ Format user (image as array + safe permissions parse)
        let parsedPermissions;
        try {
            parsedPermissions = typeof updatedUser[0].permissions === "string"
                ? JSON.parse(updatedUser[0].permissions)
                : updatedUser[0].permissions;
        } catch (e) {
            parsedPermissions = {};
        }

        let parsedSellerIds;
try {
  parsedSellerIds = typeof updatedUser[0].sellerId === "string"
    ? JSON.parse(updatedUser[0].sellerId)
    : updatedUser[0].sellerId;
} catch {
  parsedSellerIds = [];
}

         // ✅ Format user (image as array)
    const formattedUser = {
      ...updatedUser[0],
      image: updatedUser[0].image ? updatedUser[0].image.split(",") : [],
      permissions: parsedPermissions,
      sellerId: parsedSellerIds  
    };

    res.status(200).json({
      status: "true",
      message: 'User details updated successfully',
      data: formattedUser,
      token
    });
    } catch (error) {
        console.error("Edit Profile Error:", error);
        res.status(500).json({ status: "false", message: 'Server error', data: [] });
    }
};



// Get All Users
const getAllUsers = async (req, res) => {
    try {
        const [users] = await db.query('SELECT * FROM user');

        if (users.length === 0) {
            return res.status(404).json({ status: "false", message: "No user found", data: [] });
        }

        res.status(200).json({ status: "true", message: "Users retrieved successfully", data: users });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Server error" });
    }
};


// // Get User by ID
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const [user] = await db.query('SELECT * FROM user WHERE id = ?', [id]);

        if (user.length === 0) {
            return res.status(404).json({ status: "false", message: "User not found", data: [] });
        }

        res.status(200).json({ status: "true", message: "User retrieved successfully", data: user[0] });
    } catch (error) {
        console.error("Error fetching user by ID:", error);
        res.status(500).json({ message: "Server error" });
    }
};


// const checkGoogleDetails = async (req, res) => {
//     try {
//         const { email, googleSignIn, facebookSignIn } = req.body;

//         // Step 1: Validate Email
//         if (!email) {
//             return res.status(400).json({ status: "false", message: "Email is required", data: [] });
//         }

//         // Step 2: Fetch User
//         const [existingUser] = await db.execute('SELECT * FROM user WHERE email = ?', [email]);

//         if (existingUser.length === 0) {
//             return res.status(404).json({ status: "false", message: "User not found with this email.", data: [] });
//         }

//         // Step 3: Prepare update fields dynamically
//         const updateFields = [];
//         const values = [];

//         if (googleSignIn !== undefined) {
//             updateFields.push("googleSignIn = ?");
//             values.push(googleSignIn);
//         }

//         if (facebookSignIn !== undefined) {
//             updateFields.push("facebookSignIn = ?");
//             values.push(facebookSignIn);
//         }

//         // Step 4: Update the user if needed
//         if (updateFields.length > 0) {
//             values.push(email);
//             const updateQuery = `UPDATE user SET ${updateFields.join(", ")} WHERE email = ?`;
//             await db.execute(updateQuery, values);
//         }

//         // Step 5: Fetch Updated User Data (Ensuring Correct Column Name)
//         const [updatedUser] = await db.execute('SELECT id, fullName, email, password, googleSignIn, facebookSignIn FROM user WHERE email = ?', [email]);

//          // Step 6: Generate JWT Token
//         const token = jwt.sign(
//             { id: updatedUser[0].id, email: updatedUser[0].email },
//             process.env.JWT_SECRET,  // Secret Key should be in your .env file
//             { expiresIn: '1h' }  // Token expiry time (1 hour in this case)
//         );

//         return res.status(200).json({
//             status: "true",
//             message: "Google or Facebook details updated successfully",
//             data: {
//                 ...updatedUser[0],  // Updated user details
//                 token: token         // JWT Token
//             }
//         });

//     } catch (error) {
//         console.error("Google/Facebook Sign-In Error:", error);
//         res.status(500).json({ status: "false", message: "Server error", error: error.message });
//     }
// };


// //delete user
const deleteUserById = async (req, res) => {
    try {
        const { id } = req.params; 

        const [existingUser] = await db.query('SELECT * FROM user WHERE id = ?', [id]);

        if (existingUser.length === 0) {
            return res.status(404).json({ status: "false", message: "User not found", data: [] });
        }
                
        await db.query('DELETE FROM user WHERE id = ?', [id]);

        res.status(200).json({
            status: "true",
            message: "User deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Server error" });
    }
};



// const forgotPassword = async (req, res) => {
//     try {
//         const { email, newPassword } = req.body;

//         // Check if user exists
//         const [user] = await db.query("SELECT * FROM user WHERE email = ?", [email]);
//         if (user.length === 0) {
//             return res.status(404).json({ status: "false", message: "User not found with this email." });
//         }

//         // Hash new password
//         const hashedPassword = await bcrypt.hash(newPassword, 10);

//         // Update password and confirmPassword
//         await db.query("UPDATE user SET password = ?, confirmPassword = ? WHERE email = ?", 
//             [hashedPassword, hashedPassword, email]);

//         res.status(200).json({ status: "true", message: "Password updated successfully." });

//     } catch (error) {
//         console.error("Forgot Password Error:", error);
//         res.status(500).json({ status: "false", message: "Server error" });
//     }
// };


// const forgotPassword = async (req, res) => {
//     try {
//         const { email } = req.body;

//         // Check if user exists
//         const [user] = await db.query("SELECT * FROM user WHERE email = ?", [email]);
//         if (user.length === 0) {
//             return res.status(404).json({ status: "false", message: "User not found." });
//         }

//         // Password reset is not allowed for Google Sign-In users
//         if (user[0].googleSignIn === "true") {
//             return res.status(400).json({
//                 status: "false",
//                 message: "Password reset is not allowed for Google Sign-In users. Please log in using Google."
//             });
//         }

//         // Generate a unique reset token
//         const resetToken = crypto.randomBytes(32).toString("hex");
//         const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

//         // Save the token in the database
//         await db.query("UPDATE user SET resetToken = ?, resetTokenExpiry = ? WHERE email = ?", 
//                        [resetToken, resetTokenExpiry, email]);

//         // Configure Nodemailer transport
//         const transporter = nodemailer.createTransport({
//             service: "gmail",
//             auth: {
//                 user: 'packageitappofficially@gmail.com',
//                 pass: 'epvuqqesdioohjvi',
//             },
//             tls: {
//                 rejectUnauthorized: false, // This will ignore SSL certificate validation
//             }
//         });

//         // Send the password reset email
//         await transporter.sendMail({
//             from: 'sagar.kiaan12@gmail.com',
//             to: email,
//             subject: "Your Password Reset Token",
//             html: `<p>Your password reset token: <strong>${resetToken}</strong></p>
//                     <p>This token is valid for <strong>15 minutes</strong>.</p>
//                     <p>If you did not request this, please ignore this email.</p>`,
//         });

//         res.status(200).json({ status: "true", message: "Password reset email sent successfully." });

//     } catch (error) {
//         console.error("Forgot Password Error:", error);
//         res.status(500).json({ status: "false", message: "Server error" });
//     }
// };



// const resetPassword = async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         // Check karo ki user exist karta hai ya nahi
//         const [user] = await db.query("SELECT * FROM user WHERE email = ?", [email]);

//         if (user.length === 0) {
//             return res.status(404).json({ status: "false", message: "User not found with this email." });
//         }

        
//         if (user[0].googleSignIn === "true") {
//             return res.status(400).json({
//                 status: "false",
//                 message: "Password reset is not allowed for Google sign-in users. Please use Google to log in."
//             });
//         }

//         // Naya password hash karo
//         const hashedPassword = await bcrypt.hash(password, 10);

//         // Password update karo
//         await db.query("UPDATE user SET password = ? WHERE email = ?", [hashedPassword, email]);

//         res.status(200).json({ status: "true", message: "Password reset successfully." });

//     } catch (error) {
//         console.error("Reset Password Error:", error);
//         res.status(500).json({ status: "false", message: "Server error" });
//     }
// };


// Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const [user] = await db.query('SELECT id, email, mobileNumber, role, password, sellerId FROM user WHERE email = ?', [email]);
        if (user.length === 0) {
            return res.status(400).json({ status: "false", message: 'Invalid email or password', data: [] });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user[0].password);
        if (!isMatch) {
            return res.status(400).json({ status: "false", message: 'Invalid email or password', data: [] });
        }

        // Generate JWT Token
        const token = jwt.sign(
            { id: user[0].id, email: user[0].email, mobileNumber: user[0].mobileNumber, sellerId: user[0].sellerId,  role: user[0].role },
            process.env.JWT_SECRET,
            { expiresIn: '4h' }
        );

        // Prepare response data (including password)
        const userData = {
            id: user[0].id.toString(),
            email: user[0].email,
            mobileNumber: user[0].mobileNumber,
            sellerId: user[0].sellerId,
            password: user[0].password,
            role: user[0].role, 
            token: token
        };

        res.json({ status: "true", message: 'Login successful', data: userData });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


// Utility: Send Email
const sendEmail = async (to, subject, htmlContent) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER || 'packageitappofficially@gmail.com',
      pass: process.env.EMAIL_PASS || 'epvuqqesdioohjvi',
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mailOptions = {
    from: `"Buyer Seller" <${process.env.EMAIL_USER || 'sagar.kiaan12@gmail.com'}>`,
    to,
    subject,
    html: htmlContent,
  };

  await transporter.sendMail(mailOptions);
};

// Controller: Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const [user] = await db.query("SELECT * FROM user WHERE email = ?", [email]);
    if (user.length === 0) {
      return res.status(404).json({ status: "false", message: "User not found." });
    }

    if (user[0].googleSignIn === "true") {
      return res.status(400).json({ status: "false", message: "Password reset not allowed for Google Sign-In users." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await db.query(
      "UPDATE user SET resetToken = ?, resetTokenExpiry = ? WHERE email = ?",
      [resetToken, resetTokenExpiry, email]
    );

    const resetLink = `http://localhost:5173/resetpassword?token=${resetToken}`;

    // Compose email HTML
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f7; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">

          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://buyerseller-production.up.railway.app/upload/buyericon.png" alt="BuyerSeller Logo" style="height: 60px;" />
          </div>

          <h2 style="text-align: center; color: #2c3e50;">🔐 Reset Your Password</h2>

          <p style="font-size: 16px; color: #34495e;">Hello,</p>

          <p style="font-size: 15px; color: #555555; line-height: 1.6;">
            You recently requested to reset your password for your <strong>BuyerSeller</strong> account.
            Use the token below or click the link to complete the process. This token is valid for only <strong>15 minutes</strong>.
            If you did not request this, you can safely ignore this email.
          </p>

          <div style="margin: 30px 0; text-align: center;">
            <span style="display: inline-block; background-color: #ecf0f1; padding: 15px 25px; font-size: 18px; font-weight: bold; color: #2c3e50; border-radius: 6px; letter-spacing: 1px;">
              ${resetToken}
            </span>
          </div>

          <div style="margin: 20px 0; text-align: center;">
            <a href="${resetLink}" style="display: inline-block; background-color: #2c3e50; color: #ffffff; padding: 12px 20px; font-size: 16px; font-weight: bold; border-radius: 5px; text-decoration: none;">
              Reset Password
            </a>
          </div>

          <p style="font-size: 14px; color: #e74c3c; font-weight: bold;">
            ⚠️ Token expires in 15 minutes. Do not share it.
          </p>

          <p style="font-size: 14px; color: #555555; margin-top: 20px;">
            Need help? Just reply to this email and our support team will assist you.
          </p>

          <p style="font-size: 14px; color: #2c3e50;">
            Best regards,<br>
            <strong>BuyerSeller Support Team</strong>
          </p>

          <hr style="margin: 40px 0; border: none; border-top: 1px solid #e0e0e0;" />

          <p style="font-size: 12px; text-align: center; color: #999999;">
            &copy; ${new Date().getFullYear()} BuyerSeller. All rights reserved.
          </p>
        </div>
      </div>
    `;

    await sendEmail(email, "Password Reset Token", htmlContent);

    res.status(200).json({
      status: "true",
      message: "Reset token sent successfully to your email.",
      resetToken,
    //  resetLink,
    });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ status: "false", message: "Server error" });
  }
};


const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    // Check if all fields exist
    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({
        status: "false",
        message: "Reset token, new password, and confirm password are required.",
      });
    }

    // Match passwords
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        status: "false",
        message: "New password and confirm password do not match.",
      });
    }

    // Find user with valid resetToken
    const [userRows] = await db.query(
      "SELECT * FROM user WHERE resetToken = ? AND resetTokenExpiry > NOW()",
      [resetToken]
    );

    if (userRows.length === 0) {
      return res.status(400).json({
        status: "false",
        message: "Invalid or expired reset token.",
      });
    }

    const user = userRows[0];

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and remove resetToken
    await db.query(
      "UPDATE user SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?",
      [hashedPassword, user.id]
    );

    res.status(200).json({
      status: "true",
      message: "Password has been reset successfully.",
    });

  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({
      status: "false",
      message: "Server error",
    });
  }
};

// Protected Route
const protectedRoute = (req, res) => {
    res.json({ message: 'You have accessed a protected route!', user: req.user });
    
};


// Export the functions
module.exports = { login, signUp, getAllUsers, getUserById, editProfile, deleteUserById, forgotPassword, resetPassword, protectedRoute };
