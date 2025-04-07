'use client';

import { useEffect, useMemo, useState, useRef } from 'react';

import { CENTER, SIZE, WHEEL_COLORS } from '@/app/components/Wheel/constants';
import { SpinningState } from '@/app/constants';

interface WheelProps {
  participants: string[];
  currentIndex: number;
  spinningState: SpinningState;
  targetIndex: number;
}

const Wheel = ({
  participants,
  currentIndex,
  spinningState,
  targetIndex,
}: WheelProps) => {
  const [rotationAngle, setRotationAngle] = useState(0);
  const lastSpinningAngle = useRef(0);

  const sliceAngle = useMemo(
    () => (participants.length === 1 ? 360 : 360 / participants.length),
    [participants.length],
  );

  useEffect(() => {
    if (spinningState === SpinningState.SPINNING) {
      const angle = currentIndex * sliceAngle;
      setRotationAngle(angle);
      lastSpinningAngle.current = angle;
    } else if (spinningState === SpinningState.SLOWING) {
      const currentAngle = lastSpinningAngle.current;

      const winnerIndex = targetIndex % participants.length;
      const finalPointerAngle = winnerIndex * sliceAngle + sliceAngle / 2;

      const k = Math.floor((currentAngle + finalPointerAngle) / 360) + 1;
      const finalAngle = -finalPointerAngle + 360 * k;

      setRotationAngle(finalAngle);
    }
  }, [
    participants.length,
    currentIndex,
    spinningState,
    targetIndex,
    sliceAngle,
  ]);

  if (participants.length === 0) return null;

  return (
    <div
      className="relative mx-auto my-4"
      style={{ width: SIZE, height: SIZE }}
    >
      <div
        className="absolute w-full h-full rounded-full overflow-hidden"
        style={{
          transform: `rotate(${rotationAngle}deg)`,
          transition:
            spinningState === SpinningState.SPINNING
              ? 'transform 0.1s linear'
              : spinningState === SpinningState.SLOWING
              ? 'transform 3s cubic-bezier(0.25, 0.1, 0.25, 1.0)'
              : 'none',
          borderWidth: '4px',
          borderColor: '#333',
          borderStyle: 'solid',
          boxShadow: '0 0 15px rgba(0,0,0,0.2)',
          backgroundColor:
            participants.length === 1 ? WHEEL_COLORS[0] : 'transparent',
        }}
      >
        <svg width={SIZE} height={SIZE} className="absolute inset-0">
          <defs>
            {participants.map((_, index) => {
              const colorIndex = index % WHEEL_COLORS.length;
              return (
                <linearGradient
                  key={`grad-${index}`}
                  id={`gradient-${index}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    stopColor={WHEEL_COLORS[colorIndex]}
                    stopOpacity="1"
                  />
                  <stop
                    offset="100%"
                    stopColor={WHEEL_COLORS[colorIndex]}
                    stopOpacity="0.7"
                  />
                </linearGradient>
              );
            })}
          </defs>

          {participants.length === 1 ? (
            <circle
              cx={CENTER}
              cy={CENTER}
              r={CENTER}
              fill={`url(#gradient-0)`}
              stroke="#fff"
              strokeWidth="1"
            />
          ) : (
            participants.map((_, index) => {
              const startAngle = index * sliceAngle;
              const endAngle = (index + 1) * sliceAngle;

              const startRadTrig = ((90 - startAngle) * Math.PI) / 180;
              const endRadTrig = ((90 - endAngle) * Math.PI) / 180;

              const x1 = CENTER + Math.cos(startRadTrig) * CENTER;
              const y1 = CENTER - Math.sin(startRadTrig) * CENTER;
              const x2 = CENTER + Math.cos(endRadTrig) * CENTER;
              const y2 = CENTER - Math.sin(endRadTrig) * CENTER;

              const largeArcFlag = sliceAngle > 180 ? 1 : 0;

              const d = [
                `M ${CENTER} ${CENTER}`,
                `L ${x1} ${y1}`,
                `A ${CENTER} ${CENTER} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z',
              ].join(' ');

              return (
                <path
                  key={`slice-${index}`}
                  d={d}
                  fill={`url(#gradient-${index})`}
                  stroke="#fff"
                  strokeWidth="1"
                />
              );
            })
          )}
        </svg>

        {participants.map((participant, index) => {
          if (participants.length === 1) {
            return (
              <div
                key={`text-${index}`}
                className="absolute text-white font-semibold z-10 drop-shadow-md text-center"
                style={{
                  left: `50%`,
                  top: `50%`,
                  transform: `translate(-50%, -50%)`,
                  textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
                  fontSize: '1.2rem',
                }}
              >
                {participant}
              </div>
            );
          }

          const startAngle = index * sliceAngle;
          const midAngle = startAngle + sliceAngle / 2;
          const textRadius = CENTER * 0.65;

          const midAngleRadCss = (midAngle * Math.PI) / 180;
          const textX = CENTER + Math.sin(midAngleRadCss) * textRadius;
          const textY = CENTER - Math.cos(midAngleRadCss) * textRadius;

          return (
            <div
              key={`text-${index}`}
              className="absolute text-white font-semibold z-10 drop-shadow-md text-center whitespace-nowrap"
              style={{
                left: `${textX}px`,
                top: `${textY}px`,
                transform: `translate(-50%, -50%) rotate(${midAngle + 90}deg)`,
                overflow: 'hidden',
                textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
                fontSize: '0.85rem',
                padding: '2px',
              }}
            >
              {participant}
            </div>
          );
        })}
      </div>

      <div
        className="absolute"
        style={{
          top: '-10px',
          left: `${CENTER}px`,
          transform: 'translateX(-50%)',
          zIndex: 10,
        }}
      >
        <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[30px] border-l-transparent border-r-transparent border-t-red-600 mx-auto drop-shadow-lg" />
      </div>
    </div>
  );
};

export default Wheel;
