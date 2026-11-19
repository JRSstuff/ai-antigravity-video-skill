import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

interface ScriptLine {
  text: string;
  caps: string;
  emotion?: string;
  remocn_component?: string;
}

interface ScriptData {
  title: string;
  lines: ScriptLine[];
}

export const MainComposition: React.FC<{ script: ScriptData }> = ({ script }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Background subtle gradient pulse
  const bgScale = interpolate(Math.sin(frame / 20), [-1, 1], [1.0, 1.05]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0F172A',
        color: '#FFFFFF',
        fontFamily: 'Inter, system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Ambient Mesh Background */}
      <div
        style={{
          position: 'absolute',
          width: '120%',
          height: '120%',
          background: 'radial-gradient(circle at 50% 40%, rgba(56, 189, 248, 0.15) 0%, rgba(15, 23, 42, 1) 70%)',
          transform: `scale(${bgScale})`,
        }}
      />

      {/* Main Kinetic Typography Card */}
      <div
        style={{
          zIndex: 10,
          textAlign: 'center',
          maxWidth: 900,
          padding: '40px',
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            letterSpacing: '-0.02em',
            marginBottom: 24,
            background: 'linear-gradient(135deg, #FFFFFF 0%, #38BDF8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {script.title || 'REMOCN MOTION'}
        </div>

        <div
          style={{
            display: 'inline-block',
            backgroundColor: '#1E293B',
            border: '2px solid #38BDF8',
            borderRadius: 20,
            padding: '16px 36px',
            fontSize: 32,
            fontWeight: 700,
            color: '#F8FAFC',
          }}
        >
          SHADCN FOR REMOTION
        </div>
      </div>
    </AbsoluteFill>
  );
};
