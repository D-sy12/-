// 真题试卷清单（主包，用于选卷页）
export const PAPER_LIST = [
  "2025-12-1",
  "2025-12-2",
  "2025-12-3",
  "2025-06-1",
  "2025-06-2",
  "2025-06-3",
  "2024-12-1",
  "2024-12-2",
  "2024-12-3",
  "2024-06-1",
  "2024-06-2",
  "2024-06-3",
  "2023-12-1",
  "2023-12-2",
  "2023-12-3",
  "2023-06-1",
  "2023-06-2",
  "2023-06-3",
  "2023-03-1",
  "2023-03-2",
  "2023-03-3",
  "2022-12-1",
  "2022-12-2",
  "2022-12-3",
  "2022-09-1",
  "2022-09-2",
  "2022-09-3",
  "2022-06-1",
  "2022-06-2",
  "2022-06-3",
  "2021-12-1",
  "2021-12-2",
  "2021-12-3",
  "2021-06-1",
  "2021-06-2",
  "2021-06-3",
  "2020-12-1",
  "2020-12-2",
  "2020-12-3",
  "2020-09-1",
  "2020-09-2",
  "2020-09-3"
] as const;

export type PaperId = (typeof PAPER_LIST)[number];

export function formatPaperId(pid: string): string {
  const [y, m, s] = pid.split('-');
  return y + '年' + parseInt(m, 10) + '月 第' + s + '套';
}

export function paperFullTitle(pid: string): string {
  const [y, m, s] = pid.split('-');
  return y + '年' + parseInt(m, 10) + '月大学英语四级真题（第' + s + '套）';
}

export function groupPapersByYear(): Array<{ year: string; papers: string[] }> {
  const groups: Record<string, string[]> = {};
  PAPER_LIST.forEach((pid) => {
    const y = pid.split('-')[0];
    if (!groups[y]) groups[y] = [];
    groups[y].push(pid);
  });
  return Object.keys(groups)
    .sort((a, b) => Number(b) - Number(a))
    .map((year) => ({ year, papers: groups[year] }));
}
