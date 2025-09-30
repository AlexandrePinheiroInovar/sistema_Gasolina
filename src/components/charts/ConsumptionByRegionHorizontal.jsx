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
  '#3b82f6',  // blue
  '#8b5cf6',  // purple
  '#22c55e',  // green
  '#f59e0b',  // amber
  '#ef4444',  // red
  '#14b8a6',  // teal
  '#0ea5e9',  // sky
  '#f97316',  // orange
];

const percentageFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const litersFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const ConsumptionByRegionHorizontal = ({ data, darkMode }) => {
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

    // Ordenar regiões por consumo (decrescente)
    const sortedEntries = Object.entries(regionData).sort((a, b) => b[1] - a[1]);
    const regions = sortedEntries.map(([region]) => region);
    const litros = sortedEntries.map(([, value]) => value);

    const average = litros.length ? litros.reduce((sum, value) => sum + value, 0) / litros.length : 0;
    const variations = litros.map(value => (average ? ((value - average) / average) * 100 : 0));

    // Cores baseadas na variação (acima/abaixo da média)
    const backgroundColors = variations.map((variation, index) => {
      if (variation > 15) return '#ef4444';  // red (alto consumo)
      if (variation < -15) return '#22c55e';  // green (baixo consumo)
      return palette[index % palette.length];  // cores neutras
    });

    setChartData({
      labels: regions,
      datasets: [
        {
          label: 'Litros Consumidos',
          data: litros,
          backgroundColor: backgroundColors.map(c => `${c}DD`),
          borderColor: backgroundColors,
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
          hoverBackgroundColor: backgroundColors,
          variations,
          datalabels: {
            display: true,
            color: '#ffffff',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            borderRadius: 6,
            padding: { top: 3, right: 6, bottom: 3, left: 6 },
            font: {
              weight: 'bold',
              size: 11
            },
            formatter: value => `${litersFormatter.format(value)} L`,
            anchor: 'end',
            align: 'end',
            offset: 4
          }
        }
      ]
    });
  }, [data]);

  const axisColor = darkMode ? '#cbd5f5' : '#334155';
  const gridColor = darkMode ? '#1f2937' : '#e2e8f0';

  const options = {
    indexAxis: 'y',  // Barras horizontais
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
          label: context => `Consumo: ${litersFormatter.format(context.parsed.x)} L`,
          afterLabel: context => {
            const variation = context.dataset.variations?.[context.dataIndex] ?? 0;
            const sign = variation > 0 ? '+' : '';
            return `Variação: ${sign}${percentageFormatter.format(variation)}% vs média`;
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
      y: {
        ticks: {
          color: axisColor,
          font: {
            size: 11
          }
        },
        grid: {
          display: false,
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

export default ConsumptionByRegionHorizontal;