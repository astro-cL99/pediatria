import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

type ChartType = 'bar' | 'line' | 'pie' | 'area';

interface ChartData {
  [key: string]: string | number;
}

interface ChartProps {
  type: ChartType;
  data: ChartData[];
  xAxisKey: string;
  dataKeys: string[];
  colors?: string[];
  title?: string;
  height?: number;
  showLegend?: boolean;
  stacked?: boolean;
  gridStroke?: string;
}

const DEFAULT_COLORS = [
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff8042',
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
];

export function ResponsiveChart({
  type,
  data,
  xAxisKey,
  dataKeys,
  colors = DEFAULT_COLORS,
  title,
  height = 400,
  showLegend = true,
  stacked = false,
  gridStroke = '#f0f0f0',
}: ChartProps) {
  const chartComponent = useMemo(() => {
    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
    };

    const commonChildren = (
      <>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
        <XAxis dataKey={xAxisKey} />
        <YAxis />
        <Tooltip />
        {showLegend && <Legend />}
      </>
    );

    switch (type) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            {commonChildren}
            {dataKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[index % colors.length]}
                name={key}
                stackId={stacked ? 'stack' : undefined}
              />
            ))}
          </BarChart>
        );

      case 'line':
        return (
          <LineChart {...commonProps}>
            {commonChildren}
            {dataKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name={key}
              />
            ))}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {commonChildren}
            {dataKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                fill={`${colors[index % colors.length]}33`}
                fillOpacity={0.8}
                name={key}
                stackId={stacked ? 'stack' : undefined}
              />
            ))}
          </AreaChart>
        );

      case 'pie':
        return (
          <PieChart {...commonProps}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataKeys[0]}
              nameKey={xAxisKey}
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            {showLegend && <Legend />}
          </PieChart>
        );

      default:
        return null;
    }
  }, [type, data, xAxisKey, dataKeys, colors, showLegend, stacked, gridStroke]);

  return (
    <div className="w-full" style={{ height }}>
      {title && (
        <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height="100%">
        {chartComponent}
      </ResponsiveContainer>
    </div>
  );
}
