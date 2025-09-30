import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Award } from 'lucide-react';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2
});

const numberFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

const kmPerLiterFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const DriversRanking = ({ data, darkMode, limit = 10 }) => {
  const rankedDrivers = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Agregar dados por condutor
    const driversMap = data.reduce((acc, item) => {
      const driverName = item.condutor || item.nome || 'Não informado';

      if (!acc[driverName]) {
        acc[driverName] = {
          name: driverName,
          totalValue: 0,
          totalLiters: 0,
          totalKm: 0,
          count: 0
        };
      }

      acc[driverName].totalValue += item.valor || 0;
      acc[driverName].totalLiters += item.litros || 0;
      acc[driverName].totalKm += item.kmRodados || item.kmTotal || item.kmAtual || 0;
      acc[driverName].count += 1;

      return acc;
    }, {});

    // Converter para array e calcular km/L
    const drivers = Object.values(driversMap).map(driver => ({
      ...driver,
      avgKmPerLiter: driver.totalLiters > 0 ? driver.totalKm / driver.totalLiters : 0
    }));

    // Ordenar por valor gasto (decrescente)
    const sorted = drivers.sort((a, b) => b.totalValue - a.totalValue);

    // Calcular média de gasto
    const avgValue = sorted.reduce((sum, d) => sum + d.totalValue, 0) / sorted.length;

    // Adicionar classificação (best/worst/normal) e ranking
    return sorted.slice(0, limit).map((driver, index) => {
      const deviationPercent = avgValue > 0 ? ((driver.totalValue - avgValue) / avgValue) * 100 : 0;

      let classification = 'normal';
      if (deviationPercent > 20) classification = 'worst';
      else if (deviationPercent < -10) classification = 'best';

      return {
        ...driver,
        rank: index + 1,
        deviationPercent,
        classification
      };
    });
  }, [data, limit]);

  if (rankedDrivers.length === 0) {
    return (
      <div className="flex items-center justify-center h-full py-12">
        <div className={`text-center ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
          <Award className="mx-auto h-12 w-12 mb-3 opacity-50" />
          <p className="text-sm">Nenhum dado disponível</p>
        </div>
      </div>
    );
  }

  const getRowClasses = (classification) => {
    if (classification === 'worst') {
      return darkMode
        ? 'bg-red-500/10 hover:bg-red-500/20 border-l-4 border-red-500'
        : 'bg-red-50 hover:bg-red-100 border-l-4 border-red-400';
    }
    if (classification === 'best') {
      return darkMode
        ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-l-4 border-emerald-500'
        : 'bg-emerald-50 hover:bg-emerald-100 border-l-4 border-emerald-400';
    }
    return darkMode
      ? 'hover:bg-slate-700/50'
      : 'hover:bg-gray-50';
  };

  const getValueClasses = (classification) => {
    if (classification === 'worst') {
      return 'text-red-400 font-bold';
    }
    if (classification === 'best') {
      return 'text-emerald-400 font-bold';
    }
    return darkMode ? 'text-slate-300' : 'text-gray-700';
  };

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 text-white font-bold text-sm shadow-lg">
          1
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 text-white font-bold text-sm shadow-lg">
          2
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white font-bold text-sm shadow-lg">
          3
        </div>
      );
    }
    return (
      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
        darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-600'
      } font-semibold text-sm`}>
        {rank}
      </div>
    );
  };

  const getDeviationIndicator = (deviationPercent) => {
    if (deviationPercent > 10) {
      return (
        <div className="flex items-center gap-1 text-red-400">
          <TrendingUp className="w-4 h-4" />
          <span className="text-xs font-semibold">+{deviationPercent.toFixed(1)}%</span>
        </div>
      );
    }
    if (deviationPercent < -10) {
      return (
        <div className="flex items-center gap-1 text-emerald-400">
          <TrendingDown className="w-4 h-4" />
          <span className="text-xs font-semibold">{deviationPercent.toFixed(1)}%</span>
        </div>
      );
    }
    return (
      <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>
        {deviationPercent > 0 ? '+' : ''}{deviationPercent.toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="w-full h-full overflow-auto">
      <table className="w-full">
        <thead className="sticky top-0 z-10">
          <tr className={`${darkMode ? 'bg-slate-800' : 'bg-gray-100'} border-b ${
            darkMode ? 'border-slate-700' : 'border-gray-200'
          }`}>
            <th className={`text-left text-xs font-semibold uppercase tracking-wider py-3 px-3 ${
              darkMode ? 'text-slate-400' : 'text-gray-600'
            }`}>
              #
            </th>
            <th className={`text-left text-xs font-semibold uppercase tracking-wider py-3 px-4 ${
              darkMode ? 'text-slate-400' : 'text-gray-600'
            }`}>
              Condutor
            </th>
            <th className={`text-right text-xs font-semibold uppercase tracking-wider py-3 px-4 ${
              darkMode ? 'text-slate-400' : 'text-gray-600'
            }`}>
              Gasto Total
            </th>
            <th className={`text-right text-xs font-semibold uppercase tracking-wider py-3 px-4 ${
              darkMode ? 'text-slate-400' : 'text-gray-600'
            }`}>
              KM Rodados
            </th>
            <th className={`text-right text-xs font-semibold uppercase tracking-wider py-3 px-4 ${
              darkMode ? 'text-slate-400' : 'text-gray-600'
            }`}>
              Consumo (km/L)
            </th>
            <th className={`text-center text-xs font-semibold uppercase tracking-wider py-3 px-4 ${
              darkMode ? 'text-slate-400' : 'text-gray-600'
            }`}>
              vs Média
            </th>
          </tr>
        </thead>
        <tbody className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-gray-200'}`}>
          {rankedDrivers.map((driver) => (
            <tr
              key={driver.name}
              className={`transition-colors ${getRowClasses(driver.classification)}`}
            >
              <td className="py-3 px-3">
                {getRankBadge(driver.rank)}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${
                    darkMode ? 'text-slate-200' : 'text-gray-900'
                  }`}>
                    {driver.name}
                  </span>
                  {driver.rank <= 3 && (
                    <Award className={`w-4 h-4 ${
                      driver.rank === 1 ? 'text-yellow-500' :
                      driver.rank === 2 ? 'text-gray-400' :
                      'text-orange-500'
                    }`} />
                  )}
                </div>
                <div className={`text-xs ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                  {driver.count} {driver.count === 1 ? 'abastecimento' : 'abastecimentos'}
                </div>
              </td>
              <td className="py-3 px-4 text-right">
                <div className={`text-sm font-semibold ${getValueClasses(driver.classification)}`}>
                  {currencyFormatter.format(driver.totalValue)}
                </div>
              </td>
              <td className="py-3 px-4 text-right">
                <div className={`text-sm ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  {numberFormatter.format(driver.totalKm)} km
                </div>
              </td>
              <td className="py-3 px-4 text-right">
                <div className={`text-sm font-medium ${
                  driver.avgKmPerLiter >= 10 ? 'text-emerald-400' :
                  driver.avgKmPerLiter >= 7 ? darkMode ? 'text-slate-300' : 'text-gray-700' :
                  'text-amber-400'
                }`}>
                  {kmPerLiterFormatter.format(driver.avgKmPerLiter)} km/L
                </div>
              </td>
              <td className="py-3 px-4 text-center">
                {getDeviationIndicator(driver.deviationPercent)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DriversRanking;