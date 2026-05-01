/**
 * aiController.js  (Week 3 – Day 15 & 16)
 * Updated to use Groq API (free tier) instead of Anthropic Claude
 */

const Meeting = require('../models/Meeting');

// ─── Helper: call Groq API ────────────────────────────────────────────────────
async function callGroq(transcript) {
  if (!process.env.GROQ_API_KEY) {
    console.warn('⚠️  GROQ_API_KEY not set – using stub AI response');
    return {
      summary:
        '[AI STUB] This meeting covered the topics discussed in the transcript. ' +
        'The team reviewed progress, raised blockers, and agreed on next steps. ' +
        '(Provide GROQ_API_KEY to get a real summary.)',
      actionItems: [
        'Follow up on items discussed (stub – real items need GROQ_API_KEY)',
        'Schedule next check-in',
      ],
    };
  }

  const prompt = `You are an expert meeting assistant. Analyse the following meeting transcript and respond with valid JSON only.

JSON format:
{
  "summary": "<2–4 sentence summary of what was discussed and decided>",
  "actionItems": ["<action item 1 with owner if mentioned>", "<action item 2>", ...]
}

Rules:
- summary must be concise, professional, and factual.
- actionItems must be specific, actionable tasks. Include the owner's name if mentioned.
- If no clear action items exist, return an empty array.
- Return ONLY the JSON object – no markdown fences, no preamble.

TRANSCRIPT:
${transcript.substring(0, 12000)}`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error ${response.status}: ${err}`);
  }

  const data    = await response.json();
  const rawText = data.choices?.[0]?.message?.content ?? '{}';

  // Strip accidental markdown fences
  const cleaned = rawText.replace(/```json|```/g, '').trim();

  console.log('🤖 Groq raw response:', cleaned);

  try {
    return JSON.parse(cleaned);
  } catch {
    return { summary: rawText, actionItems: [] };
  }
}

// ─── Controller ──────────────────────────────────────────────────────────────
const endMeeting = async (req, res) => {
  try {
    const { id }         = req.params;
    const { transcript } = req.body;

    const meeting = await Meeting.findById(id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    const isHost = meeting.host.toString() === req.user._id.toString();
    const isParticipant = meeting.participants.some(
      p => p.user.toString() === req.user._id.toString()
    );
    if (!isHost && !isParticipant) {
      return res.status(403).json({ message: 'Not authorised to end this meeting' });
    }

    // Mark as ended immediately
    meeting.status  = 'ended';
    meeting.endTime = new Date();
    await meeting.save();

    // Respond quickly so client can navigate to summary page
    res.json({ message: 'Meeting ended. AI summary generating…', meeting });

    // ── Generate AI summary asynchronously ───────────────────────────────────
    console.log(`📝 Transcript length received: ${transcript?.length ?? 0} chars`);

    if (transcript && transcript.trim().length > 10) {
      try {
        const { summary, actionItems } = await callGroq(transcript);
        meeting.aiSummary   = summary;
        meeting.actionItems = Array.isArray(actionItems) ? actionItems : [];
        await meeting.save();
        console.log(`✅ AI summary saved for meeting ${id}`);
      } catch (aiErr) {
        console.error('AI summarisation failed:', aiErr.message);
        meeting.aiSummary   = 'AI summary could not be generated for this meeting.';
        meeting.actionItems = [];
        await meeting.save();
      }
    } else {
      console.warn('⚠️ Transcript too short or empty — skipping AI summary');
      meeting.aiSummary   = 'No transcript was provided – summary unavailable.';
      meeting.actionItems = [];
      await meeting.save();
    }

  } catch (err) {
    console.error('End Meeting Error:', err.message);
    if (!res.headersSent) res.status(500).json({ message: err.message });
  }
};

module.exports = { endMeeting };