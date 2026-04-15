"use client";

import React, { useState, useMemo } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LabelList,
} from "recharts";

// ألوان مميزة لكل وردية مع لمسات ذهبية
const SHIFT_COLORS = ["#3b82f6", "#22c55e", "#8b5cf6", "#f59e0b", "#06b6d4", "#d4af37"];

function toMinutes(hhmm) {
  if (!hhmm || typeof hhmm !== "string" || !hhmm.includes(":")) return null;
  const [h, m] = hhmm.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

function isMinuteInsideShift(minute, start, end) {
  if (start === null || end === null) return false;
  if (start === end) return true;
  // overnight shift (example: 14:00 -> 01:00)
  if (end < start) return minute >= start || minute < end;
  return minute >= start && minute < end;
}

export default function DeviceStatsChart({ data = [], shifts = [], onFilterChange }) {
  const [activeFilter, setActiveFilter] = useState("today");

  const formattedData = useMemo(() => {
    const safeData = Array.isArray(data) ? data : [];

    return safeData.map((item, idx) => {
      const rawHour = item.hour || item.time || "";
      let displayValue = rawHour;
      let shiftIndex = null;

      if (activeFilter === "today" && rawHour.includes(":")) {
        const h = parseInt(rawHour.split(":")[0]);
        const period = h >= 12 ? "PM" : "AM";
        const converted = h % 12 || 12;
        displayValue = `${converted}${period}`;

        const minute = h * 60;
        const matchedShift = shifts.find((s) =>
          isMinuteInsideShift(minute, toMinutes(s.startTime), toMinutes(s.endTime)),
        );
        if (matchedShift?.index) {
          shiftIndex = Number(matchedShift.index);
        }
      }

      let barColor = "#3b82f6";
      if (activeFilter === "today" && shiftIndex) {
        barColor = SHIFT_COLORS[(shiftIndex - 1) % SHIFT_COLORS.length];
      } else if (activeFilter === "week" || activeFilter === "month") {
        barColor = SHIFT_COLORS[idx % SHIFT_COLORS.length];
      }
      return {
        ...item,
        rawHour,
        displayLabel: displayValue,
        cups: Number(item.cups) || 0,
        shiftIndex,
        barColor,
      };
    });
  }, [data, activeFilter, shifts]);

  const maxCups = useMemo(() => {
    const values = formattedData.map((d) => d.cups);
    const max = Math.max(...values, 0);
    return max < 5 ? 5 : max + 2;
  }, [formattedData]);

  const legendShifts = useMemo(() => {
    if (activeFilter !== "today") return [];
    const sorted = [...(Array.isArray(shifts) ? shifts : [])].sort(
      (a, b) => Number(a.index) - Number(b.index),
    );
    return sorted.map((s) => ({
      index: Number(s.index),
      color: SHIFT_COLORS[(Number(s.index) - 1) % SHIFT_COLORS.length],
      label: `Periode ${s.index}`,
    }));
  }, [activeFilter, shifts]);

  const renderTopLabel = (props) => {
    const { x, y, width, value } = props;
    if (!value || value <= 0) return null;
    return (
      <text
        x={x + width / 2}
        y={y - 6}
        textAnchor="middle"
        fill="#475569"
        fontSize={10}
        fontWeight={800}
      >
        {value}
      </text>
    );
  };

  return (
    <div className="flex flex-col h-full w-full font-tajawal">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-black text-slate-900">Activite de production</h3>
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          {["today", "week", "month"].map((f) => (
            <button
              key={f}
              onClick={() => {
                setActiveFilter(f);
                onFilterChange?.(f);
              }}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                activeFilter === f
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500"
              }`}
            >
              {f === "today" ? "Aujourd'hui" : f === "week" ? "Semaine" : "Mois"}
            </button>
          ))}
        </div>
      </div>

      {legendShifts.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {legendShifts.map((shift) => (
            <div
              key={shift.index}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm"
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: shift.color }}
              />
              <span className="text-[11px] font-bold text-slate-600">{shift.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="w-full h-[300px] min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={formattedData}
            margin={{ top: 22, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#cbd5e1"
            />
            <XAxis
              dataKey="displayLabel"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94a3b8" }}
              interval={activeFilter === "today" ? 1 : "preserveStartEnd"}
            />
            <YAxis
              domain={[0, maxCups]}
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94a3b8" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="cups"
              radius={[8, 8, 0, 0]}
              maxBarSize={28}
              animationDuration={1000}
            >
              {formattedData.map((entry, idx) => (
                <Cell key={`${entry.rawHour}-${idx}`} fill={entry.barColor} />
              ))}
              <LabelList dataKey="cups" content={renderTopLabel} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-slate-200">
        <p className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest border-b border-slate-200 pb-2">
          Journal horaire: {label}
        </p>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Coffee size={14} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 leading-none">
              {payload[0].value}
            </p>
            <p className="text-[10px] font-bold text-slate-500 mt-1">
              Tasses preparees
            </p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// أيقونة القهوة الصغيرة للـ Tooltip
const Coffee = ({ size, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
    <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
    <line x1="6" y1="2" x2="6" y2="4" />
    <line x1="10" y1="2" x2="10" y2="4" />
    <line x1="14" y1="2" x2="14" y2="4" />
  </svg>
);
