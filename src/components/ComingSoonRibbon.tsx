'use client'

interface ComingSoonRibbonProps {
  text?: string
}

export default function ComingSoonRibbon({ text = 'Coming Soon' }: ComingSoonRibbonProps) {
  return (
    <>
      <style>{`
        @keyframes ribbonFloat {
          0%   { transform: translateY(-50%) rotate(-0.4deg); }
          20%  { transform: translateY(calc(-50% + 5px)) rotate(0.3deg); }
          40%  { transform: translateY(calc(-50% - 4px)) rotate(-0.2deg); }
          60%  { transform: translateY(calc(-50% + 6px)) rotate(0.4deg); }
          80%  { transform: translateY(calc(-50% - 3px)) rotate(-0.3deg); }
          100% { transform: translateY(-50%) rotate(-0.4deg); }
        }
        @keyframes ribbonWave {
          0%   { transform: scaleY(1) skewX(0deg); }
          15%  { transform: scaleY(0.96) skewX(0.9deg); }
          30%  { transform: scaleY(1.03) skewX(-0.6deg); }
          50%  { transform: scaleY(0.97) skewX(1.1deg); }
          70%  { transform: scaleY(1.02) skewX(-0.4deg); }
          85%  { transform: scaleY(0.98) skewX(0.7deg); }
          100% { transform: scaleY(1) skewX(0deg); }
        }
        @keyframes sheenSweep {
          0%   { left: -60%; opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { left: 130%; opacity: 0; }
        }
        @keyframes tailFlutter {
          0%   { transform: scaleY(1) skewY(0deg); }
          30%  { transform: scaleY(0.94) skewY(1.5deg); }
          60%  { transform: scaleY(1.04) skewY(-1deg); }
          100% { transform: scaleY(1) skewY(0deg); }
        }
      `}</style>

      <div style={{
        position: 'fixed',
        top: 'calc(50% + 192px)',
        left: 0,
        right: 0,
        transform: 'translateY(-50%)',
        zIndex: 1000,
        pointerEvents: 'none',
        animation: 'ribbonFloat 4s ease-in-out infinite',
      }}>
        {/* drop shadow */}
        <div style={{
          position: 'absolute',
          top: 12, left: '3%', right: '3%', height: '100%',
          background: 'rgba(0,60,120,0.28)',
          filter: 'blur(16px)',
          borderRadius: 4,
          animation: 'ribbonFloat 4s ease-in-out infinite reverse',
        }} />

        <div style={{ position: 'relative', animation: 'ribbonWave 3.5s ease-in-out infinite' }}>
          {/* left folded tail */}
          <div style={{
            position: 'absolute',
            left: 0, top: 0, bottom: 0,
            width: 36,
            background: 'linear-gradient(135deg, #071e30 0%, #0d4f75 60%, #071e30 100%)',
            clipPath: 'polygon(0 0, 100% 15%, 100% 85%, 0 100%)',
            zIndex: 0,
            animation: 'tailFlutter 3.5s ease-in-out infinite',
          }} />
          {/* right folded tail */}
          <div style={{
            position: 'absolute',
            right: 0, top: 0, bottom: 0,
            width: 36,
            background: 'linear-gradient(225deg, #071e30 0%, #0d4f75 60%, #071e30 100%)',
            clipPath: 'polygon(100% 0, 0 15%, 0 85%, 100% 100%)',
            zIndex: 0,
            animation: 'tailFlutter 3.5s ease-in-out infinite reverse',
          }} />

          {/* main ribbon band */}
          <div style={{
            position: 'relative',
            zIndex: 1,
            overflow: 'hidden',
            clipPath: 'polygon(28px 0%, calc(100% - 28px) 0%, 100% 50%, calc(100% - 28px) 100%, 28px 100%, 0% 50%)',
            background: 'linear-gradient(180deg, #b8eaff 0%, #54b8e8 10%, #2489c5 32%, #1a6ea8 50%, #1e7ab8 68%, #3aaad8 90%, #90deff 100%)',
            padding: '20px 60px',
            textAlign: 'center',
            boxShadow: 'inset 0 2px 5px rgba(255,255,255,0.55), inset 0 -4px 8px rgba(0,0,0,0.35)',
          }}>
            {/* moving sheen */}
            <div style={{
              position: 'absolute',
              top: 0, bottom: 0,
              width: '35%',
              background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.45) 50%, transparent 80%)',
              animation: 'sheenSweep 3.5s ease-in-out infinite',
              pointerEvents: 'none',
            }} />
            {/* top highlight arc */}
            <div style={{
              position: 'absolute',
              top: 0, left: '8%', right: '8%',
              height: '45%',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0) 100%)',
              borderRadius: '0 0 50% 50%',
            }} />

            <span style={{
              fontFamily: "'EB Garamond', Georgia, serif",
              fontSize: 'clamp(1.15rem, 2.8vw, 1.7rem)',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              textShadow: '0 1px 0 rgba(0,0,0,0.5), 0 0 20px rgba(0,100,200,0.5), 0 2px 10px rgba(0,0,0,0.35)',
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
    </>
  )
}
