/**
 * Email Templates for KiddiesCheck Registration Workflow
 */

export const emailTemplates = {
  // OTP Verification Email
  registrationOTP: (firstName, otp, schoolName) => `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .otp-box { background: white; border: 2px solid #667eea; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
          .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
          .warning { background: #fef3c7; padding: 10px 15px; border-radius: 5px; margin-top: 15px; color: #92400e; }
          .logo { font-size: 24px; font-weight: bold; color: white; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🎓 KiddiesCheck</div>
            <h2>Email Verification Required</h2>
          </div>
          <div class="content">
            <p>Hello ${firstName},</p>
            <p>Thank you for registering your school <strong>${schoolName}</strong> with KiddiesCheck. We're excited to have you onboard!</p>
            <p>To verify your email address, please use the following One-Time Password (OTP):</p>
            
            <div class="otp-box">
              <p style="margin: 0 0 10px 0; color: #666;">Your OTP Code:</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 10px 0 0 0; color: #999; font-size: 14px;"><strong>Valid for 10 minutes</strong></p>
            </div>

            <p>Enter this code on the KiddiesCheck verification page to proceed with your registration.</p>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong><br>
              Never share this OTP with anyone. KiddiesCheck staff will never ask for your OTP.
            </div>

            <p>If you did not request this registration, please contact our support team immediately.</p>
            
            <hr>
            <p><small>Best regards,<br><strong>KiddiesCheck Team</strong></small></p>
          </div>
          <div class="footer">
            <p>© 2026 KiddiesCheck. All rights reserved.</p>
            <p>This is an automated email. Please do not reply directly.</p>
          </div>
        </div>
      </body>
    </html>
  `,

  // Admin Notification - New Registration Pending
  adminPendingApproval: (firstName, lastName, email, schoolName, schoolModel, location, numberOfStudents, numberOfTeachers) => `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .details-box { background: white; border-left: 4px solid #667eea; padding: 15px; margin: 15px 0; }
          .label { font-weight: bold; color: #667eea; }
          .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
          .action-button { display: inline-block; background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>New School Registration - Pending Review</h2>
          </div>
          <div class="content">
            <p>Hello Admin,</p>
            <p>A new school has registered with KiddiesCheck and is awaiting your approval. Please review the details below:</p>
            
            <div class="details-box">
              <p><span class="label">Contact Person:</span> ${firstName} ${lastName}</p>
              <p><span class="label">Email:</span> ${email}</p>
              <p><span class="label">School Name:</span> ${schoolName}</p>
              <p><span class="label">School Model:</span> ${schoolModel}</p>
              <p><span class="label">Location:</span> ${location}</p>
              <p><span class="label">Number of Students:</span> ${numberOfStudents}</p>
              <p><span class="label">Number of Teachers:</span> ${numberOfTeachers}</p>
            </div>

            <p>This registration is pending approval. Please log in to your admin dashboard to review and approve/reject this application.</p>
            
            <a href="${process.env.FRONTEND_URL}/admin/pending-approvals" class="action-button">Review in Dashboard</a>

            <hr>
            <p><small>KiddiesCheck Admin System</small></p>
          </div>
          <div class="footer">
            <p>© 2026 KiddiesCheck. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `,

  // Approval Confirmation Email
  registrationApproved: (firstName, schoolName) => `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .success-box { background: #d1fae5; border: 2px solid #10b981; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .success-icon { font-size: 48px; margin-bottom: 10px; }
          .success-title { font-size: 24px; font-weight: bold; color: #059669; }
          .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
          .action-button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 15px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🎉 Welcome to KiddiesCheck!</h2>
          </div>
          <div class="content">
            <p>Hello ${firstName},</p>
            
            <div class="success-box">
              <div class="success-icon">✓</div>
              <div class="success-title">Registration Approved!</div>
              <p style="margin: 10px 0 0 0; color: #047857;">Your application to register <strong>${schoolName}</strong> has been approved.</p>
            </div>

            <p>Great news! Your school registration has been approved by our administration team. You can now access your KiddiesCheck dashboard with full functionality.</p>

            <h3 style="color: #667eea;">What's Next?</h3>
            <ul>
              <li>Log in to your dashboard to set up your school profile</li>
              <li>Invite teachers and staff members to your account</li>
              <li>Create classrooms and manage students</li>
              <li>Access all KiddiesCheck features</li>
            </ul>

            <p>If you have any questions or need assistance, our support team is here to help!</p>

            <a href="${process.env.FRONTEND_URL}/dashboard" class="action-button">Access Your Dashboard</a>

            <hr>
            <p><small>Best regards,<br><strong>KiddiesCheck Team</strong></small></p>
          </div>
          <div class="footer">
            <p>© 2026 KiddiesCheck. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `,

  // Registration Rejected Email
  registrationRejected: (firstName, schoolName, rejectionReason) => `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .warning-box { background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .warning-title { font-weight: bold; color: #d97706; margin-bottom: 10px; }
          .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
          .action-button { display: inline-block; background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Registration Status Update</h2>
          </div>
          <div class="content">
            <p>Hello ${firstName},</p>
            
            <div class="warning-box">
              <div class="warning-title">⚠️ Application Not Approved</div>
              <p>Unfortunately, your application to register ${schoolName} with KiddiesCheck could not be approved at this time.</p>
            </div>

            <h3>Reason for Rejection:</h3>
            <p>${rejectionReason}</p>

            <h3>What Can You Do?</h3>
            <p>You can:</p>
            <ul>
              <li>Review the feedback above and correct the issues</li>
              <li>Submit a new application with updated information</li>
              <li>Contact our support team if you have questions about the decision</li>
            </ul>

            <p>We encourage you to reach out to our support team for more detailed guidance on how to proceed.</p>

            <a href="${process.env.FRONTEND_URL}/contact" class="action-button">Contact Support</a>

            <hr>
            <p><small>Best regards,<br><strong>KiddiesCheck Team</strong></small></p>
          </div>
          <div class="footer">
            <p>© 2026 KiddiesCheck. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `,

  // Parent Attendance Notification Email
  parentAttendanceNotification: (parentName, studentName, studentPicture, status, schoolName, attendanceTime) => `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .student-box { background: white; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 8px; display: flex; align-items: center; gap: 15px; }
          .student-photo { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 3px solid #667eea; }
          .student-info h3 { margin: 0 0 5px 0; color: #667eea; }
          .student-info p { margin: 0; color: #666; }
          .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin-top: 10px; }
          .status-present { background: #d1fae5; color: #065f46; }
          .status-late { background: #fef3c7; color: #92400e; }
          .status-absent { background: #fee2e2; color: #991b1b; }
          .time-info { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .time-info strong { color: #1e40af; }
          .school-name { text-align: center; color: #667eea; font-weight: bold; margin-top: 20px; padding-top: 15px; border-top: 2px solid #e5e7eb; }
          .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
          .icon { font-size: 24px; margin-right: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div style="font-size: 32px; margin-bottom: 10px;">✓</div>
            <h2>Attendance Marked</h2>
            <p>Your child is in school</p>
          </div>
          <div class="content">
            <p>Hello ${parentName},</p>
            <p>We're writing to inform you that your child has been marked present for today.</p>
            
            <div class="student-box">
              ${studentPicture ? `<img src="${studentPicture}" alt="${studentName}" class="student-photo" crossorigin="anonymous">` : '<div style="width: 60px; height: 60px; border-radius: 50%; background: #667eea; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; border: 3px solid #667eea;">👤</div>'}
              <div class="student-info">
                <h3>${studentName}</h3>
                <p>${schoolName}</p>
                <span class="status-badge status-${status === 'present' ? 'present' : status === 'late' ? 'late' : 'absent'}">
                  ${status === 'present' ? '✓ Present' : status === 'late' ? '⏱ Late' : '✗ Absent'}
                </span>
              </div>
            </div>

            <div class="time-info">
              <strong>📅 Attendance Details:</strong><br>
              Status: <strong>${status.charAt(0).toUpperCase() + status.slice(1)}</strong><br>
              Date & Time: <strong>${new Date(attendanceTime).toLocaleString('en-GB', { 
                year: 'numeric',
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}</strong>
            </div>

            <p>If you have any questions or concerns about your child's attendance, please contact the school directly.</p>

            <div class="school-name">
              ${schoolName}
            </div>

            <hr>
            <p><small>Best regards,<br><strong>KiddiesCheck Team</strong></small></p>
          </div>
          <div class="footer">
            <p>© 2026 KiddiesCheck. All rights reserved.</p>
            <p>This is an automated notification. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `,
};

export default emailTemplates;
