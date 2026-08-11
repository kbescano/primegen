import React from 'react'

export default function PayloadLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {/* You can use a standard <img> tag here, Next/Image doesn't work out-of-the-box inside the Payload config without extra setup */}
      <img 
        src="/branding/primegen_trading_logo.png" 
        alt="Primegen Logo" 
        style={{ width: '40px', height: '40px', borderRadius: '8px' }} 
      />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '22px', fontWeight: '900', color: '#01172f', letterSpacing: '-0.5px' }}>
          Primegen 
        </span>
        <span style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', color: '#149911', letterSpacing: '2px' }}>
          Admin Security Database
        </span>
      </div>
    </div>
  )
}