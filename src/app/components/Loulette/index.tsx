'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';

import Wheel from '@/app/components/Wheel';

import { createClient } from '@/utils/supabase/client';

import { SpinningState } from '@/app/constants';
import { ChannelEvent } from '@/app/components/Loulette/constants';

const CHANNEL = 'loulette-p5ethx7';

function Loulette() {
  const [participants, setParticipants] = useState<string[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [newParticipant, setNewParticipant] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [spinSpeed, setSpinSpeed] = useState(30);
  const [spinningState, setSpinningState] = useState(SpinningState.IDLE);
  const [targetIndex, setTargetIndex] = useState(0);

  const [isConnected, setIsConnected] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const isInitialSetup = useRef<boolean>(true);

  const supabase = createClient();

  const startSpinning = () => {
    setSpinningState(SpinningState.SPINNING);
    setIsSpinning(true);
    setWinner(null);
    setSpinSpeed(30);
  };

  const handleStartSpinning = () => {
    if (participants.length === 0 || isSpinning) return;
    startSpinning();

    if (!channelRef.current || !isConnected || isInitialSetup.current) return;

    channelRef.current?.send({
      type: 'broadcast',
      event: ChannelEvent.SPIN_STARTED,
    });
  };

  const stopSpinning = (target: number) => {
    setTargetIndex(target);
    setSpinningState(SpinningState.SLOWING);
  };

  const handleStopSpinning = () => {
    if (!isSpinning || spinningState !== SpinningState.SPINNING) return;

    const randomStopIndex = Math.floor(Math.random() * participants.length);
    const finalTargetIndex = participants.length + randomStopIndex;
    const target = finalTargetIndex % participants.length;

    stopSpinning(target);

    if (!channelRef.current || !isConnected || isInitialSetup.current) return;

    channelRef.current?.send({
      type: 'broadcast',
      event: ChannelEvent.SPIN_STOPPED,
      payload: {
        targetIndex: target,
      },
    });
  };

  const addParticipant = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const participant = newParticipant.trim();

      if (participant && !participants.includes(participant)) {
        setParticipants([...participants, participant]);
        setNewParticipant('');

        if (!channelRef.current || !isConnected || isInitialSetup.current)
          return;

        channelRef.current?.send({
          type: 'broadcast',
          event: ChannelEvent.PARTICIPANT_ADDED,
          payload: {
            participant,
          },
        });
      }
    },
    [participants, newParticipant, isConnected, isInitialSetup],
  );

  const removeParticipant = useCallback(
    (index: number) => {
      setParticipants(participants.filter((_, i) => i !== index));

      if (!channelRef.current || !isConnected || isInitialSetup.current) return;

      channelRef.current?.send({
        type: 'broadcast',
        event: ChannelEvent.PARTICIPANT_REMOVED,
        payload: {
          participant: participants[index],
        },
      });
    },
    [participants, isConnected, isInitialSetup],
  );

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
    const fetchParticipants = async () => {
      try {
        const channel = supabase.channel(CHANNEL);
        channelRef.current = channel;

        channel.on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const updatedParticipants: string[] = [];
          Object.keys(state).forEach((key) => {
            const presences = state[key];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            presences.forEach((presence: any) => {
              updatedParticipants.push(presence.participant);
            });
          });

          setParticipants(updatedParticipants);
        });

        channel.on(
          'broadcast',
          { event: ChannelEvent.PARTICIPANT_ADDED },
          (payload) => {
            const { participant } = payload.payload;

            setParticipants((prevParticipants) => {
              return [...prevParticipants, participant];
            });
          },
        );

        channel.on(
          'broadcast',
          { event: ChannelEvent.PARTICIPANT_REMOVED },
          (payload) => {
            const { participant } = payload.payload;
            setParticipants((prevParticipants) =>
              prevParticipants.filter((p) => p !== participant),
            );
          },
        );

        channel.on('broadcast', { event: ChannelEvent.SPIN_STARTED }, () => {
          startSpinning();
        });

        channel.on(
          'broadcast',
          { event: ChannelEvent.SPIN_STOPPED },
          (payload) => {
            const { targetIndex } = payload.payload;
            stopSpinning(targetIndex);
          },
        );

        channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            // TODO: 초기 설정 완료 후 추가 추적
            // await channel.track({ participant: 'test' });
            setIsConnected(true);
            isInitialSetup.current = false;
          }
        });
      } catch (error) {
        console.error('Error fetching participants:', error);
      }
    };

    fetchParticipants();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, []);

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
              <div
                key={index}
                className="badge badge-primary gap-1 min-w-12 cursor-pointer"
                onClick={() => removeParticipant(index)}
              >
                {participant}
                <button className="btn btn-xs btn-ghost">×</button>
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
