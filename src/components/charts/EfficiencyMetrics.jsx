import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const kmFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const percentageFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const EfficiencyMetrics = ({ data, darkMode }) => {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    if (!data || data.length === 0) {
      setChartData(null);
      return;
    }

    const processedData = data
      .map(item => {
        const km = item.kmRodados || item.kmTotal || item.kmAtual || 0;
        const litros = item.litros || item.totalLitros || 0;
        const valor = item.valor || item.totalValor || 0;
        return {
          date: item.data ? new Date(item.data) : new Date(),
          kmLitro: litros > 0 ? km / litros : 0,
          custoPorKm: km > 0 ? valor / km : 0,
        };
      })
      .sort((a, b) => a.date - b.date)
      .slice(-30);

    if (!processedData.length) {
      setChartData(null);
      return;
    }

    const labels = processedData.map((item, index) => item.date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) || `Registro ${index + 1}`);
    const kmLitroData = processedData.map(item => Number(item.kmLitro.toFixed(2)));
    const custoPorKmData = processedData.map(item => Number(item.custoPorKm.toFixed(3)));

    const kmVariations = kmLitroData.map((value, index) => {
      const previous = index === 0 ? value : kmLitroData[index - 1];
      return previous ? ((value - previous) / previous) * 100 : 0;
    });

    const custoVariations = custoPorKmData.map((value, index) => {
      const previous = index === 0 ? value : custoPorKmData[index - 1];
      return previous ? ((value - previous) / previous) * 100 : 0;
    });

    setChartData({
      labels,
      datasets: [
        {
          label: 'KM/Litro',
          data: kmLitroData,
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.15)',
          pointBackgroundColor: '#22c55e',
          pointBorderColor: '#0f172a',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.35,
          yAxisID: 'y',
          variations: kmVariations,
          datalabels: {
            display: true,
            color: '#22c55e',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderRadius: 8,
            padding: { top: 4, right: 8, bottom: 4, left: 8 },
            font: {
              weight: 600,
              size: 10
            },
            align: 'top',
            formatter: value => `${kmFormatter.format(value)} km/L`
          }
        },
        {
          label: 'Custo por KM (R$)',
          data: custoPorKmData,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          pointBackgroundColor: '#ef4444',
          pointBorderColor: '#0f172a',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.35,
          yAxisID: 'y1',
          variations: custoVariations,
          datalabels: {
            display: true,
            color: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            borderRadius: 8,
            padding: { top: 4, right: 8, bottom: 4, left: 8 },
            font: {
              weight: 600,
              size: 10
            },
            align: 'bottom',
            formatter: value => currencyFormatter.format(value)
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
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: axisColor,
          usePointStyle: true,
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
            if (context.datasetIndex === 0) {
              return `KM/L: ${kmFormatter.format(context.parsed.y)}`;
            }
            return `Custo por KM: ${currencyFormatter.format(context.parsed.y)}`;
          },
          afterLabel: context => {
            const variation = context.dataset.variations?.[context.dataIndex] ?? 0;
            const sign = variation > 0 ? '+' : '';
            return `Variação: ${sign}${percentageFormatter.format(variation)} vs ponto anterior`;
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
        type: 'linear',
        display: true,
        position: 'left',
        ticks: {
          color: axisColor,
          callback: value => `${kmFormatter.format(value)} km/L`
        },
        grid: {
          color: gridColor,
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        ticks: {
          color: axisColor,
          callback: value => currencyFormatter.format(value)
        },
        grid: {
          drawOnChartArea: false,
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
      <Line data={chartData} options={options} updateMode="resize" />
    </div>
  );
};

export default EfficiencyMetrics;
