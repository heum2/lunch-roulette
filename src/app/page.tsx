'use client';

import { useState, useEffect } from 'react';

import Wheel from '@/app/components/Wheel';

export default function Home() {
  const [participants, setParticipants] = useState<string[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [newParticipant, setNewParticipant] = useState('');
  const [spinSpeed, setSpinSpeed] = useState(30); // 초기 속도 더 빠르게
  const [spinningState, setSpinningState] = useState<
    'idle' | 'spinning' | 'slowing'
  >('idle');
  const [targetIndex, setTargetIndex] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (spinningState === 'spinning') {
      interval = setInterval(() => {
        setCurrentIndex((prev) => prev + 1);
      }, spinSpeed);
    } else if (spinningState === 'slowing') {
      // 슬로잉 중에는 인터벌을 실행하지 않음

      // 타이머를 통해 슬로잉 애니메이션이 끝난 후 완전히 정지시킴
      const slowingTime = 3000; // 슬로잉 애니메이션 시간(ms)과 일치해야 함
      const timer = setTimeout(() => {
        setSpinningState('idle');
        setIsSpinning(false);

        // 최종 당첨자 결정
        // 타깃 인덱스를 참가자 수로 나눈 나머지가 실제 화살표가 가리키는 메뉴 인덱스
        // 회전 방향이 바뀌었으므로 계산 방식도 변경
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
    if (participants.length === 0) return;
    setSpinningState('spinning');
    setIsSpinning(true);
    setWinner(null);
    setCurrentIndex(0);
    setSpinSpeed(30); // 초기 속도 빠르게
  };

  const handleStopSpinning = () => {
    if (!isSpinning || spinningState !== 'spinning') return;

    // 좀 더 많이 회전 후 멈춤
    const extraRotations = Math.floor(Math.random() * 2) + 2; // 추가로 2~3바퀴 더 돌리기

    // 현재 인덱스에서 랜덤하게 최종 멈춤 위치 계산
    const randomStopIndex = Math.floor(Math.random() * participants.length);
    const currentRotation = Math.floor(currentIndex / participants.length);
    const targetRotation = currentRotation + extraRotations;
    const finalTargetIndex =
      targetRotation * participants.length + randomStopIndex;

    setTargetIndex(finalTargetIndex);
    setCurrentIndex(finalTargetIndex);
    setSpinningState('slowing');
  };

  const handleSelectWinner = (selectedWinner: string) => {
    setWinner(selectedWinner);
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

        <Wheel
          participants={participants}
          currentIndex={currentIndex}
          isSpinning={isSpinning}
          winner={winner}
          onSelectWinner={handleSelectWinner}
          spinningState={spinningState}
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
