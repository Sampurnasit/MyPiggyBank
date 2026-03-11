'use client'

import { useMemo } from 'react'

interface PiggyBankProps {
  balance: number
  maxBalance?: number
}

export default function PiggyBank({ balance, maxBalance = 50000 }: PiggyBankProps) {
  const fillPercentage = useMemo(() => {
    return Math.min((balance / maxBalance) * 100, 100)
  }, [balance, maxBalance])

  return (
    <div className="flex justify-center items-center py-8">
      <svg
        viewBox="0 0 200 160"
        width="200"
        height="160"
        className="filter drop-shadow-lg"
      >
        {/* Piggy bank body */}
        <ellipse cx="100" cy="90" rx="70" ry="60" fill="#fef3c7" stroke="#d97706" strokeWidth="2" />

        {/* Piggy bank snout */}
        <ellipse cx="45" cy="95" rx="20" ry="18" fill="#fef3c7" stroke="#d97706" strokeWidth="2" />
        <circle cx="35" cy="93" r="4" fill="#d97706" />

        {/* Piggy bank ears */}
        <ellipse cx="75" cy="35" rx="15" ry="25" fill="#fef3c7" stroke="#d97706" strokeWidth="2" />
        <ellipse cx="125" cy="35" rx="15" ry="25" fill="#fef3c7" stroke="#d97706" strokeWidth="2" />
        <ellipse cx="75" cy="38" rx="6" ry="10" fill="#f5a623" />
        <ellipse cx="125" cy="38" rx="6" ry="10" fill="#f5a623" />

        {/* Piggy bank eye */}
        <circle cx="85" cy="75" r="5" fill="#1f2937" />

        {/* Piggy bank legs */}
        <rect x="75" y="135" width="8" height="20" fill="#fef3c7" stroke="#d97706" strokeWidth="1" />
        <rect x="95" y="135" width="8" height="20" fill="#fef3c7" stroke="#d97706" strokeWidth="1" />
        <rect x="115" y="135" width="8" height="20" fill="#fef3c7" stroke="#d97706" strokeWidth="1" />

        {/* Coin slot */}
        <rect x="95" y="25" width="10" height="2" fill="#d97706" />

        {/* Savings fill (animated based on balance) */}
        <defs>
          <clipPath id="piggyClip">
            <ellipse cx="100" cy="90" rx="65" ry="54" />
          </clipPath>
        </defs>

        {/* Fill indicator */}
        <ellipse
          cx="100"
          cy="140"
          rx="65"
          ry="54"
          fill="#10b981"
          opacity="0.3"
          clipPath="url(#piggyClip)"
          style={{
            clipPath: `polygon(0% ${100 - fillPercentage}%, 100% ${100 - fillPercentage}%, 100% 100%, 0% 100%)`,
          }}
        />

        {/* Coins inside */}
        {fillPercentage > 20 && (
          <>
            <circle cx="85" cy="110" r="4" fill="#eab308" opacity="0.8" />
            <circle cx="115" cy="115" r="4" fill="#eab308" opacity="0.8" />
            <circle cx="100" cy="120" r="4" fill="#eab308" opacity="0.8" />
          </>
        )}
      </svg>

      <style jsx>{`
        @keyframes fillAnimation {
          from {
            clip-path: polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%);
          }
          to {
            clip-path: polygon(0% ${100 - fillPercentage}%, 100% ${100 - fillPercentage}%, 100% 100%, 0% 100%);
          }
        }
      `}</style>
    </div>
  )
}
