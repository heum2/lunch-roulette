'use client';

import { useState, useEffect } from 'react';

import Wheel from '@/app/components/Wheel'; // Wheel 컴포넌트 다시 사용
// import WheelSimpleRotate from '@/app/components/WheelSimpleRotate'; // 제거

export default function Home() {
  const [participants, setParticipants] = useState<string[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [newParticipant, setNewParticipant] = useState('');
  // 이전 상태 복원
  const [currentIndex, setCurrentIndex] = useState(0);
  const [spinSpeed, setSpinSpeed] = useState(30);
  const [spinningState, setSpinningState] = useState<
    'idle' | 'spinning' | 'slowing'
  >('idle');
  const [targetIndex, setTargetIndex] = useState(0);
  // rotation 상태 제거

  // useEffect 복원 (애니메이션 포함)
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (spinningState === 'spinning') {
      interval = setInterval(() => {
        setCurrentIndex((prev) => prev + 1);
      }, spinSpeed);
    } else if (spinningState === 'slowing') {
      const slowingTime = 3000; // 슬로잉 애니메이션 시간(ms)
      const timer = setTimeout(() => {
        setSpinningState('idle');
        setIsSpinning(false);

        // 최종 당첨자 결정 (targetIndex 기반)
        const finalIndex = targetIndex % participants.length;
        const actualWinner = participants[finalIndex];
        setWinner(actualWinner);
      }, slowingTime);

      return () => clearTimeout(timer);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [spinningState, spinSpeed, participants, targetIndex]);

  const handleStartSpinning = () => {
    if (participants.length === 0 || isSpinning) return;
    setSpinningState('spinning');
    setIsSpinning(true);
    setWinner(null);
    setCurrentIndex(0);
    setSpinSpeed(30);
  };

  const handleStopSpinning = () => {
    if (!isSpinning || spinningState !== 'spinning') return;

    // 최종 멈춤 위치 계산 (이전 로직 복원)
    const extraRotations = Math.floor(Math.random() * 2) + 2;
    const randomStopIndex = Math.floor(Math.random() * participants.length);
    const currentRotation = Math.floor(currentIndex / participants.length);
    const targetRotation = currentRotation + extraRotations;
    const finalTargetIndex =
      targetRotation * participants.length + randomStopIndex;

    setTargetIndex(finalTargetIndex);
    // setCurrentIndex(finalTargetIndex); // 슬로잉 애니메이션 위해 제거
    setSpinningState('slowing');
    // setIsSpinning(false); // setTimeout에서 처리
    // setWinner(...); // setTimeout에서 처리
  };

  const addParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      newParticipant.trim() &&
      !participants.includes(newParticipant.trim())
    ) {
      setParticipants([...participants, newParticipant.trim()]);
      setNewParticipant('');
    }
  };

  const removeParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full flex flex-col gap items-center justify-center gap-y-5 max-w-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">점심 룰렛</h1>
          {participants.length > 0 ? (
            <div className="text-xl font-semibold mb-4">
              {/* winner는 spinningState가 idle일 때만 표시 */}
              {winner && spinningState === 'idle' ? (
                <div className="text-primary font-bold text-2xl animate-bounce">
                  당첨: {winner}
                </div>
              ) : (
                '시작해보세요!'
              )}
            </div>
          ) : (
            <p className="text-gray-500">메뉴를 추가해주세요</p>
          )}
        </div>

        {/* Wheel 컴포넌트 다시 사용 */}
        <Wheel
          participants={participants}
          currentIndex={currentIndex}
          spinningState={spinningState}
          targetIndex={targetIndex}
        />

        <form onSubmit={addParticipant} className="flex gap-x-2 w-full">
          <input
            type="text"
            value={newParticipant}
            onChange={(e) => setNewParticipant(e.target.value)}
            placeholder="메뉴 이름"
            className="input input-bordered flex-3"
          />
          <button type="submit" className="btn btn-primary flex-1">
            추가
          </button>
        </form>

        {participants.length > 0 && (
          <div className="space-y-2">
            <h2 className="font-semibold">목록</h2>
            <div className="flex flex-wrap gap-2">
              {participants.map((participant, index) => (
                <div key={index} className="badge badge-primary gap-1 min-w-12">
                  {participant}
                  <button
                    onClick={() => removeParticipant(index)}
                    className="btn btn-xs btn-ghost"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-x-2 w-full">
          <button
            className="btn btn-neutral flex-1"
            onClick={handleStartSpinning}
            disabled={isSpinning || participants.length === 0}
          >
            돌려
          </button>
          <button
            className="btn btn-active flex-1"
            onClick={handleStopSpinning}
            disabled={!isSpinning || spinningState !== 'spinning'}
          >
            멈춰
          </button>
        </div>
      </div>
    </div>
  );
}
