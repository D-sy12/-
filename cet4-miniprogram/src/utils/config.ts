// 听力音频与真题数据都托管在原网站，按需远程加载
// 上架前需在微信公众平台「downloadFile合法域名」中添加 https://www.dusy.top
// 开发期可在微信开发者工具勾选「不校验合法域名」
export const AUDIO_BASE = 'https://www.dusy.top/audio';
export const PAPER_BASE = 'https://www.dusy.top/js/papers';

export function audioUrl(pid: string): string {
  return `${AUDIO_BASE}/${pid}.mp3`;
}

export function paperUrl(pid: string): string {
  return `${PAPER_BASE}/${pid}.json`;
}
