import type * as Party from 'partykit/server';

export default class MainServer implements Party.Server {
  // 存储历史消息（最多100条）
  private messageHistory: any[] = [];
  private readonly MAX_HISTORY = 100;

  constructor(readonly room: Party.Room) {}

  // 处理 HTTP 请求，访问 http://127.0.0.1:1999 时不再 404
  onRequest(request: Party.Request) {
    return new Response('修仙世界联机服务器已就绪！', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(`Connected: ${conn.id}`);
    
    // 获取当前连接数
    const connections = Array.from(this.room.getConnections());
    const onlineCount = connections.length;
    
    // 先发送历史消息给新连接的用户（最近10条）
    if (this.messageHistory.length > 0) {
      const recentHistory = this.messageHistory.slice(-10);
      conn.send(
        JSON.stringify({
          type: 'history',
          messages: recentHistory
        })
      );
    }
    
    // 然后发送欢迎消息
    conn.send(
      JSON.stringify({
        type: 'welcome',
        message: '欢迎来到修仙世界！',
        onlineCount: onlineCount
      })
    );
    
    // 广播给所有用户更新在线人数
    this.room.broadcast(
      JSON.stringify({
        type: 'onlineCountUpdate',
        onlineCount: onlineCount
      })
    );
  }

  onMessage(message: string, sender: Party.Connection) {
    console.log(`Message from ${sender.id}: ${message}`);
    
    try {
      const data = JSON.parse(message);
      
      // 如果是聊天消息，存储到历史记录
      if (data.type === 'chat') {
        this.messageHistory.push(data);
        
        // 保持历史记录不超过最大限制
        if (this.messageHistory.length > this.MAX_HISTORY) {
          this.messageHistory = this.messageHistory.slice(-this.MAX_HISTORY);
        }
      }
    } catch (e) {
      // 如果不是JSON格式的消息，忽略历史记录存储
    }
    
    // 广播给所有人（包括发送者），这样发送者能立即在自己的界面看到消息
    this.room.broadcast(message);
  }

  onClose(conn: Party.Connection) {
    console.log(`Disconnected: ${conn.id}`);
    
    // 更新在线人数
    const connections = Array.from(this.room.getConnections());
    const onlineCount = connections.length;
    
    // 广播给所有用户更新在线人数
    this.room.broadcast(
      JSON.stringify({
        type: 'onlineCountUpdate',
        onlineCount: onlineCount
      })
    );
  }
}
