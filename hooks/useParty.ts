import { useEffect, useState } from 'react';
import PartySocket from 'partysocket';

const PARTYKIT_HOST =
  window.location.hostname === 'localhost'
    ? '127.0.0.1:1999'
    : import.meta.env.VITE_PARTYKIT_HOST ||
      'xiuxian-game-party.dnzzk2.partykit.dev';

export function useParty(roomName: string = 'main', limit: number = 150) {
  const [socket, setSocket] = useState<PartySocket | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [onlineCount, setOnlineCount] = useState<number>(0);

  useEffect(() => {
    const s = new PartySocket({
      host: PARTYKIT_HOST,
      room: roomName,
    });

    s.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // 处理不同类型的消息
        if (data.type === 'onlineCountUpdate') {
          setOnlineCount(data.onlineCount);
        } else if (data.type === 'welcome') {
          // 欢迎消息包含初始在线人数
          setOnlineCount(data.onlineCount || 0);
          setMessages((prev) => {
            const newMessages = [...prev, data];
            return newMessages.slice(-limit);
          });
        } else {
          // 普通消息
          setMessages((prev) => {
            const newMessages = [...prev, data];
            return newMessages.slice(-limit);
          });
        }
      } catch (e) {
        setMessages((prev) => {
          const newMessages = [...prev, event.data];
          return newMessages.slice(-limit);
        });
      }
    };

    setSocket(s);

    return () => {
      s.close();
    };
  }, [roomName, limit]);

  const sendMessage = (message: any) => {
    if (socket) {
      socket.send(JSON.stringify(message));
    }
  };

  return { socket, messages, sendMessage, onlineCount };
}
