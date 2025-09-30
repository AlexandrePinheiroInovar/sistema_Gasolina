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
  '#22c55e',
  '#3b82f6',
  '#8b5cf6',
  '#f59e0b',
  '#ef4444',
  '#14b8a6',
  '#0ea5e9',
  '#f97316',
];

const percentageFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const litersFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const ConsumptionBySector = ({ data, darkMode }) => {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    if (!data || data.length === 0) {
      setChartData(null);
      return;
    }

    const sectorData = data.reduce((acc, item) => {
      const sector = item.setor || 'Não informado';
      if (!acc[sector]) {
        acc[sector] = 0;
      }
      acc[sector] += item.litros || 0;
      return acc;
    }, {});

    const sectors = Object.keys(sectorData);
    const litros = sectors.map(sector => sectorData[sector]);
    const average = litros.length ? litros.reduce((sum, value) => sum + value, 0) / litros.length : 0;
    const variations = litros.map(value => (average ? ((value - average) / average) * 100 : 0));

    setChartData({
      labels: sectors,
      datasets: [
        {
          label: 'Litros Consumidos',
          data: litros,
          backgroundColor: palette.slice(0, sectors.length),
          borderColor: palette.slice(0, sectors.length),
          borderWidth: 1,
          borderRadius: 12,
          borderSkipped: false,
          hoverBackgroundColor: palette.slice(0, sectors.length).map(color => `${color}DD`),
          variations,
          datalabels: {
            display: true,
            color: '#e2e8f0',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            borderRadius: 8,
            padding: { top: 4, right: 8, bottom: 4, left: 8 },
            font: {
              weight: 'bold',
              size: 11
            },
            formatter: value => `${litersFormatter.format(value)} L`,
            anchor: 'end',
            align: 'end',
            offset: 6
          }
        }
      ]
    });
  }, [data]);

  const axisColor = darkMode ? '#cbd5f5' : '#334155';
  const gridColor = darkMode ? '#1f2937' : '#e2e8f0';

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: darkMode ? '#f8fafc' : '#0f172a',
        bodyColor: darkMode ? '#cbd5f5' : '#1f2937',
        borderColor: darkMode ? '#334155' : '#cbd5f5',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          label: context => `Litros: ${litersFormatter.format(context.parsed.y)} L`,
          afterLabel: context => {
            const variation = context.dataset.variations?.[context.dataIndex] ?? 0;
            const sign = variation > 0 ? '+' : '';
            return `Variação: ${sign}${percentageFormatter.format(variation)} vs média`;
          }
        }
      },
    },
    animation: {
      duration: 1200,
      easing: 'easeOutQuart'
    },
    scales: {
      x: {
        ticks: {
          color: axisColor,
          font: {
            size: 11
          }
        },
        grid: {
          color: gridColor,
          drawBorder: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: axisColor,
          font: {
            size: 11
          },
          callback: value => `${litersFormatter.format(value)} L`
        },
        grid: {
          color: gridColor,
          drawBorder: false,
        },
      },
    },
  };

  if (!chartData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-slate-400">Carregando gráfico...</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Bar data={chartData} options={options} updateMode="resize" />
    </div>
  );
};

export default ConsumptionBySector;
