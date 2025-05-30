'use client';

import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import Image from 'next/image';
import { RealtimeChannel } from '@supabase/supabase-js';

import { createClient } from '@/utils/supabase/client';

import { ChannelEvent } from '@/app/components/Cursor/constants';

const CHANNEL = 'cursor-tracking-p5ethx7';

type CursorPosition = {
  x: number;
  y: number;
};

type UserCursor = {
  username: string;
  image: string;
  position: CursorPosition;
  online_at: number;
};

type UserCursors = {
  [key: string]: UserCursor;
};

const Cursor = ({ children }: PropsWithChildren) => {
  const [isConnected, setIsConnected] = useState(false);
  const [userCursors, setUserCursors] = useState<UserCursors>({});

  const userId = useRef<string>('');

  const containerRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isInitialSetup = useRef(true);

  const supabase = createClient();

  const broadcastCursorPosition = useCallback(
    (position: CursorPosition) => {
      if (!channelRef.current || !isConnected || isInitialSetup.current) return;

      channelRef.current.send({
        type: 'broadcast',
        event: ChannelEvent.CURSOR_MOVED,
        payload: {
          userId: userId.current,
          x: position.x,
          y: position.y,
        },
      });
    },
    [isConnected],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();

      const relativeX = ((e.clientX - rect.left) / rect.width) * 100;
      const relativeY = ((e.clientY - rect.top) / rect.height) * 100;

      const newPosition = { x: relativeX, y: relativeY };

      broadcastCursorPosition(newPosition);
    },
    [broadcastCursorPosition],
  );

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const { data } = await supabase.auth.getUser();

        if (!data.user) {
          return;
        }

        userId.current = data.user.id;

        const channel = supabase.channel(CHANNEL);
        channelRef.current = channel;

        channel.on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();

          const updatedUserInfo: UserCursors = {};
          Object.keys(state).forEach((key) => {
            const presences = state[key];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            presences.forEach((presence: any) => {
              if (presence.user_id === userId.current) return;

              updatedUserInfo[presence.user_id] = {
                username: presence.username,
                image: presence.image,
                position: userCursors[presence.user_id]?.position || {
                  x: 0,
                  y: 0,
                },
                online_at: presence.online_at,
              };
            });
          });

          setUserCursors((prevCursors) => {
            const newCursors = { ...prevCursors };

            Object.keys(updatedUserInfo).forEach((id) => {
              newCursors[id] = {
                ...newCursors[id],
                ...updatedUserInfo[id],
              };
            });

            Object.keys(newCursors).forEach((id) => {
              const userExists = Object.values(state).some((presences) =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                presences.some((presence: any) => presence.user_id === id),
              );

              if (!userExists) {
                delete newCursors[id];
              }
            });

            return newCursors;
          });
        });

        channel.on(
          'broadcast',
          { event: ChannelEvent.CURSOR_MOVED },
          (payload) => {
            if (payload.payload.userId === userId.current) return;

            const { userId: cursorUserId, x, y } = payload.payload;

            setUserCursors((prevCursors) => {
              if (!prevCursors[cursorUserId]) return prevCursors;

              return {
                ...prevCursors,
                [cursorUserId]: {
                  ...prevCursors[cursorUserId],
                  position: { x, y },
                },
              };
            });
          },
        );

        channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              user_id: userId.current,
              username: data.user.user_metadata.name,
              image: data.user.user_metadata.avatar_url,
              online_at: new Date().getTime(),
            });

            setIsConnected(true);
            isInitialSetup.current = false;
          }
        });
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchUserId();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-center min-h-screen p-4"
      onMouseMove={handleMouseMove}
    >
      {Object.entries(userCursors).map(
        ([id, { position, username, image }]) => (
          <div
            key={id}
            className="absolute pointer-events-none flex flex-col items-start"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              zIndex: 100,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div>
              <Image
                src="icons/cursor.svg"
                alt="cursor"
                width={24}
                height={24}
              />
            </div>

            <div className="relative left-3 bottom-1 flex items-center gap-2">
              <Image
                className="btn-circle"
                width={24}
                height={24}
                src={image}
                alt={username}
              />
            </div>
          </div>
        ),
      )}
      {!isConnected && (
        <div className="absolute top-16 left-0 right-0 flex justify-center">
          <div className="bg-red-500/80 text-white px-4 py-2 rounded-full text-sm">
            Connecting to Supabase Realtime...
          </div>
        </div>
      )}

      {children}
    </div>
  );
};

export default Cursor;
