"use client";

import type { RunPoint } from "@/lib/running";

const size = 256;
const width = 720;
const height = 360;
function mercator(point: RunPoint, z: number) {
  const scale = size * 2 ** z;
  const latitude = Math.max(-85, Math.min(85, point.lat));
  return { x: (point.lng + 180) / 360 * scale, y: (1 - Math.log(Math.tan(latitude * Math.PI / 180) + 1 / Math.cos(latitude * Math.PI / 180)) / Math.PI) / 2 * scale };
}

export function RouteMap({ points }: { points: RunPoint[] }) {
  if (!points.length) return null;
  let zoom = 16;
  while (zoom > 3) {
    const projected = points.map(p => mercator(p,zoom));
    if (Math.max(...projected.map(p => p.x)) - Math.min(...projected.map(p => p.x)) <= width - 120 && Math.max(...projected.map(p => p.y)) - Math.min(...projected.map(p => p.y)) <= height - 110) break;
    zoom--;
  }
  const projected = points.map(p => mercator(p, zoom));
  const center = { x: (Math.min(...projected.map(p => p.x)) + Math.max(...projected.map(p => p.x))) / 2, y: (Math.min(...projected.map(p => p.y)) + Math.max(...projected.map(p => p.y))) / 2 };
  const left = center.x - width / 2, top = center.y - height / 2;
  const tiles = [];
  for (let x=Math.floor(left/size); x <= Math.floor((left+width)/size); x++) for (let y=Math.floor(top/size); y <= Math.floor((top+height)/size); y++) {
    if (x >= 0 && y >= 0 && x < 2 ** zoom && y < 2 ** zoom) tiles.push({ x, y });
  }
  const paths: string[] = [];
  let segment = -1;
  for (const point of projected.map((p,i) => ({ ...p, segment: points[i].segment }))) {
    if (point.segment !== segment) { paths.push(`M ${point.x-left} ${point.y-top}`); segment = point.segment; }
    else paths.push(`L ${point.x-left} ${point.y-top}`);
  }
  const start = projected[0], end = projected[projected.length - 1];
  return <figure className="relative overflow-hidden rounded-xl border border-[#dfe3e6] bg-[#e8edf0]"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Mapa do trajeto registrado, com início e chegada" className="block w-full" preserveAspectRatio="xMidYMid meet">
    {tiles.map(tile => <image key={`${tile.x}-${tile.y}`} href={`https://tile.openstreetmap.org/${zoom}/${tile.x}/${tile.y}.png`} x={tile.x*size-left} y={tile.y*size-top} width={size} height={size} />)}
    <path d={paths.join(" ")} fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" /><path d={paths.join(" ")} fill="none" stroke="#df5525" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx={start.x-left} cy={start.y-top} r="8" fill="#215b9e" stroke="white" strokeWidth="3" /><circle cx={end.x-left} cy={end.y-top} r="8" fill="#e54f25" stroke="white" strokeWidth="3" />
  </svg><figcaption className="absolute bottom-1 right-1 rounded bg-white/95 px-2 py-1 text-[10px] text-[#27313a]">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline">OpenStreetMap contributors</a></figcaption></figure>;
}
