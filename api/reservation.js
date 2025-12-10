const { Resend } = require('resend');

module.exports = async (req, res) => {
  // CORS headers (same as before)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, phone, date, time, guests, message } = req.body;

    // Validation (same as before)
    if (!name || !email || !phone || !date || !time || !guests || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Get environment variables
    const resendApiKey = process.env.RESEND_API_KEY;
    const restaurantEmail = process.env.RESTAURANT_EMAIL;

    if (!resendApiKey || !restaurantEmail) {
      return res.status(500).json({ 
        error: 'Email service not configured' 
      });
    }

    // Initialize Resend
    const resend = new Resend(resendApiKey);

    // Format date
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // 1. Send email to restaurant
    await resend.emails.send({
      from: 'Restaurant Reservations <onboarding@resend.dev>', // Use your verified domain later
      to: restaurantEmail,
      subject: `New Reservation - ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e67e22;">New Reservation Received</h2>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Customer Information</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${time}</p>
            <p><strong>Number of Guests:</strong> ${guests}</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Order Details / Special Requests</h3>
            <p>${message.replace(/\n/g, '<br>')}</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #eee;">
            <p style="color: #666; font-size: 14px;">
              This reservation was submitted on ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      `
    });

    // 2. Send confirmation email to customer
    await resend.emails.send({
      from: 'Restaurant Name <onboarding@resend.dev>', // Use your verified domain later
      to: email,
      subject: 'Reservation Confirmation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #e67e22; margin: 0;">Restaurant Name</h1>
            <p style="color: #666;">Thank you for your reservation!</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #2c3e50; margin-top: 0;">Hello ${name},</h2>
            <p style="font-size: 16px; line-height: 1.6;">
              Your reservation has been received and is being processed.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #e67e22;">
              <h3 style="margin-top: 0; color: #2c3e50;">Reservation Details:</h3>
              <p><strong>Date:</strong> ${formattedDate}</p>
              <p><strong>Time:</strong> ${time}</p>
              <p><strong>Guests:</strong> ${guests} ${guests === '1' ? 'person' : 'people'}</p>
              <p><strong>Contact Phone:</strong> ${phone}</p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3498db;">
              <h3 style="margin-top: 0; color: #2c3e50;">Order Summary:</h3>
              <p>${message.replace(/\n/g, '<br>')}</p>
              <p style="margin-top: 15px; padding: 15px; background: #e8f4fc; border-radius: 4px;">
                <strong>Note:</strong> Hello ${name}, your order has been received. Wait for a call when meals are ready.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px;">
              If you need to make changes to your reservation, please call us at (123) 456-7890
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 20px;">
              Restaurant Name • 123 Main Street • City, State 12345
            </p>
          </div>
        </div>
      `
    });

    console.log(`Reservation submitted: ${name} - ${email}`);

    return res.status(200).json({ 
      success: true, 
      message: 'Reservation submitted successfully. Confirmation email sent.' 
    });

  } catch (error) {
    console.error('Resend error:', error);
    
    return res.status(500).json({ 
      error: 'Failed to send reservation',
      details: error.message 
    });
  }
};
