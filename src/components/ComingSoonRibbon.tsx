'use client'

interface ComingSoonRibbonProps {
  text?: string
}

export default function ComingSoonRibbon({ text = 'Coming Soon' }: ComingSoonRibbonProps) {
  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: 0,
      right: 0,
      transform: 'translateY(-50%)',
      zIndex: 1000,
      pointerEvents: 'none',
    }}>
      {/* blur shadow behind */}
      <div style={{
        position: 'absolute', top: 8, left: 0, right: 0, height: '100%',
        background: 'rgba(0,120,180,0.25)', filter: 'blur(10px)',
        transform: 'scaleY(0.85) translateY(4px)',
      }} />
      {/* main ribbon */}
      <div style={{
        background: 'linear-gradient(180deg, #6DD5FA 0%, #2980B9 45%, #1A6696 55%, #3AAFDF 100%)',
        padding: '18px 0',
        textAlign: 'center',
        position: 'relative',
        boxShadow: '0 6px 0 #0d4f75, 0 8px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.45)',
        borderTop: '1px solid rgba(255,255,255,0.3)',
        borderBottom: '1px solid rgba(0,60,100,0.4)',
      }}>
        {/* left fold */}
        <div style={{
          position: 'absolute', left: 0, top: 0, width: 20, height: '100%',
          background: 'linear-gradient(90deg, #1A5276, #2980B9)',
          boxShadow: 'inset -3px 0 6px rgba(0,0,0,0.2)',
        }} />
        {/* right fold */}
        <div style={{
          position: 'absolute', right: 0, top: 0, width: 20, height: '100%',
          background: 'linear-gradient(270deg, #1A5276, #2980B9)',
          boxShadow: 'inset 3px 0 6px rgba(0,0,0,0.2)',
        }} />
        <span style={{
          fontFamily: "'EB Garamond', Georgia, serif",
          fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
          fontWeight: 700,
          color: '#ffffff',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          textShadow: '0 1px 0 rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.25)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '1rem',
        }}>
          ✦ &nbsp; {text} &nbsp; ✦
        </span>
      </div>
      {/* bottom thickness for 3D depth */}
      <div style={{
        height: 6,
        background: 'linear-gradient(90deg, #0d3d5c, #0d4f75 50%, #0d3d5c)',
      }} />
    </div>
  )
}
