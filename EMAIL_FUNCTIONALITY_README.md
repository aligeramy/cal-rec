# Email Functionality with PDF Generation

This document explains how the email functionality works in the Cal.com transcription system, including PDF generation and sending.

## Features

✅ **PDF Generation**: Automatically generates professional PDF documents from transcripts  
✅ **Email Sending**: Uses Resend API to send emails with PDF attachments  
✅ **Client & Admin Support**: Separate buttons for sending to clients and administrators  
✅ **Professional Formatting**: Clean, branded PDF layout with meeting metadata  
✅ **Flexible Content**: Include/exclude notes and transcript content as needed  

## How It Works

### 1. PDF Generation (`lib/pdf-generator.ts`)

The system uses Puppeteer to generate PDFs from HTML templates:

- **Professional Layout**: Branded header, metadata sections, and clean typography
- **Responsive Design**: Optimized for A4 printing with proper margins
- **Content Sections**: Meeting information, notes, and full transcript
- **Page Headers/Footers**: Meeting title and page numbers

### 2. Email API (`app/api/transcripts/send-email/route.ts`)

The email endpoint handles:

- **Authentication**: Verifies user session
- **PDF Generation**: Creates PDF attachment when `sendAsPDF: true`
- **Email Composition**: Different templates for PDF vs HTML emails
- **Resend Integration**: Sends emails via Resend API with attachments

### 3. Frontend Integration (`components/transcript-viewer.tsx`)

The UI provides:

- **Send PDF to Client**: Button to email PDF to the meeting client
- **Send PDF to Admin**: Button to email PDF to the meeting host/admin
- **Loading States**: Visual feedback during email sending
- **Error Handling**: Toast notifications for success/failure

## Configuration

### Environment Variables

Make sure these are set in your `.env` file:

```env
RESEND_API_KEY="your_resend_api_key_here"
NEXT_PUBLIC_URL="https://your-domain.com"  # or http://localhost:3000 for dev
```

### Email Domain

The system is configured to send emails from:
```
TranscriptAI <no-reply@mail.softx.ca>
```

## Usage

### From the UI

1. Navigate to any transcript detail page (`/dashboard/transcripts/[id]`)
2. Scroll to the transcript viewer section
3. Click either:
   - **"Send PDF to Client"** - Sends to the client's email address
   - **"Send PDF to Admin"** - Sends to the host's email address

### API Usage

You can also send emails programmatically:

```javascript
const response = await fetch('/api/transcripts/send-email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    transcriptId: 'your-transcript-id',
    recipient: {
      email: 'recipient@example.com',
      name: 'Recipient Name'
    },
    subject: 'Meeting Transcript',
    includeNotes: true,
    includeTranscript: true,
    sendAsPDF: true  // Set to false for HTML email
  })
});
```

## PDF Content Structure

The generated PDF includes:

### Header Section
- TranscriptAI branding
- Meeting title
- "Meeting Transcript Report" subtitle

### Recipient Information
- Prepared for: [Name] (Client/Administrator)

### Meeting Information
- Meeting Date & Time
- Duration
- Booking ID
- Client and Host details

### Content Sections
- **Meeting Notes**: If available and included
- **Full Transcript**: Complete conversation transcript
- **Status Information**: If transcript is not yet ready

### Footer
- Page numbers
- Generation date
- Company branding

## Testing

### Manual Testing

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Navigate to a transcript**:
   - Go to `/dashboard/transcripts`
   - Click on any completed transcript
   - Scroll to the transcript viewer

3. **Test email sending**:
   - Click "Send PDF to Client" or "Send PDF to Admin"
   - Check the recipient's email for the PDF attachment

### Test with Demo Mode

The transcript viewer has a "Demo Mode" that provides sample data for testing without needing real transcripts.

## Troubleshooting

### Common Issues

1. **"No email address found"**
   - Ensure the transcript has client/host email addresses
   - Check the database for missing email fields

2. **PDF generation fails**
   - Verify Puppeteer is installed: `npm install puppeteer`
   - Check server logs for Puppeteer errors
   - Ensure sufficient memory for PDF generation

3. **Email sending fails**
   - Verify `RESEND_API_KEY` is set correctly
   - Check Resend dashboard for API limits/errors
   - Ensure email domain is verified in Resend

4. **Authentication errors**
   - Make sure user is logged in
   - Check session validity

### Debug Logs

The system provides detailed logging:

```javascript
// Check browser console for frontend errors
// Check server logs for backend errors
console.log('Email sending result:', result);
```

## Dependencies

- **puppeteer**: PDF generation from HTML
- **resend**: Email sending service
- **@types/puppeteer**: TypeScript definitions

## Security Considerations

- ✅ Authentication required for all email endpoints
- ✅ Transcript access validation
- ✅ Email rate limiting via Resend
- ✅ No sensitive data in PDF filenames
- ✅ Secure PDF generation (no external resources)

## Future Enhancements

Potential improvements:

- [ ] Email templates customization
- [ ] Bulk email sending
- [ ] Email delivery tracking
- [ ] PDF password protection
- [ ] Custom branding options
- [ ] Email scheduling 