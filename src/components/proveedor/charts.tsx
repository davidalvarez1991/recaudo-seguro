
"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useState } from 'react';

type ChartProps = {
    capitalData: { name: string, value: number, fill: string }[];
    portfolioData: { name: string, value: number, fill: string }[];
    hasPortfolioData: boolean;
};

const formatCurrency = (value: number) => {
    if (isNaN(value)) return "0";
    return value.toLocaleString('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
};

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 15) * cos;
  const my = cy + (outerRadius + 15) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 12;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} fontSize={14}>
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey} textAnchor={textAnchor} fill="#333" fontSize={12}>{`${value} Cliente(s)`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey} dy={16} textAnchor={textAnchor} fill="#999" fontSize={11}>
        {`(${(percent * 100).toFixed(1)}%)`}
      </text>
    </g>
  );
};


export function Charts({ capitalData, portfolioData, hasPortfolioData }: ChartProps) {
    const [activeIndex, setActiveIndex] = useState(0);

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index);
    };

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Distribución de Capital</CardTitle>
                    <CardDescription>Comparativo de tu capital total, el dinero activo en la calle y la ganancia que has recaudado.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={capitalData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <XAxis type="number" stroke="#888888" fontSize={12} tickFormatter={formatCurrency} />
                            <YAxis type="category" dataKey="name" stroke="#888888" fontSize={12} width={120} />
                            <Tooltip formatter={formatCurrency} cursor={{ fill: 'rgba(240, 240, 240, 0.5)' }} />
                            <Bar dataKey="value" barSize={35}>
                                {capitalData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Salud de la Cartera de Clientes</CardTitle>
                    <CardDescription>Proporción de clientes activos que están al día con sus pagos frente a los que presentan morosidad.</CardDescription>
                </CardHeader>
                <CardContent>
                    {hasPortfolioData ? (
                        <ResponsiveContainer width="100%" height={400}>
                            <PieChart margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
                                <Pie
                                    activeIndex={activeIndex}
                                    activeShape={renderActiveShape}
                                    data={portfolioData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    onMouseEnter={onPieEnter}
                                >
                                    {portfolioData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex justify-center items-center h-48 text-muted-foreground">
                            No hay datos de cartera de clientes para mostrar.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
