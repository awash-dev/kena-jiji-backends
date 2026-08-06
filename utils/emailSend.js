const sendPasswordResetEmail = async (user, resetToken) => {
    const resetUrl = `${process.env.BASE_URL}/reset-password?token=${resetToken}`;
  
    const mailOptions = {
      from: `"Your App Name" <${process.env.EMAIL_USER}>`,
      to: user,
      subject: "Password Reset Request",
      html: `<h2>Password Reset</h2>
             <p>Hello ${user},</p>
             <p>You requested to reset your password. Please click the link below to reset it:</p>
             <a href="${resetUrl}">Reset Password</a>
             <p>This link expires in one hour.</p>`,
    };
  
    try {
      await transporter.sendMail(mailOptions);
      console.log("Password reset email sent.");
    } catch (error) {
      console.error("Error sending password reset email:", error);
    }
  };
  