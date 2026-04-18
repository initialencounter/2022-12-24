// 简单的代理服务器，不需要外部依赖
const http = require('http');
const url = require('url');

const PORT = 3001;

// 模拟数据
const mockPosts = [
  {
    postId: 123456,
    title: '测试帖子标题',
    text: '这是一个测试帖子的内容 #扫雷 #游戏',
    createTime: Date.now() - 3600000,
    commentCount: 15,
    goodCount: 42,
    viewCount: 128,
    user: {
      uid: 1001,
      nickName: '扫雷玩家',
      avatar: 'https://via.placeholder.com/104',
      timingLevel: 2,
      timingRank: 50
    },
    device: 'Android',
    recordId: 789,
    recordType: 0,
    record: {
      row: 16,
      column: 30,
      mine: 99,
      time: 123456,
      bvs: 2.5
    },
    lastComment: {
      commentId: 456,
      comment: '这个帖子很棒！',
      createTime: Date.now() - 1800000,
      user: {
        nickName: '评论用户',
        avatar: 'https://via.placeholder.com/60'
      }
    }
  },
  {
    postId: 123457,
    title: '另一个测试帖子',
    text: '更多测试内容 #2048 #益智',
    createTime: Date.now() - 7200000,
    commentCount: 8,
    goodCount: 23,
    viewCount: 89,
    user: {
      uid: 1002,
      nickName: '游戏爱好者',
      avatar: 'https://via.placeholder.com/104',
      timingLevel: 1,
      timingRank: 120
    },
    device: 'iOS',
    recordId: 790,
    recordType: 2,
    puzzleRecord: {
      row: 4,
      column: 4,
      time: 45678,
      step: 42
    }
  }
];

const mockComments = [
  {
    commentId: 1001,
    comment: '这个帖子很有帮助！',
    createTime: Date.now() - 1800000,
    goodCount: 12,
    replyCount: 3,
    user: {
      uid: 2001,
      nickName: '热心用户',
      avatar: 'https://via.placeholder.com/60'
    }
  },
  {
    commentId: 1002,
    comment: '感谢分享，学到了很多',
    createTime: Date.now() - 2400000,
    goodCount: 8,
    replyCount: 1,
    user: {
      uid: 2002,
      nickName: '学习者',
      avatar: 'https://via.placeholder.com/60'
    }
  }
];

const server = http.createServer((req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  console.log(`${req.method} ${pathname}`);
  
  // 根据路径返回不同的模拟数据
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const params = new URLSearchParams(body);
        const data = Object.fromEntries(params.entries());
        
        let response;
        
        if (pathname === '/Minesweeper/post/list') {
          response = {
            code: 200,
            msg: 'success',
            data: mockPosts
          };
        } else if (pathname === '/Minesweeper/post/get') {
          const postId = parseInt(data.postId);
          const post = mockPosts.find(p => p.postId === postId) || {
            ...mockPosts[0],
            postId: postId,
            title: `帖子 ${postId}`,
            text: `这是帖子 ${postId} 的详细内容`
          };
          
          response = {
            code: 200,
            msg: 'success',
            data: post
          };
        } else if (pathname === '/Minesweeper/post/comment/list') {
          response = {
            code: 200,
            msg: 'success',
            data: mockComments
          };
        } else if (pathname === '/Minesweeper/post/list/search') {
          const keyword = data.keyword || '';
          const filteredPosts = mockPosts.filter(post => 
            post.title.includes(keyword) || 
            post.text.includes(keyword) ||
            post.user.nickName.includes(keyword)
          );
          
          response = {
            code: 200,
            msg: 'success',
            data: filteredPosts.length > 0 ? filteredPosts : [{
              postId: 123458,
              title: `关于"${keyword}"的搜索结果`,
              text: `搜索关键词: ${keyword}`,
              createTime: Date.now() - 4800000,
              commentCount: 3,
              goodCount: 10,
              viewCount: 45,
              user: {
                uid: 1003,
                nickName: '搜索用户',
                avatar: 'https://via.placeholder.com/104',
                timingLevel: 0,
                timingRank: null
              },
              device: 'Web'
            }]
          };
        } else {
          response = {
            code: 404,
            msg: 'Endpoint not found',
            data: null
          };
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } catch (error) {
        console.error('Error processing request:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ code: 500, msg: 'Internal server error', data: null }));
      }
    });
  } else if (req.method === 'GET' && pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      endpoints: [
        'POST /Minesweeper/post/list',
        'POST /Minesweeper/post/get',
        'POST /Minesweeper/post/comment/list',
        'POST /Minesweeper/post/list/search'
      ]
    }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ code: 404, msg: 'Not found', data: null }));
  }
});

server.listen(PORT, () => {
  console.log(`模拟API服务器运行在 http://localhost:${PORT}`);
  console.log('可用端点:');
  console.log('  POST /Minesweeper/post/list - 获取帖子列表');
  console.log('  POST /Minesweeper/post/get - 获取帖子详情');
  console.log('  POST /Minesweeper/post/comment/list - 获取评论列表');
  console.log('  POST /Minesweeper/post/list/search - 搜索帖子');
  console.log('  GET  /health - 健康检查');
});