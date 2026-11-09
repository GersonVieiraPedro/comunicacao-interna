"use client";

import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const ACCENT = "#470082";
const VIOLET = "#aa3ffe";
const MUTED = "#e4d7f2";
const SUCCESS = "#0f7b4c";
const WARNING = "#9a6700";
const DANGER = "#b42318";

const STATUS_COLORS: Record<string, string> = {
  PUBLISHED: ACCENT,
  DRAFT: VIOLET,
  SCHEDULED: WARNING,
  EXPIRED: MUTED,
  CANCELLED: DANGER,
};

const STATUS_LABELS: Record<string, string> = {
  PUBLISHED: "Publicados",
  DRAFT: "Rascunhos",
  SCHEDULED: "Agendados",
  EXPIRED: "Expirados",
  CANCELLED: "Cancelados",
};

function ChartCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm md:p-5">
      <h2 className="text-sm font-semibold text-fg">{title}</h2>
      {description ? <p className="mt-1 text-xs text-fg-muted">{description}</p> : null}
      <div className="mt-4 h-64 w-full min-w-0">{children}</div>
      {footer}
    </section>
  );
}

export function AdminDashboardCharts({
  statusCounts,
  byDay,
  funnel,
  lowest,
}: {
  statusCounts: Record<string, number>;
  byDay: Array<{ date: string; label: string; count: number }>;
  funnel: {
    publishedCount: number;
    eligibleCount: number;
    delivered: number;
    viewed: number;
    opened: number;
    acknowledged: number;
  };
  lowest: Array<{
    id: string;
    title: string;
    percent: number;
    percentViewed: number;
  }>;
}) {
  const statusData = Object.entries(statusCounts)
    .filter(([, value]) => value > 0)
    .map(([status, value]) => ({
      status,
      name: STATUS_LABELS[status] ?? status,
      value,
      fill: STATUS_COLORS[status] ?? ACCENT,
    }));

  const funnelData = [
    { name: "Receberam", value: funnel.delivered, fill: ACCENT },
    { name: "Visualizaram", value: funnel.viewed, fill: VIOLET },
    { name: "Abriram alerta", value: funnel.opened, fill: WARNING },
    { name: "Confirmaram", value: funnel.acknowledged, fill: SUCCESS },
  ];

  const engagementData = lowest.map((item) => ({
    name: item.title.length > 22 ? `${item.title.slice(0, 22)}…` : item.title,
    fullName: item.title,
    ciência: item.percent,
    visualização: item.percentViewed,
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Publicações nos últimos 14 dias" description="Volume diário (horário de Brasília).">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={byDay} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={MUTED} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#5c5270" }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#5c5270" }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "rgba(71,0,130,0.06)" }}
              contentStyle={{ borderRadius: 12, borderColor: MUTED, fontSize: 12 }}
              formatter={(value) => [value ?? 0, "Publicações"]}
            />
            <Bar dataKey="count" fill={ACCENT} radius={[6, 6, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Distribuição por status"
        description="Todos os comunicados no sistema."
        footer={
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-muted">
            {statusData.map((item) => (
              <li key={item.status} className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: item.fill }} aria-hidden />
                {item.name}: {item.value}
              </li>
            ))}
          </ul>
        }
      >
        {statusData.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-fg-muted">Sem dados ainda.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={88}
                paddingAngle={2}
              >
                {statusData.map((entry) => (
                  <Cell key={entry.status} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 12, borderColor: MUTED, fontSize: 12 }}
                formatter={(value, name) => [value ?? 0, String(name)]}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard
        title="Funil de engajamento"
        description={
          funnel.publishedCount === 0
            ? "Publique comunicados para ver o funil."
            : `Soma em ${funnel.publishedCount} publicado(s) · ${funnel.eligibleCount} usuários ativos elegíveis.`
        }
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={funnelData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={MUTED} horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#5c5270" }} axisLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              tick={{ fontSize: 11, fill: "#5c5270" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{ borderRadius: 12, borderColor: MUTED, fontSize: 12 }}
              formatter={(value) => [value ?? 0, "Eventos"]}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={22}>
              {funnelData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Ciência vs visualização"
        description="Comunicados com menor confirmação de ciência (% dos elegíveis)."
      >
        {engagementData.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-fg-muted">Nenhum publicado ainda.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={engagementData} margin={{ top: 8, right: 8, left: -8, bottom: 48 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={MUTED} vertical={false} />
              <XAxis
                dataKey="name"
                interval={0}
                angle={-25}
                textAnchor="end"
                height={60}
                tick={{ fontSize: 10, fill: "#5c5270" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 11, fill: "#5c5270" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ borderRadius: 12, borderColor: MUTED, fontSize: 12 }}
                formatter={(value, name) => [`${value ?? 0}%`, String(name)]}
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload as { fullName?: string } | undefined;
                  return row?.fullName ?? "";
                }}
              />
              <Bar dataKey="visualização" fill={VIOLET} radius={[4, 4, 0, 0]} maxBarSize={18} />
              <Bar dataKey="ciência" fill={ACCENT} radius={[4, 4, 0, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}
