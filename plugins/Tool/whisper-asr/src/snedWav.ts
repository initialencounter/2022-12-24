import { readFileSync } from 'node:fs';

/**
 * 通过 OneBot HTTP 发送群组语音消息（支持 Token 鉴权）
 * @param groupId     目标群号
 * @param filePath    本地 WAV 文件的绝对或相对路径
 * @param baseUrl     OneBot HTTP 服务地址（默认 http://127.0.0.1:5700）
 * @param accessToken 可选，API 访问令牌（如果 OneBot 配置了 access_token）
 * @returns           返回 API 响应的 JSON 对象
 */
async function sendGroupVoice(
  groupId: number,
  filePath: string,
  baseUrl: string,
  accessToken?: string
): Promise<any> {
  const url = `${baseUrl}/send_group_msg`;

  const payload = {
    group_id: groupId,
    message: [
      {
        "type": "record",
        "data": {
          "file": "data:audio/wav;base64," + Buffer.from(readFileSync(filePath)).toString('base64'),
        },
      },
    ],
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // 如果提供了 accessToken，则添加到 Authorization 头
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`HTTP 请求失败，状态码：${response.status}`);
  }

  const result = await response.json();

  // OneBot 标准返回中 status 为 'ok' 或 retcode 为 0 表示成功
  if (result.status !== 'ok' && result.retcode !== 0) {
    throw new Error(`OneBot 返回错误：${result.msg || JSON.stringify(result)}`);
  }

  return result;
}

// ---------- 使用示例（命令行） ----------
// 用法：node script.js <群号> <WAV文件路径> [OneBot地址] [accessToken]
// 例如：node script.js 123456789 /home/user/voice.wav http://127.0.0.1:5700 my_secret_token

async function main() {
  const groupId = 714798147
  const filePath = "C:\\Users\\29115\\Downloads\\钗头凤-咕咕嘎嘎.wav";
  const baseUrl = 'http://127.0.0.1:3000';
  const accessToken = 'ieieie'; // 可选

  try {
    const response = await sendGroupVoice(groupId, filePath, baseUrl, accessToken);
    console.log('语音消息发送成功：', response);
  } catch (error: any) {
    console.error('发送失败：', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本则执行 main()
if (require.main === module) {
  main();
}
