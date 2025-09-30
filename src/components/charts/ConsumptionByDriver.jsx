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

const litersFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const percentageFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const ConsumptionByDriver = ({ data, darkMode }) => {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    if (!data || data.length === 0) {
      setChartData(null);
      return;
    }

    const driverData = data.reduce((acc, item) => {
      const driver = item.condutor || item.nome || 'Não informado';
      if (!acc[driver]) {
        acc[driver] = 0;
      }
      acc[driver] += item.litros || 0;
      return acc;
    }, {});

    const drivers = Object.keys(driverData)
      .sort((a, b) => driverData[b] - driverData[a])
      .slice(0, 10);

    const litros = drivers.map(driver => driverData[driver]);
    const average = litros.length ? litros.reduce((sum, value) => sum + value, 0) / litros.length : 0;
    const variations = litros.map(value => (average ? ((value - average) / average) * 100 : 0));

    setChartData({
      labels: drivers.map(name => (name.length > 18 ? `${name.substring(0, 18)}…` : name)),
      datasets: [
        {
          label: 'Litros Consumidos',
          data: litros,
          backgroundColor: 'rgba(139, 92, 246, 0.85)',
          borderColor: 'rgba(139, 92, 246, 1)',
          borderWidth: 1,
          borderRadius: 12,
          borderSkipped: false,
          hoverBackgroundColor: 'rgba(139, 92, 246, 1)',
          variations,
          datalabels: {
            display: true,
            color: '#e2e8f0',
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
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
        },
      ],
    });
  }, [data]);

  const axisColor = darkMode ? '#cbd5f5' : '#1e293b';
  const gridColor = darkMode ? '#1f2937' : '#e2e8f0';

  const options = {
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
          label: context => `Litros: ${litersFormatter.format(context.parsed.y)} L`,
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
        ticks: {
          color: axisColor,
          maxRotation: 45,
        },
        grid: {
          color: gridColor,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: axisColor,
          callback: value => `${litersFormatter.format(value)} L`
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

export default ConsumptionByDriver;
