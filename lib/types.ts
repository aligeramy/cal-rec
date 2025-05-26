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

export type Word = {
  word: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: number;
  punctuated_word?: string;
};

export type Utterance = {
  start: number;
  end: number;
  confidence: number;
  transcript: string;
  speaker: number;
};

export type TranscriptJson = {
  words: Word[];
  utterances?: Utterance[];
  metadata?: {
    duration: number;
    created: string;
  };
};

export type MeetingTranscript = {
  id: string;
  bookingUid: string;
  title: string | null;
  startTime: Date | null;
  endTime: Date | null;
  transcript: string | null;
  transcriptJson: TranscriptJson | null;
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