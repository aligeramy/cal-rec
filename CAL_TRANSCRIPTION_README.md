# Cal.com Native Transcription Integration

This document explains how the system now uses Cal.com's native transcription service instead of the external VPS transcription service.

## Overview

The system has been updated to leverage Cal.com's built-in transcription capabilities, which provides:

✅ **Native Integration**: Direct API access to Cal.com's transcription service  
✅ **Multiple Formats**: JSON, TXT, SRT, and VTT transcript formats  
✅ **Rich Data**: Word-level timestamps, confidence scores, and speaker identification  
✅ **Simplified Architecture**: No external VPS dependency  
✅ **Better Reliability**: Managed by Cal.com's infrastructure  

## How It Works

### 1. Webhook Flow

```
Cal.com Meeting → Recording Ready → Webhook → Process Transcription → Update Database
```

1. **Meeting Ends**: Cal.com automatically records the meeting
2. **RECORDING_READY**: Cal.com sends webhook when recording is processed
3. **Transcription Processing**: System waits 60s then fetches transcripts via API
4. **Database Update**: Transcript data is stored in the database
5. **Email Sending**: PDF transcripts can be sent to clients/admins

### 2. API Integration

The system uses these Cal.com API endpoints:

- `GET /v1/bookings` - Find booking by UID to get numeric ID
- `GET /v1/bookings/{id}/recordings` - Get recordings for a booking  
- `GET /v1/bookings/{id}/transcripts/{recordingId}` - Get transcript formats

### 3. Data Processing

**JSON Transcript Structure** (from Cal.com):
```json
{
  "metadata": {
    "duration": 11.498688,
    "created": "2025-05-26T21:40:15.100Z"
  },
  "results": {
    "channels": [{
      "alternatives": [{
        "transcript": "Full transcript text...",
        "confidence": 0.9996321,
        "words": [
          {
            "word": "hello",
            "start": 1.92,
            "end": 2.42,
            "confidence": 0.8984588,
            "speaker": 0,
            "punctuated_word": "Hello,"
          }
        ]
      }]
    }],
    "utterances": [
      {
        "start": 1.92,
        "end": 2.42,
        "transcript": "Hello,",
        "speaker": 0
      }
    ]
  }
}
```

**Stored Format** (in database):
- `transcript` field: Plain text transcript
- `transcriptJson` field: Processed JSON with words, utterances, and metadata

## Configuration

### Environment Variables

```env
CALCOM_API="cal_live_90103c78a8e4b3cd0a0b55d6b7f06ee4"
CAL_WEBHOOK_SECRET="kIcx1x5uamWgZQ3n00DHfodONd8Ga9RcX8YZZZDfP+o="
```

### Webhook Setup

The webhook endpoint `/api/webhooks/cal` handles these events:

- `BOOKING_CREATED` - Creates transcript record
- `RECORDING_READY` - Triggers transcription processing  
- `BOOKING_CANCELLED` - Marks transcript as cancelled
- `MEETING_ENDED` - Updates end time

## Key Improvements

### Before (VPS Transcription)
- ❌ External dependency on VPS at `198.251.68.5:3039`
- ❌ Complex audio processing with FFmpeg
- ❌ Manual OpenAI Whisper API calls
- ❌ File download and conversion overhead
- ❌ Additional infrastructure to maintain

### After (Cal.com Native)
- ✅ Direct Cal.com API integration
- ✅ No external dependencies
- ✅ Professional transcription service
- ✅ Multiple output formats available
- ✅ Simplified error handling

## Testing

### Manual Testing

1. **Create a test meeting** in Cal.com with recording enabled
2. **Join and record** the meeting with some speech
3. **End the meeting** and wait for processing
4. **Check the webhook logs** in your Next.js console
5. **Verify the transcript** appears in the dashboard

### API Testing

Run the test script to verify API integration:

```bash
node test-cal-transcription.js
```

This will:
- Find a booking by UID
- Get recordings for that booking
- Fetch available transcript formats
- Download and display transcript content

## Troubleshooting

### Common Issues

1. **"No recordings found"**
   - Ensure the meeting was actually recorded
   - Check that recording is enabled in Cal.com event type
   - Wait longer for Cal.com to process the recording

2. **"Recording not ready yet"**
   - Cal.com needs time to process recordings
   - The system waits 60 seconds before checking
   - Large recordings may take longer to process

3. **"No transcripts found"**
   - Cal.com may not have generated transcripts yet
   - Check if the recording had actual speech content
   - Verify the recording duration is sufficient

4. **API authentication errors**
   - Verify `CALCOM_API` key is correct
   - Check API key permissions in Cal.com dashboard
   - Ensure API key has access to recordings and transcripts

### Debug Information

The system provides detailed logging:

```javascript
// Webhook processing
console.log("🔄 Starting Cal.com transcription processing");
console.log("📋 Found numeric booking ID:", numericBookingId);
console.log("🎥 Found recordings:", recordings.length);
console.log("📝 Found transcript formats:", transcripts.map(t => t.format));
```

## API Response Examples

### Recordings API Response
```json
[
  {
    "id": "7e6d98db-5741-4ee9-bd2d-50170d861dac",
    "status": "finished",
    "duration": 12,
    "download_link": "https://cal-video-recordings.s3.us-east-2.amazonaws.com/..."
  }
]
```

### Transcripts API Response
```json
[
  {
    "format": "json",
    "link": "https://daily-co-batch-processor-prod-us-west-2.s3.us-west-2.amazonaws.com/..."
  },
  {
    "format": "txt", 
    "link": "https://daily-co-batch-processor-prod-us-west-2.amazonaws.com/..."
  },
  {
    "format": "srt",
    "link": "https://daily-co-batch-processor-prod-us-west-2.amazonaws.com/..."
  },
  {
    "format": "vtt",
    "link": "https://daily-co-batch-processor-prod-us-west-2.amazonaws.com/..."
  }
]
```

## Migration Notes

### What Changed
- Removed VPS transcription service dependency
- Updated webhook handler to use Cal.com API
- Removed `/api/transcripts/webhook` endpoint (no longer needed)
- Added Cal.com API integration functions

### What Stayed the Same
- Database schema (no changes needed)
- Frontend components (transcript viewer, email functionality)
- PDF generation and email sending
- Authentication and user management

## Future Enhancements

Potential improvements:

- [ ] Support for multiple transcript formats in UI
- [ ] Real-time transcription status updates
- [ ] Transcript editing with word-level precision
- [ ] Speaker identification and labeling
- [ ] Integration with Cal.com's SRT/VTT formats for video playback
- [ ] Automatic transcript quality scoring

## Security Considerations

- ✅ Cal.com API key stored securely in environment variables
- ✅ Webhook signature verification for Cal.com events
- ✅ No sensitive data in transcript filenames
- ✅ Secure S3 links with time-limited access tokens
- ✅ Database access controlled by authentication

## Performance Benefits

- **Faster Processing**: No file download/conversion overhead
- **Better Reliability**: Managed by Cal.com's infrastructure  
- **Reduced Complexity**: Fewer moving parts and dependencies
- **Cost Effective**: No VPS hosting costs for transcription service
- **Scalability**: Leverages Cal.com's scalable transcription infrastructure 