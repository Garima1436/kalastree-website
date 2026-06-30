'use client'

interface ComingSoonRibbonProps {
  text?: string
}

export default function ComingSoonRibbon({ text = 'Coming Soon' }: ComingSoonRibbonProps) {
  return (
    <div style={{
      position: 'fixed',
      top: 'calc(50% + 192px)',
      left: 0,
      right: 0,
      transform: 'translateY(-50%)',
      zIndex: 1000,
      pointerEvents: 'none',
    }}>
      {/* drop shadow */}
      <div style={{
        position: 'absolute',
        top: 10, left: '2%', right: '2%', height: '100%',
        background: 'rgba(0,60,120,0.3)',
        filter: 'blur(14px)',
        borderRadius: 4,
      }} />

      <div style={{ position: 'relative' }}>
        {/* left folded tail */}
        <div style={{
          position: 'absolute',
          left: 0, top: 0, bottom: 0,
          width: 36,
          background: 'linear-gradient(135deg, #0a3a5c 0%, #0d4f75 60%, #0a3a5c 100%)',
          clipPath: 'polygon(0 0, 100% 15%, 100% 85%, 0 100%)',
          zIndex: 0,
        }} />
        {/* right folded tail */}
        <div style={{
          position: 'absolute',
          right: 0, top: 0, bottom: 0,
          width: 36,
          background: 'linear-gradient(225deg, #0a3a5c 0%, #0d4f75 60%, #0a3a5c 100%)',
          clipPath: 'polygon(100% 0, 0 15%, 0 85%, 100% 100%)',
          zIndex: 0,
        }} />

        {/* main ribbon band */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          clipPath: 'polygon(28px 0%, calc(100% - 28px) 0%, 100% 50%, calc(100% - 28px) 100%, 28px 100%, 0% 50%)',
          background: 'linear-gradient(180deg, #a8e6ff 0%, #54b8e8 12%, #2489c5 35%, #1a6ea8 50%, #1e7ab8 65%, #3aaad8 88%, #7fd4f5 100%)',
          padding: '20px 60px',
          textAlign: 'center',
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.5), inset 0 -3px 6px rgba(0,0,0,0.3)',
        }}>
          {/* top sheen */}
          <div style={{
            position: 'absolute',
            top: 0, left: '10%', right: '10%',
            height: '40%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 100%)',
            borderRadius: '0 0 50% 50%',
            pointerEvents: 'none',
          }} />

          <span style={{
            fontFamily: "'EB Garamond', Georgia, serif",
            fontSize: 'clamp(1.15rem, 2.8vw, 1.7rem)',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            textShadow: '0 1px 0 rgba(0,0,0,0.5), 0 0 20px rgba(0,80,160,0.6), 0 2px 10px rgba(0,0,0,0.3)',
            position: 'relative',
            zIndex: 2,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '1.2rem',
          }}>
            ✦ &nbsp; {text} &nbsp; ✦
          </span>
        </div>

        {/* bottom edge thickness */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          clipPath: 'polygon(28px 0%, calc(100% - 28px) 0%, 100% 50%, calc(100% - 28px) 100%, 28px 100%, 0% 50%)',
          height: 8,
          background: 'linear-gradient(90deg, #071e30, #0d3d5c 20%, #0d4f75 50%, #0d3d5c 80%, #071e30)',
          marginTop: -1,
        }} />
      </div>
    </div>
  )
}
