import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

const palette = [
  '#3b82f6',
  '#8b5cf6',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#14b8a6',
];

const percentageFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const litersFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const ConsumptionByRegion = ({ data, darkMode }) => {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    if (!data || data.length === 0) {
      setChartData(null);
      return;
    }

    const regionData = data.reduce((acc, item) => {
      const region = item.regiao || 'Não informado';
      if (!acc[region]) {
        acc[region] = 0;
      }
      acc[region] += item.litros || 0;
      return acc;
    }, {});

    const regions = Object.keys(regionData);
    const litros = regions.map(region => regionData[region]);
    const total = litros.reduce((sum, value) => sum + value, 0);
    const shares = litros.map(value => (total ? (value / total) * 100 : 0));
    const averageShare = shares.length ? 100 / shares.length : 0;
    const variations = shares.map(value => value - averageShare);

    setChartData({
      labels: regions,
      datasets: [
        {
          label: 'Litros por Região',
          data: litros,
          backgroundColor: palette.slice(0, regions.length),
          borderColor: darkMode ? '#0f172a' : '#f1f5f9',
          borderWidth: 3,
          cutout: '65%',
          variations,
          datalabels: {
            display: true,
            color: '#f8fafc',
            font: {
              weight: 'bold',
              size: 12
            },
            formatter: (value, context) => {
              const totalValue = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = totalValue ? (value / totalValue) * 100 : 0;
              return `${percentageFormatter.format(percentage)}%`;
            }
          }
        },
      ],
    });
  }, [data, darkMode]);

  const axisColor = darkMode ? '#cbd5f5' : '#1e293b';

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: axisColor,
          usePointStyle: true,
          padding: 16,
          font: {
            size: 12,
          },
          generateLabels: chart => {
            const { data } = chart;
            if (!data.labels?.length || !data.datasets?.length) {
              return [];
            }
            const dataset = data.datasets[0];
            const total = dataset.data.reduce((a, b) => a + b, 0);
            return data.labels.map((label, index) => {
              const value = dataset.data[index];
              const percentage = total ? (value / total) * 100 : 0;
              return {
                text: `${label} (${percentageFormatter.format(percentage)}%)`,
                fillStyle: dataset.backgroundColor[index],
                strokeStyle: dataset.borderColor,
                lineWidth: dataset.borderWidth,
                hidden: false,
                index
              };
            });
          }
        },
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
          label: context => {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total ? (context.parsed / total) * 100 : 0;
            return `${context.label}: ${litersFormatter.format(context.parsed)} L (${percentageFormatter.format(percentage)}%)`;
          },
          afterLabel: context => {
            const variation = context.dataset.variations?.[context.dataIndex] ?? 0;
            const sign = variation > 0 ? '+' : '';
            return `Variação: ${sign}${percentageFormatter.format(variation)} vs média`; 
          }
        }
      },
    },
    animation: {
      duration: 1400,
      easing: 'easeInOutQuart'
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
    <div className="h-full w-full">
      <Doughnut data={chartData} options={options} />
    </div>
  );
};

export default ConsumptionByRegion;
