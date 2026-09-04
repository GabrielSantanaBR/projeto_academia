"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type AssessmentPoint = {
  date: string;
  weight: number | null;
  waist: number | null;
};

function MiniLineChart({ data, dataKey, color, unit }: { data: AssessmentPoint[]; dataKey: "weight" | "waist"; color: string; unit: string }) {
  const usableData = data.filter((item) => item[dataKey] !== null);
  if (usableData.length < 2) return null;

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={usableData} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
          <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "#64707d", fontSize: 11 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64707d", fontSize: 11 }} width={32} />
          <Tooltip
            cursor={{ stroke: "#dfe3e6" }}
            contentStyle={{ border: "1px solid #dfe3e6", borderRadius: "8px", fontSize: "12px" }}
            formatter={(value) => [`${Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ${unit}`, dataKey === "weight" ? "Peso" : "Cintura"]}
          />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={{ r: 3, fill: color }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AssessmentChart({ assessments }: { assessments: AssessmentPoint[] }) {
  const hasWeight = assessments.filter((item) => item.weight !== null).length >= 2;
  const hasWaist = assessments.filter((item) => item.waist !== null).length >= 2;

  if (!hasWeight && !hasWaist) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {hasWeight && (
        <div>
          <p className="mb-2 text-sm font-bold text-[#27313a]">Peso (kg)</p>
          <MiniLineChart data={assessments} dataKey="weight" color="#e85d24" unit="kg" />
        </div>
      )}
      {hasWaist && (
        <div>
          <p className="mb-2 text-sm font-bold text-[#27313a]">Cintura (cm)</p>
          <MiniLineChart data={assessments} dataKey="waist" color="#1f7a8c" unit="cm" />
        </div>
      )}
    </div>
  );
}
