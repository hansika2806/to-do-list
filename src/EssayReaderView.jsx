import React, { useState, useRef } from 'react';
import { Play, Square } from 'lucide-react';

export function EssayReaderView() {
  const [text, setText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const isPlayingRef = useRef(false);

  function chunkText(text, maxLength = 180) {
    const chunks = [];
    const words = text.split(/\s+/);
    let currentChunk = "";

    for (const word of words) {
      if ((currentChunk + " " + word).length > maxLength) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = word;
      } else {
        currentChunk += (currentChunk ? " " : "") + word;
      }
    }
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    return chunks;
  }

  const handlePlay = () => {
    if (!text.trim()) return;
    const chunks = chunkText(text);
    if (chunks.length === 0) return;

    setIsPlaying(true);
    isPlayingRef.current = true;
    let currentIndex = 0;

    const playNext = () => {
      if (!isPlayingRef.current) return;
      if (currentIndex >= chunks.length) {
        setIsPlaying(false);
        isPlayingRef.current = false;
        return;
      }

      const chunk = chunks[currentIndex];
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=hi&q=${encodeURIComponent(chunk)}`;
      
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.addEventListener('ended', () => {
        currentIndex++;
        playNext();
      });

      audio.addEventListener('error', () => {
        console.error("Audio playback error, skipping chunk.");
        currentIndex++;
        playNext();
      });

      audio.play().catch(e => {
        console.error("Audio playback blocked or failed:", e);
        setIsPlaying(false);
        isPlayingRef.current = false;
      });
    };

    playNext();
  };

  const handleStop = () => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  return (
    <section className="view-grid">
      <div className="panel span-2">
        <h2>Essay Reader (Google Translate Voice)</h2>
        <p className="muted" style={{marginBottom: '1rem'}}>
          Paste your long essay below. It will automatically bypass the character limit and read the entire text seamlessly.
        </p>
        
        <textarea
          style={{ width: '100%', minHeight: '300px', padding: '1rem', marginBottom: '1rem', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '8px', fontSize: '1rem', fontFamily: 'inherit' }}
          placeholder="हिंदी में अपना लेख यहाँ लिखें... (Write your essay here...)"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          {!isPlaying ? (
            <button className="primary-button" onClick={handlePlay} style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <Play size={18} /> Play Essay
            </button>
          ) : (
            <button className="primary-button" onClick={handleStop} style={{display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ef4444', borderColor: '#ef4444'}}>
              <Square size={18} /> Stop Reading
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
