"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge, EmptyState } from "@/components/ui";
import { formatDate, formatRelativeDate } from "@/lib/format";

export type StudentDirectoryItem = {
  id: string;
  name: string;
  teacherName: string | null;
  status: "ACTIVE" | "INACTIVE";
  planName: string | null;
  validUntil: string | null;
  lastActivity: string | null;
  planState: "current" | "expired" | "none";
  attention: string | null;
};

export function StudentDirectory({ students }: { students: StudentDirectoryItem[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredStudents = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");

    return students.filter((student) => {
      const matchesQuery =
        !normalizedQuery ||
        student.name.toLocaleLowerCase("pt-BR").includes(normalizedQuery) ||
        student.teacherName?.toLocaleLowerCase("pt-BR").includes(normalizedQuery);
      if (!matchesQuery) return false;
      if (filter === "without-plan") return student.planState === "none";
      if (filter === "expired") return student.planState === "expired";
      if (filter === "attention") return Boolean(student.attention);
      if (filter === "inactive") return student.status === "INACTIVE";
      return true;
    });
  }, [filter, query, students]);

  return (
    <section className="border border-[#dfe3e6] bg-white">
      <div className="flex flex-col gap-3 border-b border-[#dfe3e6] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <label className="relative block min-w-0 flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8a959d]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por aluno ou professor"
            className="min-h-10 w-full rounded-lg border border-[#cfd5d9] bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-[#e85d24] focus:ring-2 focus:ring-[#fed7aa]"
          />
        </label>
        <label className="flex min-h-10 items-center gap-2 rounded-lg border border-[#cfd5d9] px-3 text-sm text-[#56616c]">
          <SlidersHorizontal className="size-4" />
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="min-w-36 bg-transparent text-sm font-semibold text-[#3c4650] outline-none"
            aria-label="Filtrar alunos"
          >
            <option value="all">Todos os alunos</option>
            <option value="attention">Com pendência</option>
            <option value="without-plan">Sem treino</option>
            <option value="expired">Treino vencido</option>
            <option value="inactive">Inativos</option>
          </select>
        </label>
      </div>

      {filteredStudents.length === 0 ? (
        <EmptyState title="Nenhum aluno encontrado" description="Ajuste a busca ou os filtros para ver outros alunos." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="bg-[#fafafa] text-xs font-bold uppercase tracking-[0.09em] text-[#64707d]">
              <tr>
                <th className="px-5 py-3.5">Aluno</th>
                <th className="px-5 py-3.5">Professor responsável</th>
                <th className="px-5 py-3.5">Treino atual</th>
                <th className="px-5 py-3.5">Validade</th>
                <th className="px-5 py-3.5">Última atividade</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf0f2]">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="transition hover:bg-[#fffaf5]">
                  <td className="px-5 py-4">
                    <Link href={`/students/${student.id}`} className="font-bold text-[#27313a] hover:text-[#c84411] hover:underline">
                      {student.name}
                    </Link>
                    {student.attention && <p className="mt-1 text-xs font-medium text-[#b45309]">{student.attention}</p>}
                  </td>
                  <td className="px-5 py-4 text-[#56616c]">{student.teacherName ?? "Sem responsável"}</td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-[#3c4650]">{student.planName ?? "Sem treino atribuído"}</p>
                  </td>
                  <td className="px-5 py-4 text-[#56616c]">{formatDate(student.validUntil ? new Date(student.validUntil) : null)}</td>
                  <td className="px-5 py-4 text-[#56616c]">{formatRelativeDate(student.lastActivity ? new Date(student.lastActivity) : null)}</td>
                  <td className="px-5 py-4">
                    {student.status === "INACTIVE" ? (
                      <Badge tone="neutral">Inativo</Badge>
                    ) : student.planState === "expired" ? (
                      <Badge tone="danger">Treino vencido</Badge>
                    ) : student.planState === "none" ? (
                      <Badge tone="warning">Sem treino</Badge>
                    ) : (
                      <Badge tone="success">Ativo</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
