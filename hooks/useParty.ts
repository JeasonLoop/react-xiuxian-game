import { useEffect, useState } from 'react';
import PartySocket from 'partysocket';

// 智能检测PartyKit服务器地址
// 开发环境：使用当前访问的hostname + 1999端口（支持localhost和IP地址访问）
// 生产环境：使用环境变量或默认的远程服务器
const getPartyKitHost = () => {
  if (import.meta.env.DEV) {
    // 开发环境：使用当前页面的hostname，这样IP访问时也能正确连接
    const hostname = window.location.hostname;
    return `${hostname}:1999`;
  } else {
    // 生产环境：使用配置的远程服务器
    return (
      import.meta.env.VITE_PARTYKIT_HOST ||
      'xiuxian-game-party.dnzzk2.partykit.dev'
    );
  }
};

console.log(getPartyKitHost());
const PARTYKIT_HOST = getPartyKitHost();

// 全局状态管理
let globalSocket: PartySocket | null = null;
let messageListeners: ((data: any) => void)[] = [];
let onlineCountListeners: ((count: number) => void)[] = [];
let currentOnlineCount = 0;

function setupGlobalConnection(roomName: string) {
  if (globalSocket) return globalSocket;

  const s = new PartySocket({
    host: PARTYKIT_HOST,
    room: roomName,
  });

  s.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      // 处理在线人数更新
      if (data.type === 'onlineCountUpdate') {
        currentOnlineCount = data.onlineCount;
        onlineCountListeners.forEach((listener) =>
          listener(currentOnlineCount)
        );
      } else if (data.type === 'welcome') {
        // 欢迎消息包含初始在线人数
        currentOnlineCount = data.onlineCount || 0;
        onlineCountListeners.forEach((listener) =>
          listener(currentOnlineCount)
        );

        // 同时触发消息监听器
        messageListeners.forEach((listener) => listener(data));
      } else {
        // 普通消息
        messageListeners.forEach((listener) => listener(data));
      }
    } catch (e) {
      // 非JSON消息
      messageListeners.forEach((listener) => listener(event.data));
    }
  };

  globalSocket = s;
  return s;
}

export function useParty(roomName: string = 'main', limit: number = 150) {
  const [socket, setSocket] = useState<PartySocket | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [onlineCount, setOnlineCount] = useState<number>(0);

  useEffect(() => {
    const s = setupGlobalConnection(roomName);
    setSocket(s);

    // 添加消息监听器
    const messageListener = (data: any) => {
      setMessages((prev) => {
        const newMessages = [...prev, data];
        return newMessages.slice(-limit);
      });
    };

    // 添加在线人数监听器
    const onlineCountListener = (count: number) => {
      setOnlineCount(count);
    };

    messageListeners.push(messageListener);
    onlineCountListeners.push(onlineCountListener);

    // 设置初始在线人数
    setOnlineCount(currentOnlineCount);

    return () => {
      // 清理监听器
      messageListeners = messageListeners.filter((l) => l !== messageListener);
      onlineCountListeners = onlineCountListeners.filter(
        (l) => l !== onlineCountListener
      );

      // 如果没有监听器了，关闭连接
      if (
        messageListeners.length === 0 &&
        onlineCountListeners.length === 0 &&
        globalSocket
      ) {
        globalSocket.close();
        globalSocket = null;
        currentOnlineCount = 0;
      }
    };
  }, [roomName, limit]);

  const sendMessage = (message: any) => {
    if (socket) {
      socket.send(JSON.stringify(message));
    }
  };

  return { socket, messages, sendMessage, onlineCount };
}
