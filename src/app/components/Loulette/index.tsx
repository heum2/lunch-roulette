'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import Wheel from '@/app/components/Wheel';

import { SpinningState } from '@/app/constants';

import { createClient } from '@/utils/supabase/client';

function Loulette() {
  const [participants, setParticipants] = useState<string[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [newParticipant, setNewParticipant] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [spinSpeed, setSpinSpeed] = useState(30);
  const [spinningState, setSpinningState] = useState(SpinningState.IDLE);
  const [targetIndex, setTargetIndex] = useState(0);

  const router = useRouter();

  const supabase = createClient();

  const handleStartSpinning = () => {
    if (participants.length === 0 || isSpinning) return;
    setSpinningState(SpinningState.SPINNING);
    setIsSpinning(true);
    setWinner(null);
    setSpinSpeed(30);
  };

  const handleStopSpinning = () => {
    if (!isSpinning || spinningState !== SpinningState.SPINNING) return;

    const randomStopIndex = Math.floor(Math.random() * participants.length);
    const finalTargetIndex = participants.length + randomStopIndex;
    setTargetIndex(finalTargetIndex % participants.length);
    setSpinningState(SpinningState.SLOWING);
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

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (spinningState === SpinningState.SPINNING) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => prev + 1);
      }, spinSpeed);
    } else if (spinningState === SpinningState.SLOWING) {
      const slowingTime = 3000;
      const timer = setTimeout(() => {
        setSpinningState(SpinningState.IDLE);
        setIsSpinning(false);

        const actualWinner = participants[targetIndex];
        setWinner(actualWinner);
      }, slowingTime);

      return () => clearTimeout(timer);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [spinningState, spinSpeed, participants, targetIndex]);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { error } = await supabase.auth.getUser();
        if (error) {
          throw error;
        }
      } catch (error) {
        console.error('Error fetching user', error);
        router.replace('/login');
      }
    };
    fetchSession();
  }, [supabase.auth, router]);

  return (
    <div className="w-full flex flex-col gap items-center justify-center gap-y-5 max-w-md">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">점심 룰렛</h1>
        {participants.length > 0 ? (
          <div className="text-xl font-semibold mb-4">
            {winner && spinningState === SpinningState.IDLE ? (
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
          disabled={!isSpinning || spinningState !== SpinningState.SPINNING}
        >
          멈춰
        </button>
      </div>
    </div>
  );
}

export default Loulette;
