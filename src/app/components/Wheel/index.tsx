'use client';

import { useEffect } from 'react';

interface WheelProps {
  participants: string[];
  currentIndex: number;
  isSpinning: boolean;
  winner: string | null;
  onSelectWinner: (winner: string) => void;
  spinningState: 'idle' | 'spinning' | 'slowing';
}

const Wheel = ({
  participants,
  currentIndex,
  isSpinning,
  winner,
  onSelectWinner,
  spinningState,
}: WheelProps) => {
  // 회전이 멈췄을 때 가장 위에 있는 조각의 당첨자 결정
  useEffect(() => {
    if (participants.length === 0 || !winner) return;

    if (!isSpinning && spinningState === 'idle') {
      // 현재 회전 각도에서 가장 위에 있는 조각 (0도 위치)의 인덱스 계산
      const sliceAngle = 360 / participants.length;
      const rotationAngle = -participants.indexOf(winner) * sliceAngle;
      const normalizedAngle = ((-rotationAngle % 360) + 360) % 360; // 항상 양수 각도 계산
      const winnerIndex = Math.floor(normalizedAngle / sliceAngle);
      const actualWinner = participants[winnerIndex % participants.length];

      if (actualWinner !== winner) {
        onSelectWinner(actualWinner);
      }
    }
  }, [isSpinning, spinningState, participants, winner, onSelectWinner]);

  if (participants.length === 0) return null;

  const colors = [
    '#FF5252', // 빨강
    '#4285F4', // 파랑
    '#0F9D58', // 초록
    '#F4B400', // 노랑
    '#DB4437', // 다크 레드
    '#673AB7', // 보라
    '#FF6D00', // 주황
    '#00BCD4', // 청록
    '#9C27B0', // 진한 보라
    '#3F51B5', // 남색
    '#8BC34A', // 라임
    '#FFEB3B', // 밝은 노랑
  ];

  const size = 300;
  const center = size / 2;
  // 항목이 하나일 때는 360도로 설정
  const sliceAngle =
    participants.length === 1 ? 360 : 360 / participants.length;

  // 회전 각도 계산 (음수로 변경하여 시계 방향으로 회전)
  const rotationAngle = isSpinning
    ? currentIndex * 36 // 회전 중일 때는 36도씩 회전 (더 부드럽게)
    : winner
    ? participants.indexOf(winner) * sliceAngle
    : 0;

  return (
    <div
      className="relative mx-auto my-4"
      style={{ width: size, height: size }}
    >
      {/* 회전하는 원판 */}
      <div
        className="absolute w-full h-full rounded-full overflow-hidden"
        style={{
          transform: `rotate(${rotationAngle}deg)`,
          transition:
            spinningState === 'slowing'
              ? 'transform 3s cubic-bezier(0.25, 0.1, 0.25, 1.0)'
              : spinningState === 'spinning'
              ? 'transform 0.05s linear'
              : 'transform 1s cubic-bezier(0.17, 0.67, 0.12, 0.99)',
          borderWidth: '4px',
          borderColor: '#333',
          borderStyle: 'solid',
          boxShadow: '0 0 15px rgba(0,0,0,0.2)',
          backgroundColor:
            participants.length === 1 ? colors[0] : 'transparent',
        }}
      >
        <svg width={size} height={size} className="absolute inset-0">
          <defs>
            {participants.map((_, index) => {
              const colorIndex = index % colors.length;
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
                    stopColor={colors[colorIndex]}
                    stopOpacity="1"
                  />
                  <stop
                    offset="100%"
                    stopColor={colors[colorIndex]}
                    stopOpacity="0.7"
                  />
                </linearGradient>
              );
            })}
          </defs>

          {/* 항목이 하나일 경우 원 전체를 채움 */}
          {participants.length === 1 ? (
            <circle
              cx={center}
              cy={center}
              r={center}
              fill={`url(#gradient-0)`}
              stroke="#fff"
              strokeWidth="1"
            />
          ) : (
            participants.map((_, index) => {
              const startAngle = index * sliceAngle;
              const endAngle = (index + 1) * sliceAngle;

              // 원형 그래프 SVG 생성
              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;

              const x1 = center + Math.cos(startRad) * center;
              const y1 = center + Math.sin(startRad) * center;
              const x2 = center + Math.cos(endRad) * center;
              const y2 = center + Math.sin(endRad) * center;

              const largeArcFlag = sliceAngle > 180 ? 1 : 0;

              // 파이 조각 SVG 경로
              const d = [
                `M ${center} ${center}`,
                `L ${x1} ${y1}`,
                `A ${center} ${center} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
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

        {/* 텍스트 레이어 (SVG 위에) */}
        {participants.map((participant, index) => {
          // 항목이 하나일 때는 중앙에 표시
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
          const textRadius = center * 0.65; // 중심에서 텍스트까지의 거리를 조정

          // 텍스트 위치 계산
          const textRad = (midAngle * Math.PI) / 180;
          const textX = center + Math.cos(textRad) * textRadius;
          const textY = center + Math.sin(textRad) * textRadius;

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
          left: `${center}px`,
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
