// Email service for OTP and notifications using SMTP (nodemailer)
import nodemailer from 'nodemailer';

// Create SMTP transporter
const createTransporter = () => {
	return nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		port: parseInt(process.env.SMTP_PORT || '587'),
		secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASSWORD,
		},
	});
};

/**
 * Generate a random 6-digit OTP
 */
export function generateOTP(): string {
	return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP to user's email via SMTP
 */
export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
	try {
		// Validate required environment variables
		if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
			console.error('❌ SMTP configuration is missing. Please set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD in .env');
			return false;
		}

		const transporter = createTransporter();

		const mailOptions = {
			from: process.env.SMTP_FROM || process.env.SMTP_USER,
			to: email,
			subject: 'Your PeerPulse Verification Code',
			html: generateOTPEmailHTML(otp, email),
		};

		console.log(`📧 Sending OTP email...`);
		console.log(`   To: ${email}`);
		console.log(`   From: ${mailOptions.from}`);
		console.log(`   Subject: ${mailOptions.subject}`);

		const info = await transporter.sendMail(mailOptions);
		
		console.log(`✅ OTP email sent successfully!`);
		console.log(`   Message ID: ${info.messageId}`);
		console.log(`   Response: ${info.response}`);
		
		return true;
	} catch (error) {
		console.error('❌ Error sending OTP email:');
		console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`);
		
		// Provide helpful debugging information
		if (error instanceof Error && error.message.includes('getaddrinfo')) {
			console.error('   → SMTP host not found. Check SMTP_HOST in .env');
		} else if (error instanceof Error && error.message.includes('EAUTH')) {
			console.error('   → Authentication failed. Check SMTP_USER and SMTP_PASSWORD');
		} else if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
			console.error('   → Connection refused. Check SMTP_HOST and SMTP_PORT');
		}
		
		return false;
	}
}

/**
 * Send welcome email after successful signup
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
	try {
		// Validate required environment variables
		if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
			console.error('❌ SMTP configuration is missing. Please set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD in .env');
			return false;
		}

		const transporter = createTransporter();

		const mailOptions = {
			from: process.env.SMTP_FROM || process.env.SMTP_USER,
			to: email,
			subject: 'Welcome to PeerPulse! 🎉',
			html: generateWelcomeEmailHTML(name),
		};

		console.log(`📧 Sending welcome email...`);
		console.log(`   To: ${email}`);
		console.log(`   From: ${mailOptions.from}`);
		console.log(`   Subject: ${mailOptions.subject}`);

		const info = await transporter.sendMail(mailOptions);
		
		console.log(`✅ Welcome email sent successfully!`);
		console.log(`   Message ID: ${info.messageId}`);
		console.log(`   Response: ${info.response}`);
		
		return true;
	} catch (error) {
		console.error('❌ Error sending welcome email:');
		console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`);
		
		// Provide helpful debugging information
		if (error instanceof Error && error.message.includes('getaddrinfo')) {
			console.error('   → SMTP host not found. Check SMTP_HOST in .env');
		} else if (error instanceof Error && error.message.includes('EAUTH')) {
			console.error('   → Authentication failed. Check SMTP_USER and SMTP_PASSWORD');
		} else if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
			console.error('   → Connection refused. Check SMTP_HOST and SMTP_PORT');
		}
		
		return false;
	}
}

/**
 * Generate OTP email HTML
 */
function generateOTPEmailHTML(otp: string, email: string): string {
	return `
		<!DOCTYPE html>
		<html>
			<head>
				<style>
					body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; }
					.container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
					.header { text-align: center; margin-bottom: 30px; }
					.logo { font-size: 28px; font-weight: bold; background: linear-gradient(135deg, #5227FF, #FF1493); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
					.content { text-align: center; }
					.otp-box { background: linear-gradient(135deg, #5227FF15, #FF149315); border: 2px solid #5227FF; border-radius: 8px; padding: 20px; margin: 30px 0; }
					.otp-code { font-size: 36px; font-weight: bold; letter-spacing: 4px; color: #5227FF; font-family: monospace; }
					.expire-notice { color: #666; font-size: 14px; margin-top: 20px; }
					.footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
				</style>
			</head>
			<body>
				<div class="container">
					<div class="header">
						<div class="logo">PeerPulse</div>
					</div>
					<div class="content">
						<h2 style="color: #333;">Email Verification</h2>
						<p style="color: #666; margin: 20px 0;">Your verification code is:</p>
						<div class="otp-box">
							<div class="otp-code">${otp}</div>
						</div>
						<p style="color: #666; margin: 20px 0;">Enter this code to verify your email address and complete your registration.</p>
						<div class="expire-notice">
							<p>⏱️ This code expires in 10 minutes</p>
							<p>🔒 Never share this code with anyone</p>
						</div>
					</div>
					<div class="footer">
						<p>© 2026 PeerPulse. All rights reserved.</p>
					</div>
				</div>
			</body>
		</html>
	`;
}

/**
 * Generate welcome email HTML
 */
function generateWelcomeEmailHTML(name: string): string {
	return `
		<!DOCTYPE html>
		<html>
			<head>
				<style>
					body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; }
					.container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
					.header { text-align: center; margin-bottom: 30px; }
					.logo { font-size: 28px; font-weight: bold; background: linear-gradient(135deg, #5227FF, #FF1493); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
					.content { text-align: center; }
					.footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
				</style>
			</head>
			<body>
				<div class="container">
					<div class="header">
						<div class="logo">PeerPulse</div>
					</div>
					<div class="content">
						<h2 style="color: #333;">Welcome to PeerPulse, ${name}! 🎉</h2>
						<p style="color: #666; margin: 20px 0;">Your account has been successfully verified. You're now part of a vibrant community of students, teachers, and professionals.</p>
						<p style="color: #666;">Start exploring, connecting, and sharing your knowledge today!</p>
					</div>
					<div class="footer">
						<p>© 2026 PeerPulse. All rights reserved.</p>
					</div>
				</div>
			</body>
		</html>
	`;
}
