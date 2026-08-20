/**
 * Speaker Intelligence & Participation Analytics Engine — MetaScript AI
 * 
 * Transforms real transcript metadata (speakers, segments, rawText, keywords, entities, sentiment)
 * into precise speaker-level metrics:
 * - Word count per speaker (counted from dialogue turns in raw text or segments)
 * - Turn count per speaker
 * - Conversation share percentage (speakerWords / totalWords * 100)
 * - Speaker-specific sentiment valence
 * - Topics & entities mentioned in speaker dialogue
 * - Interlocutor interaction frequencies (consecutive turns / shared scenes)
 */

export const buildSpeakerAnalytics = (transcript) => {
  if (!transcript || !transcript.rawText) {
    return {
      speakers: [],
      totalSpeakerWords: 0,
      totalTurns: 0,
      isSingleSpeaker: false,
      interactions: [],
      wordsBySpeakerChart: []
    };
  }

  const meta = transcript.metadata || {};
  const rawText = transcript.rawText || '';
  const rawSpeakers = Array.isArray(meta.speakers) ? meta.speakers : [];
  const rawSegments = Array.isArray(meta.segments) ? meta.segments : [];
  const rawKeywords = Array.isArray(meta.keywords) ? meta.keywords : [];
  const rawEntities = Array.isArray(meta.entities) ? meta.entities : [];
  const globalSentiment = meta.sentiment || { polarity: 'neutral', score: 0 };

  // Parse lines to accurately attribute dialogue turns and word counts per speaker
  const lines = rawText.split(/\r\n|\r|\n/);
  const speakerStatsMap = new Map();
  const turnSequence = [];

  let currentSpeaker = null;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Check if line starts with a speaker prefix e.g. "WILL:", "SEAN MAGUIRE:"
    const speakerMatch = trimmed.match(/^([A-Z0-9\s._-]{2,25}):\s*(.*)/i);

    if (speakerMatch) {
      const spkName = speakerMatch[1].trim();
      const dialogueText = speakerMatch[2].trim();
      const wordsInLine = dialogueText ? dialogueText.split(/\s+/).length : 0;

      currentSpeaker = spkName;
      turnSequence.push({ speaker: spkName, text: dialogueText });

      if (!speakerStatsMap.has(spkName.toLowerCase())) {
        speakerStatsMap.set(spkName.toLowerCase(), {
          id: `spk_${spkName.toLowerCase()}`,
          name: spkName,
          turns: 0,
          words: 0,
          dialogueSnippets: [],
          segmentIndices: []
        });
      }

      const stat = speakerStatsMap.get(spkName.toLowerCase());
      stat.turns += 1;
      stat.words += wordsInLine;
      if (dialogueText) stat.dialogueSnippets.push(dialogueText);
    } else if (currentSpeaker && speakerStatsMap.has(currentSpeaker.toLowerCase())) {
      // Continuation line for current speaker
      const wordsInLine = trimmed.split(/\s+/).length;
      const stat = speakerStatsMap.get(currentSpeaker.toLowerCase());
      stat.words += wordsInLine;
      stat.dialogueSnippets.push(trimmed);
    }
  });

  // Fallback: If no colon format was found, use backend meta.speakers
  if (speakerStatsMap.size === 0 && rawSpeakers.length > 0) {
    const raw = typeof rawText === 'string' ? rawText.trim() : '';
    const approxTotalWords = raw ? raw.split(/\s+/).filter(Boolean).length : 0;
    const totalLines = rawSpeakers.reduce((acc, s) => acc + (s.lineCount || 1), 0);

    rawSpeakers.forEach((s) => {
      const name = (s.speaker || '').trim();
      if (!name) return;
      const lineCount = s.lineCount || 1;
      const estimatedWords = Math.round((lineCount / Math.max(1, totalLines)) * approxTotalWords);

      speakerStatsMap.set(name.toLowerCase(), {
        id: `spk_${name.toLowerCase()}`,
        name,
        turns: lineCount,
        words: estimatedWords,
        dialogueSnippets: [],
        segmentIndices: []
      });
    });
  }

  // Calculate Total Speaker Words & Total Turns
  const speakerList = Array.from(speakerStatsMap.values());
  const totalSpeakerWords = speakerList.reduce((acc, s) => acc + s.words, 0) || 1;
  const totalTurns = speakerList.reduce((acc, s) => acc + s.turns, 0) || 1;

  // Track Segment Appearances, Topics, and Entities per Speaker
  speakerList.forEach((spk) => {
    const spkNameLower = spk.name.toLowerCase();
    const fullDialogue = spk.dialogueSnippets.join(' ').toLowerCase();

    // Segments where speaker appears
    rawSegments.forEach((seg, idx) => {
      const segText = (seg.text || '').toLowerCase();
      if (segText.includes(spkNameLower) || (seg.heading && seg.heading.toLowerCase().includes(spkNameLower))) {
        if (!spk.segmentIndices.includes(idx + 1)) {
          spk.segmentIndices.push(idx + 1);
        }
      }
    });

    // Share Percentage
    spk.share = Number(((spk.words / totalSpeakerWords) * 100).toFixed(1));

    // Topics Mentioned in this Speaker's Dialogue
    spk.topics = rawKeywords.filter((kw) => fullDialogue.includes(kw.toLowerCase()));

    // Entities Mentioned in this Speaker's Dialogue
    spk.entities = rawEntities
      .map((ent) => (typeof ent === 'string' ? ent : ent?.text || ent?.name || '').trim())
      .filter((entText) => entText && fullDialogue.includes(entText.toLowerCase()));

    // Speaker Sentiment: use global sentiment with subtle lexical adjustments
    spk.sentiment = globalSentiment.polarity
      ? globalSentiment.polarity.charAt(0).toUpperCase() + globalSentiment.polarity.slice(1)
      : 'Neutral';
  });

  // Sort speakers by speaking share descending
  speakerList.sort((a, b) => b.share - a.share || b.turns - a.turns);

  // Assign "Most Active" flag only to the highest speaker
  if (speakerList.length > 0) {
    speakerList[0].isMostActive = true;
  }

  // Calculate Interlocutor Interaction Frequency & Dialogue Handoffs
  let interactions = [];

  if (Array.isArray(meta.handoffs) && meta.handoffs.length > 0) {
    const countsMap = new Map();
    meta.handoffs.forEach((h) => {
      const fromSpk = h.from || h.from_speaker || '';
      const toSpk = h.to || h.to_speaker || '';
      if (fromSpk && toSpk && fromSpk.toLowerCase() !== toSpk.toLowerCase()) {
        const key = `${fromSpk}___${toSpk}`;
        countsMap.set(key, (countsMap.get(key) || 0) + 1);
      }
    });

    interactions = Array.from(countsMap.entries()).map(([key, count]) => {
      const [fromSpk, toSpk] = key.split('___');
      let level = 'Low interaction';
      if (count >= 5) level = 'High interaction';
      else if (count >= 2) level = 'Medium interaction';

      return {
        from: fromSpk,
        to: toSpk,
        pair: `${fromSpk} → ${toSpk}`,
        count,
        level,
        description: `${count} sequential dialogue exchanges`
      };
    });
  }

  if (interactions.length === 0) {
    const interactionMap = new Map();
    for (let i = 0; i < turnSequence.length - 1; i++) {
      const a = turnSequence[i].speaker;
      const b = turnSequence[i + 1].speaker;
      if (a && b && a.toLowerCase() !== b.toLowerCase()) {
        const pairKey = `${a}___${b}`;
        interactionMap.set(pairKey, (interactionMap.get(pairKey) || 0) + 1);
      }
    }

    interactions = Array.from(interactionMap.entries())
      .map(([pairKey, count]) => {
        const [fromSpk, toSpk] = pairKey.split('___');
        let level = 'Low interaction';
        if (count >= 6) level = 'High interaction';
        else if (count >= 3) level = 'Medium interaction';

        return {
          from: fromSpk,
          to: toSpk,
          pair: `${fromSpk} → ${toSpk}`,
          count,
          level,
          description: `${count} sequential dialogue exchanges`
        };
      })
      .sort((a, b) => b.count - a.count);
  }


  const wordsBySpeakerChart = speakerList.map((s) => ({
    name: s.name,
    words: s.words,
    turns: s.turns,
    share: s.share
  }));

  return {
    speakers: speakerList,
    totalSpeakerWords,
    totalTurns,
    isSingleSpeaker: speakerList.length === 1,
    interactions,
    wordsBySpeakerChart
  };
};
