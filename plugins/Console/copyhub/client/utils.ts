import { ElMessage } from "element-plus";

function convertFileToBase64(file): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

function base64ToBlob(base64: string, type: string) {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type });
}

async function copyImageToClipboard(base64: string) {
  if (isImage(base64)) {
    const mime = base64.split(";")[0].split(":")[1]; // 获取 MIME 类型
    const blob = base64ToBlob(base64.split(",")[1], mime); // 将 Base64 转换为 Blob
    const item = new ClipboardItem({ [mime]: blob }); // 创建 ClipboardItem

    try {
      await navigator.clipboard.write([item]); // 写入剪切板
      ElMessage.success("图片已复制到剪切板");
    } catch (err) {
      ElMessage.error("复制失败", err);
    }
    return;
  }
  try {
    await navigator.clipboard.writeText(base64); // 写入剪切板
    ElMessage.success("已复制到剪切板");
  } catch (err) {
    ElMessage.error("复制失败", err);
  }
}

const isImage = (data: string) => {
  return data.startsWith("data:image/");
};

export { convertFileToBase64, copyImageToClipboard, isImage };
