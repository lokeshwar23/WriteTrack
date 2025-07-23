const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Email templates
const emailTemplates = {
  emailVerification: {
    subject: 'Verify Your Email Address',
    template: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Task Manager!</h1>
          </div>
          <div class="content">
            <h2>Hi {{name}},</h2>
            <p>Thank you for registering with our Task Management application. To complete your registration, please verify your email address by clicking the button below:</p>
            <a href="{{verificationUrl}}" class="button">Verify Email Address</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p>{{verificationUrl}}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Task Manager. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  },
  
  passwordReset: {
    subject: 'Password Reset Request',
    template: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #2196F3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hi {{name}},</h2>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <a href="{{resetUrl}}" class="button">Reset Password</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p>{{resetUrl}}</p>
            <p>This link will expire in 10 minutes.</p>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Task Manager. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  },
  
  otpCode: {
    subject: 'Your OTP Code',
    template: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OTP Code</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #FF9800; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .otp-code { font-size: 32px; font-weight: bold; text-align: center; padding: 20px; background: #fff; border: 2px solid #FF9800; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your OTP Code</h1>
          </div>
          <div class="content">
            <h2>Hi {{name}},</h2>
            <p>Here is your One-Time Password (OTP) code:</p>
            <div class="otp-code">{{otp}}</div>
            <p>This code will expire in 5 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Task Manager. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  },
  
  taskAssigned: {
    subject: 'New Task Assigned',
    template: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Task Assigned</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #9C27B0; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .task-info { background: #fff; padding: 15px; border-left: 4px solid #9C27B0; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Task Assigned</h1>
          </div>
          <div class="content">
            <h2>Hi {{name}},</h2>
            <p>You have been assigned a new task:</p>
            <div class="task-info">
              <h3>{{taskTitle}}</h3>
              <p><strong>Assigned by:</strong> {{assignedBy}}</p>
            </div>
            <p>Please log in to your account to view the full details and start working on this task.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Task Manager. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  },
  
  taskReminder: {
    subject: 'Task Reminder',
    template: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Task Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #F44336; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .task-info { background: #fff; padding: 15px; border-left: 4px solid #F44336; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Task Reminder</h1>
          </div>
          <div class="content">
            <h2>Hi {{name}},</h2>
            <p>This is a reminder for your upcoming task:</p>
            <div class="task-info">
              <h3>{{taskTitle}}</h3>
              <p><strong>Due Date:</strong> {{dueDate}}</p>
              <p><strong>Priority:</strong> {{priority}}</p>
              <p><strong>Category:</strong> {{category}}</p>
            </div>
            <p>Please log in to your account to view the full details and update the task status.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Task Manager. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
};

// Function to replace template variables
const replaceTemplateVariables = (template, data) => {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
};

// Main send email function
const sendEmail = async ({ to, subject, template, data = {} }) => {
  try {
    // Check if email service is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email service not configured. Skipping email send.');
      console.log('To configure email service, set EMAIL_USER and EMAIL_PASS environment variables.');
      return { success: true, message: 'Email service not configured - skipping send' };
    }

    const transporter = createTransporter();
    
    // Get template
    const emailTemplate = emailTemplates[template];
    if (!emailTemplate) {
      throw new Error(`Email template '${template}' not found`);
    }

    // Replace template variables
    const htmlContent = replaceTemplateVariables(emailTemplate.template, data);
    const emailSubject = replaceTemplateVariables(emailTemplate.subject, data);

    // Send email
    const info = await transporter.sendMail({
      from: `"Task Manager" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: emailSubject,
      html: htmlContent,
    });

    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Function to send bulk emails
const sendBulkEmails = async (emails) => {
  const results = [];
  
  for (const emailData of emails) {
    const result = await sendEmail(emailData);
    results.push(result);
    
    // Add delay between emails to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
};

// Function to send task reminders
const sendTaskReminders = async (tasks) => {
  const emails = [];
  
  for (const task of tasks) {
    const user = await require('../models/User').findById(task.user);
    if (user && user.preferences.notifications.email) {
      emails.push({
        to: user.email,
        subject: 'Task Reminder',
        template: 'taskReminder',
        data: {
          name: user.name,
          taskTitle: task.title,
          dueDate: task.dueDate.toLocaleDateString(),
          priority: task.priority,
          category: task.category
        }
      });
    }
  }
  
  return await sendBulkEmails(emails);
};

// Function to send welcome email
const sendWelcomeEmail = async (user) => {
  return await sendEmail({
    to: user.email,
    subject: 'Welcome to Task Manager!',
    template: 'emailVerification',
    data: {
      name: user.name,
      verificationUrl: `${process.env.CLIENT_URL}/verify-email?token=${user.verificationToken}`
    }
  });
};

// Function to send password reset email
const sendPasswordResetEmail = async (user, resetToken) => {
  return await sendEmail({
    to: user.email,
    subject: 'Password Reset Request',
    template: 'passwordReset',
    data: {
      name: user.name,
      resetUrl: `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`
    }
  });
};

// Function to send OTP email
const sendOTPEmail = async (user, otp) => {
  return await sendEmail({
    to: user.email,
    subject: 'Your OTP Code',
    template: 'otpCode',
    data: {
      name: user.name,
      otp: otp
    }
  });
};

// Function to send task assignment notification
const sendTaskAssignmentEmail = async (assignedUser, task, assignedBy) => {
  return await sendEmail({
    to: assignedUser.email,
    subject: 'New Task Assigned',
    template: 'taskAssigned',
    data: {
      name: assignedUser.name,
      taskTitle: task.title,
      assignedBy: assignedBy.name
    }
  });
};

module.exports = {
  sendEmail,
  sendBulkEmails,
  sendTaskReminders,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendOTPEmail,
  sendTaskAssignmentEmail
}; 