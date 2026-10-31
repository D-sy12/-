import Taro from '@tarojs/taro';
import { paperUrl } from '@/utils/config';
import type { Paper } from '@/types/paper';

// 试卷体积较大（单套 40-60KB），全部按需远程拉取并缓存到内存
const cache = new Map<string, Paper>();

export async function getPaper(pid: string): Promise<Paper> {
  const hit = cache.get(pid);
  if (hit) return hit;

  const res = await Taro.request<Paper>({
    url: paperUrl(pid),
    method: 'GET',
    timeout: 20000,
  });

  if (res.statusCode !== 200 || !res.data || !res.data.id) {
    throw new Error(`试卷 ${pid} 加载失败（HTTP ${res.statusCode}）`);
  }

  cache.set(pid, res.data);
  return res.data;
}

export function clearPaperCache(): void {
  cache.clear();
}
