import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Users } from 'lucide-react';

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

const TeamsRanking = ({ data, darkMode }) => {
  const rankedTeams = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Agregar dados por equipe
    const teamsMap = data.reduce((acc, item) => {
      const teamName = item.equipe || 'Não informado';

      if (!acc[teamName]) {
        acc[teamName] = {
          name: teamName,
          totalValue: 0,
          totalLiters: 0,
          totalKm: 0,
          count: 0
        };
      }

      acc[teamName].totalValue += item.valor || 0;
      acc[teamName].totalLiters += item.litros || 0;
      acc[teamName].totalKm += item.kmRodados || item.kmTotal || item.kmAtual || 0;
      acc[teamName].count += 1;

      return acc;
    }, {});

    // Converter para array e calcular km/L
    const teams = Object.values(teamsMap).map(team => ({
      ...team,
      avgKmPerLiter: team.totalLiters > 0 ? team.totalKm / team.totalLiters : 0
    }));

    // Ordenar por valor gasto (decrescente)
    const sorted = teams.sort((a, b) => b.totalValue - a.totalValue);

    // Calcular média de gasto e eficiência
    const avgValue = sorted.reduce((sum, t) => sum + t.totalValue, 0) / sorted.length;
    const avgEfficiency = sorted.reduce((sum, t) => sum + t.avgKmPerLiter, 0) / sorted.length;

    // Adicionar classificação (best/worst/normal) e ranking
    return sorted.map((team, index) => {
      const deviationPercent = avgValue > 0 ? ((team.totalValue - avgValue) / avgValue) * 100 : 0;
      const efficiencyDiff = team.avgKmPerLiter - avgEfficiency;

      let classification = 'normal';
      // Pior: alto gasto E baixa eficiência
      if (deviationPercent > 15 && efficiencyDiff < 0) {
        classification = 'worst';
      }
      // Melhor: baixo gasto OU alta eficiência
      else if (deviationPercent < -10 || efficiencyDiff > 1) {
        classification = 'best';
      }

      return {
        ...team,
        rank: index + 1,
        deviationPercent,
        efficiencyDiff,
        classification
      };
    });
  }, [data]);

  if (rankedTeams.length === 0) {
    return (
      <div className="flex items-center justify-center h-full py-12">
        <div className={`text-center ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
          <Users className="mx-auto h-12 w-12 mb-3 opacity-50" />
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
              Equipe
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
          {rankedTeams.map((team) => (
            <tr
              key={team.name}
              className={`transition-colors ${getRowClasses(team.classification)}`}
            >
              <td className="py-3 px-3">
                {getRankBadge(team.rank)}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${
                    darkMode ? 'text-slate-200' : 'text-gray-900'
                  }`}>
                    {team.name}
                  </span>
                </div>
                <div className={`text-xs ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                  {team.count} {team.count === 1 ? 'abastecimento' : 'abastecimentos'}
                </div>
              </td>
              <td className="py-3 px-4 text-right">
                <div className={`text-sm font-semibold ${getValueClasses(team.classification)}`}>
                  {currencyFormatter.format(team.totalValue)}
                </div>
              </td>
              <td className="py-3 px-4 text-right">
                <div className={`text-sm ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  {numberFormatter.format(team.totalKm)} km
                </div>
              </td>
              <td className="py-3 px-4 text-right">
                <div className={`text-sm font-medium ${
                  team.avgKmPerLiter >= 10 ? 'text-emerald-400' :
                  team.avgKmPerLiter >= 7 ? darkMode ? 'text-slate-300' : 'text-gray-700' :
                  'text-amber-400'
                }`}>
                  {kmPerLiterFormatter.format(team.avgKmPerLiter)} km/L
                </div>
              </td>
              <td className="py-3 px-4 text-center">
                {getDeviationIndicator(team.deviationPercent)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TeamsRanking;