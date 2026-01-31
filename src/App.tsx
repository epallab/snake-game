import { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/GameEngine';
import type { GameState } from './game/IGameEngine';
import { ClassicMode } from './game/modes/ClassicMode';
import { InfinityMode } from './game/modes/InfinityMode';
import { BoxMode } from './game/modes/BoxMode';
import { MazeMode } from './game/modes/MazeMode';
import { AudioManager } from './game/AudioManager';
import './index.css';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    isGameOver: false,
    isPlaying: false,
    isPaused: false,
    highScore: 0
  });

  const [hasStarted, setHasStarted] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'Classic' | 'Infinity' | 'Box' | 'Maze'>('Classic');
  const [showGuide, setShowGuide] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Init Engine
    const engine = new GameEngine(canvasRef.current);
    engine.onStateChange = (state) => {
      setGameState({ ...state });
    };
    engine.syncUI();
    engineRef.current = engine;

    return () => {
      engine.destroy();
    };
  }, []);

  const toggleMute = () => {
    AudioManager.getInstance().playClick();
    const muted = AudioManager.getInstance().toggleMute();
    setIsMuted(muted);
  };

  const handleStart = () => {
    AudioManager.getInstance().playClick();
    setHasStarted(true);
    if (engineRef.current) {
      // Set Mode
      switch (selectedMode) {
        case 'Classic': engineRef.current.setMode(new ClassicMode()); break;
        case 'Infinity': engineRef.current.setMode(new InfinityMode()); break;
        case 'Box': engineRef.current.setMode(new BoxMode()); break;
        case 'Maze': engineRef.current.setMode(new MazeMode()); break;
      }
      engineRef.current.start();
    }
  };

  const handleRestart = () => {
    AudioManager.getInstance().playClick();
    engineRef.current?.start();
  };

  return (
    <div className="game-container">
      {/* Game Header / Score Area */}
      {hasStarted && (
        <div className="game-header">
          <div className="hud-panel ui-element">
            {gameState.level !== undefined && (
              <div className="glass-panel hud-item level-badge">
                <span className="hud-label">LEVEL</span>
                <span className="hud-value">{gameState.level}</span>
              </div>
            )}
            <div className="glass-panel hud-item">
              <span className="hud-label">SCORE</span>
              <span className="hud-value">{gameState.score}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div className="text-white" style={{ opacity: 0.7, fontSize: '0.8rem', display: window.innerWidth > 600 ? 'block' : 'none' }}>
              {selectedMode.toUpperCase()}
            </div>
            {!gameState.isGameOver && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn-icon ui-element"
                  onClick={toggleMute}
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? '🔇' : '🔊'}
                </button>
                <button
                  className={`btn-icon ui-element ${gameState.isPaused ? 'play' : ''}`}
                  onClick={() => {
                    AudioManager.getInstance().playClick();
                    gameState.isPaused ? engineRef.current?.resume() : engineRef.current?.pause();
                  }}
                  title={gameState.isPaused ? "Resume" : "Pause"}
                >
                  {gameState.isPaused ? '▶' : '⏸'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Game Area */}
      <div style={{ flex: 1, position: 'relative' }}>
        <canvas ref={canvasRef} className="full-screen-canvas" />

        {/* UI Layer (Overlays) */}
        <div className="ui-layer">

          {/* Main Menu */}
          {!hasStarted && (
            <div className="overlay">
              <div className="glass-panel menu-card">
                <h1 className="title">
                  NEON PYTHON
                </h1>
                <p className="subtitle" style={{ margin: '0.5rem 0' }}>Select Game Mode</p>

                <div className="mode-selector" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1rem' }}>
                  {['Classic', 'Infinity', 'Box', 'Maze'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        AudioManager.getInstance().playClick();
                        setSelectedMode(mode as any);
                      }}
                      className="ui-element"
                      style={{
                        padding: '8px 15px',
                        borderRadius: '10px',
                        border: selectedMode === mode ? '2px solid #00ff9d' : '1px solid rgba(255,255,255,0.1)',
                        background: selectedMode === mode ? 'rgba(0, 255, 157, 0.2)' : 'rgba(0,0,0,0.2)',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        transition: 'all 0.2s',
                        flex: '1 0 40%'
                      }}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '15px', width: '100%', marginTop: '0.5rem', alignItems: 'center' }}>
                  <button
                    onClick={handleStart}
                    className="btn-primary"
                    style={{ flex: 1 }}
                  >
                    PLAY NOW
                  </button>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={toggleMute}
                      className="btn-icon guide-btn ui-element"
                      title={isMuted ? "Unmute" : "Mute"}
                      style={{ width: '45px', height: '45px', flexShrink: 0 }}
                    >
                      {isMuted ? '🔇' : '🔊'}
                    </button>
                    <button
                      onClick={() => {
                        AudioManager.getInstance().playClick();
                        setShowGuide(true);
                      }}
                      className="btn-icon guide-btn ui-element"
                      title="How to Play"
                      style={{
                        width: '45px',
                        height: '45px',
                        flexShrink: 0
                      }}
                    >
                      ?
                    </button>
                  </div>
                </div>

                {/* High Score Board - Leaner & Below Button */}
                <div style={{ width: '100%', marginTop: '1rem', paddingTop: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.65rem', color: '#00ff9d', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px', opacity: 0.8 }}>Best Scores</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {Object.entries(gameState.allHighScores || {}).map(([mode, score]) => (
                      <div key={mode} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                        <span style={{ color: '#888' }}>{mode}</span>
                        <span style={{ color: 'white' }}>{score}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '1rem', fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.5px', textAlign: 'center' }}>
                    Developed with ❤️ by <a
                      href="https://www.instagram.com/pocopie_ig?igsh=eGZtZmM3anl0cXZp&utm_source=qr"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#00ff9d', textDecoration: 'none', fontWeight: 'bold' }}
                    >
                      pocopie_ig
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Guide Overlay */}
          {showGuide && (
            <div className="overlay" style={{ pointerEvents: 'auto' }}>
              <div className="glass-panel menu-card guide-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2 className="title" style={{ fontSize: '1.5rem' }}>HOW TO PLAY</h2>
                  <button onClick={() => { AudioManager.getInstance().playClick(); setShowGuide(false); }} className="btn-icon" style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                </div>

                <div className="guide-content" style={{ textAlign: 'left', width: '100%', fontSize: '0.85rem', color: '#a7a9be' }}>
                  <section style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ color: '#00ff9d', fontSize: '0.9rem', marginBottom: '0.8rem', borderBottom: '1px solid rgba(0,255,157,0.2)', paddingBottom: '4px' }}>FOOD SYSTEM</h3>
                    <div style={{ display: 'grid', gap: '10px' }}>
                      <div className="guide-food-item"><span className="food-dot" style={{ background: '#00ff44', boxShadow: '0 0 10px #00ff44' }}></span> <div style={{ flex: 1 }}><b>Normal:</b> +5 pts. Standard growth.</div></div>
                      <div className="guide-food-item"><span className="food-dot" style={{ background: '#ffd700', boxShadow: '0 0 10px #ffd700' }}></span> <div style={{ flex: 1 }}><b>Golden:</b> +25 pts. High value! (Expires)</div></div>
                      <div className="guide-food-item"><span className="food-dot" style={{ background: '#ff00ff', boxShadow: '0 0 10px #ff00ff' }}></span> <div style={{ flex: 1 }}><b>Poison:</b> -10 pts. Dangerous! (Expires)</div></div>
                      <div className="guide-food-item"><span className="food-dot" style={{ background: '#ff0000', boxShadow: '0 0 10px #ff0000' }}></span> <div style={{ flex: 1 }}><b>Death:</b> Instant Game Over. Avoid! (Expires)</div></div>
                      <div className="guide-food-item"><span className="food-dot" style={{ background: '#00ffff', boxShadow: '0 0 10px #00ffff' }}></span> <div style={{ flex: 1 }}><b>Shrink:</b> +50 pts. Reduces length. (Expires)</div></div>
                    </div>
                  </section>

                  <section style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ color: '#00ff9d', fontSize: '0.9rem', marginBottom: '0.8rem', borderBottom: '1px solid rgba(0,255,157,0.2)', paddingBottom: '4px' }}>GAME MODES</h3>
                    <p><b>Classic:</b> Traditional rules. Walls are deadly.</p>
                    <p><b>Infinity:</b> No walls. Snake wraps across edges.</p>
                    <p><b>Box:</b> Dangerous. Walls shrink as time passes.</p>
                    <p><b>Maze:</b> Navigational challenge. Level up every 5 foods!</p>
                  </section>

                  <section>
                    <h3 style={{ color: '#00ff9d', fontSize: '0.9rem', marginBottom: '0.8rem', borderBottom: '1px solid rgba(0,255,157,0.2)', paddingBottom: '4px' }}>CONTROLS & VISUALS</h3>
                    <p>The snake follows your <b>pointer (mouse or touch)</b>.</p>
                    <p>• <b>Dynamic Speed:</b> Move the pointer further away to speed up!</p>
                    <p>• <b>Indicators:</b> The dashed line shows your direction; the circle marks your target.</p>
                  </section>
                </div>

                <button
                  onClick={() => {
                    AudioManager.getInstance().playClick();
                    setShowGuide(false);
                  }}
                  className="btn-primary"
                  style={{ marginTop: '1.5rem', width: '100%' }}
                >
                  GOT IT
                </button>
              </div>
            </div>
          )}


          {/* Pause Screen Overlay */}
          {hasStarted && gameState.isPaused && !gameState.isGameOver && (
            <div className="overlay">
              <div className="glass-panel menu-card">
                <h2 className="title" style={{ fontSize: '2rem' }}>PAUSED</h2>
                <button
                  onClick={() => {
                    AudioManager.getInstance().playClick();
                    engineRef.current?.resume();
                  }}
                  className="btn-primary"
                >
                  RESUME
                </button>
                <button
                  onClick={() => {
                    AudioManager.getInstance().playClick();
                    engineRef.current?.stop();
                    setHasStarted(false);
                  }}
                  className="btn-icon ui-element"
                  title="Home"
                  style={{ marginTop: '1rem', background: 'rgba(255, 255, 255, 0.05)' }}
                >
                  🏠
                </button>
              </div>
            </div>
          )}

          {/* Game Over */}
          {hasStarted && gameState.isGameOver && (
            <div className="overlay">
              <div className="glass-panel menu-card">
                <h2 className="game-over-title">GAME OVER</h2>
                <div className="subtitle" style={{ fontSize: '1.2rem', color: 'white' }}>
                  Score: {gameState.score}
                </div>
                <div className="subtitle" style={{ fontSize: '0.9rem', color: '#aaa' }}>
                  Mode: {selectedMode}
                </div>
                <button
                  onClick={handleRestart}
                  className="btn-primary"
                  style={{ marginTop: '0.5rem' }}
                >
                  TRY AGAIN
                </button>

                <div style={{ display: 'flex', gap: '15px', marginTop: '1rem' }}>
                  <button
                    onClick={() => setHasStarted(false)}
                    className="btn-icon ui-element"
                    title="Home"
                    style={{ background: 'rgba(255, 255, 255, 0.05)' }}
                  >
                    🏠
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
