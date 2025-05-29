import OpenAI from 'openai';
import { ConversationTemplate } from './conversation-templates';
import { TranscriptJson, Word, Utterance } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface GeneratedConversation {
  transcript: string;
  transcriptJson: TranscriptJson;
  duration: number;
}

export interface ConversationSegment {
  speaker: number;
  text: string;
  duration: number;
}

export async function generateConversation(
  template: ConversationTemplate,
  clientName: string = 'Client',
  hostName: string = 'Host'
): Promise<GeneratedConversation> {
  try {
    console.log('🤖 Generating AI conversation with template:', template.name);

    const prompt = `${template.prompt}

Please generate a conversation in the following JSON format:
{
  "segments": [
    {
      "speaker": 0 or 1,
      "text": "What the speaker says",
      "duration": number_of_seconds_this_segment_takes
    }
  ]
}

Speaker 0 should be the ${clientName} and Speaker 1 should be the ${hostName}.
Make sure the total duration is approximately ${template.duration} minutes (${template.duration * 60} seconds).
Each segment should be a natural speaking turn, not too long (usually 5-30 seconds).
Include natural conversation flow with realistic timing.

Return ONLY the JSON, no other text.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Generate a conversation between a client and pharmacist. The client is a new client and the pharmacist is the host. The client is asking about a new prescription and the pharmacist is explaining the process. The client is looking for narcan. The pharmacist is specialized in narcan."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 4000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    console.log('🤖 Raw OpenAI response:', response.substring(0, 200) + '...');

    // Parse the JSON response
    let parsedResponse;
    try {
      // Clean the response in case there's extra text
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : response;
      parsedResponse = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      throw new Error('Invalid JSON response from OpenAI');
    }

    if (!parsedResponse.segments || !Array.isArray(parsedResponse.segments)) {
      throw new Error('Invalid response format from OpenAI');
    }

    // Convert to our format
    const segments: ConversationSegment[] = parsedResponse.segments;
    let currentTime = 0;
    const utterances: Utterance[] = [];
    const words: Word[] = [];
    let fullTranscript = '';

    for (const segment of segments) {
      const startTime = currentTime;
      const endTime = currentTime + segment.duration;
      
      // Create utterance
      utterances.push({
        start: startTime,
        end: endTime,
        confidence: 0.95, // High confidence for AI generated content
        transcript: segment.text,
        speaker: segment.speaker,
      });

      // Create words (simplified - split by spaces and estimate timing)
      const wordsInSegment = segment.text.split(/\s+/).filter(word => word.length > 0);
      const timePerWord = segment.duration / wordsInSegment.length;
      
      wordsInSegment.forEach((word, index) => {
        const wordStart = startTime + (index * timePerWord);
        const wordEnd = startTime + ((index + 1) * timePerWord);
        
        words.push({
          word: word.toLowerCase().replace(/[^\w]/g, ''),
          start: wordStart,
          end: wordEnd,
          confidence: 0.95,
          speaker: segment.speaker,
          punctuated_word: word,
        });
      });

      // Add to full transcript
      fullTranscript += segment.text + ' ';
      currentTime = endTime;
    }

    const transcriptJson: TranscriptJson = {
      words,
      utterances,
      metadata: {
        duration: currentTime,
        created: new Date().toISOString(),
      },
    };

    console.log('✅ Generated conversation:', {
      utterances: utterances.length,
      words: words.length,
      duration: currentTime,
      transcriptLength: fullTranscript.length
    });

    return {
      transcript: fullTranscript.trim(),
      transcriptJson,
      duration: Math.round(currentTime / 60), // Convert to minutes
    };

  } catch (error) {
    console.error('❌ Error generating conversation:', error);
    throw new Error(`Failed to generate conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function testOpenAIConnection(): Promise<boolean> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Hello" }],
      max_tokens: 5,
    });
    
    return !!completion.choices[0]?.message?.content;
  } catch (error) {
    console.error('OpenAI connection test failed:', error);
    return false;
  }
} 