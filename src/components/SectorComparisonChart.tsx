import { useState } from 'react';
import { BarChart3, Radar as RadarIcon } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CompetencyComparisonItem } from '../lib/sectorBenchmarks';

interface SectorComparisonChartProps {
  items: CompetencyComparisonItem[];
  sectorName: string;
  skillScope: 'all' | 'self_assessed';
}

interface ChartDatum {
  name: string;
  fullName: string;
  current: number;
  target: number;
  delta: number;
}

function ComparisonTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: ChartDatum }>;
}) {
  if (!active || !payload || !payload[0]?.payload) return null;
  const d = payload[0].payload;
  const diffLabel =
    d.delta > 0 ? `+${d.delta}% above avg` : d.delta === 0 ? 'Meets sector avg' : `${d.delta}% vs avg`;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm text-xs">
      <p className="font-semibold text-[#0B1F3A]">{d.fullName}</p>
      <div className="mt-1.5 space-y-1 font-mono-tabular">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[#0B8A84]">Your Level:</span>
          <span className="font-bold text-[#0B1F3A]">{d.current}%</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[#475569]">Sector Avg Requirement:</span>
          <span className="font-bold text-[#0B1F3A]">{d.target}%</span>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-1">
          <span className="text-[#475569]">Difference:</span>
          <span className={`font-bold ${d.delta >= 0 ? 'text-[#16A34A]' : 'text-[#D97706]'}`}>
            {diffLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

export function SectorComparisonChart({
  items,
  sectorName,
  skillScope,
}: SectorComparisonChartProps) {
  const [chartType, setChartType] = useState<'radar' | 'bar'>('radar');

  const data: ChartDatum[] = items.map((item) => ({
    name: item.shortLabel,
    fullName: item.name,
    current: item.currentLevel,
    target: item.targetLevel,
    delta: item.delta,
  }));

  const currentLabel =
    skillScope === 'self_assessed' ? 'Self-Assessed Skills' : 'Your Current Skills';

  return (
    <div className="rounded-xl bg-[#F6F9FC] p-4 sm:p-5 flex flex-col justify-between h-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-sm font-bold text-[#0B1F3A]">
            {chartType === 'radar' ? 'Competency Radar vs. Sector Average' : 'Skill Gap Bar Comparison'}
          </h3>
          <p className="mt-0.5 text-[11px] text-[#475569]">
            {currentLabel} overlaid against {sectorName} averages
          </p>
        </div>

        <div
          className="inline-flex items-center gap-1 rounded-lg bg-white p-1"
          role="group"
          aria-label="Chart type selector"
        >
          <button
            type="button"
            onClick={() => setChartType('radar')}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              chartType === 'radar'
                ? 'bg-[#0B1F3A] text-white'
                : 'text-[#475569] hover:text-[#0B1F3A]'
            }`}
          >
            <RadarIcon className="h-3.5 w-3.5" />
            <span>RadarChart</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType('bar')}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              chartType === 'bar'
                ? 'bg-[#0B1F3A] text-white'
                : 'text-[#475569] hover:text-[#0B1F3A]'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>BarChart</span>
          </button>
        </div>
      </div>

      <div className="mt-4 h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'radar' ? (
            <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
              <PolarGrid stroke="#CBD5E1" />
              <PolarAngleAxis
                dataKey="name"
                tick={{ fill: '#0B1F3A', fontSize: 11, fontWeight: 500 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tickCount={5}
                tick={{ fill: '#64748B', fontSize: 10 }}
              />
              <Radar
                name="Sector Avg Requirement"
                dataKey="target"
                stroke="#0B1F3A"
                strokeWidth={2}
                strokeDasharray="4 4"
                fill="#0B1F3A"
                fillOpacity={0.08}
              />
              <Radar
                name={currentLabel}
                dataKey="current"
                stroke="#0FB5AE"
                strokeWidth={2.5}
                fill="#0FB5AE"
                fillOpacity={0.32}
              />
              <Tooltip content={<ComparisonTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            </RadarChart>
          ) : (
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
              barGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                unit="%"
                tick={{ fill: '#475569', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={108}
                tick={{ fill: '#0B1F3A', fontSize: 11, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ComparisonTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                dataKey="current"
                name={currentLabel}
                fill="#0FB5AE"
                radius={[0, 6, 6, 0]}
                barSize={11}
              />
              <Bar
                dataKey="target"
                name="Sector Avg Requirement"
                fill="#0B1F3A"
                radius={[0, 6, 6, 0]}
                barSize={11}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
