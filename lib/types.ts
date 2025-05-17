export type User = {
  id: string;
  name: string | null;
  email: string;
  password: string | null;
  emailVerified: Date | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type MeetingTranscript = {
  id: string;
  bookingUid: string;
  title: string | null;
  startTime: Date | null;
  endTime: Date | null;
  transcript: string | null;
  createdAt: Date;
  updatedAt: Date;
  status: string;
  clientName: string | null;
  clientEmail: string | null;
  hostName: string | null;
  hostEmail: string | null;
  duration: number | null;
  meetingType: string | null;
  location: string | null;
  notes: string | null;
  recordingUrl: string | null;
}; 