import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const palette = [
  '#3b82f6',
  '#8b5cf6',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#14b8a6',
  '#0ea5e9',
  '#f97316',
];

const percentageFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const litersFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const ConsumptionBySupervisorHorizontal = ({ data, darkMode }) => {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    if (!data || data.length === 0) {
      setChartData(null);
      return;
    }

    const supervisorData = data.reduce((acc, item) => {
      const supervisor = item.supervisor || 'Não informado';
      if (!acc[supervisor]) {
        acc[supervisor] = 0;
      }
      acc[supervisor] += item.litros || 0;
      return acc;
    }, {});

    const sortedSupervisors = Object.entries(supervisorData)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);

    const supervisors = sortedSupervisors.map(([name]) => name);
    const litros = sortedSupervisors.map(([, value]) => value);
    const average = litros.length ? litros.reduce((sum, value) => sum + value, 0) / litros.length : 0;
    const variations = litros.map(value => (average ? ((value - average) / average) * 100 : 0));

    setChartData({
      labels: supervisors,
      datasets: [
        {
          label: 'Litros por Supervisor',
          data: litros,
          backgroundColor: palette.slice(0, supervisors.length),
          borderColor: palette.slice(0, supervisors.length),
          borderWidth: 1,
          borderRadius: 12,
          borderSkipped: false,
          hoverBackgroundColor: palette.slice(0, supervisors.length).map(color => `${color}DD`),
          variations,
          datalabels: {
            display: true,
            color: '#0f172a',
            backgroundColor: '#f8fafc',
            borderRadius: 8,
            padding: { top: 4, right: 8, bottom: 4, left: 8 },
            font: {
              weight: 600,
              size: 11
            },
            formatter: value => `${litersFormatter.format(value)} L`,
            anchor: 'center',
            align: 'center'
          }
        },
      ],
    });
  }, [data]);

  const axisColor = darkMode ? '#cbd5f5' : '#1e293b';
  const gridColor = darkMode ? '#1f2937' : '#e2e8f0';

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: darkMode ? '#f8fafc' : '#0f172a',
        bodyColor: darkMode ? '#cbd5f5' : '#1e293b',
        borderColor: darkMode ? '#334155' : '#cbd5f5',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
        callbacks: {
          label: context => `Litros: ${litersFormatter.format(context.parsed.x)} L`,
          afterLabel: context => {
            const variation = context.dataset.variations?.[context.dataIndex] ?? 0;
            const sign = variation > 0 ? '+' : '';
            return `Variação: ${sign}${percentageFormatter.format(variation)} vs média`;
          }
        }
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          color: axisColor,
          callback: value => `${litersFormatter.format(value)} L`
        },
        grid: {
          color: gridColor,
        },
      },
      y: {
        ticks: {
          color: axisColor,
          font: {
            size: 11
          }
        },
        grid: {
          color: gridColor,
        },
      },
    },
    animation: {
      duration: 1200,
      easing: 'easeOutQuart'
    }
  };

  if (!chartData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-slate-400">Carregando gráfico...</div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <Bar data={chartData} options={options} updateMode="resize" />
    </div>
  );
};

export default ConsumptionBySupervisorHorizontal;
