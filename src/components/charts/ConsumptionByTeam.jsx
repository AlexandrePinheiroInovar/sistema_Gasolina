import { useMemo } from 'react';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const distanceFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const consumptionFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const ConsumptionByTeam = ({ data, darkMode }) => {
  const { rows, efficientTeams, inefficientTeams } = useMemo(() => {
    if (!data?.length) {
      return { rows: [], efficientTeams: new Set(), inefficientTeams: new Set() };
    }

    const aggregated = data.reduce((acc, item) => {
      const team = item.equipe || 'Não informado';
      if (!acc[team]) {
        acc[team] = {
          equipe: team,
          totalValor: 0,
          totalKm: 0,
          totalLitros: 0,
        };
      }
      acc[team].totalValor += item.valor || 0;
      acc[team].totalKm += item.kmRodados || 0;
      acc[team].totalLitros += item.litros || 0;
      return acc;
    }, {});

    const ranking = Object.values(aggregated)
      .map(team => ({
        ...team,
        consumoMedio: team.totalLitros > 0 ? team.totalKm / team.totalLitros : 0,
      }))
      .sort((a, b) => b.totalValor - a.totalValor);

    if (ranking.length === 1) {
      return {
        rows: ranking,
        efficientTeams: new Set([ranking[0].equipe]),
        inefficientTeams: new Set(),
      };
    }

    const sortedByConsumption = [...ranking].sort((a, b) => b.consumoMedio - a.consumoMedio);
    const quartileCount = Math.max(1, Math.round(sortedByConsumption.length * 0.25));

    const efficientTeams = new Set(
      sortedByConsumption.slice(0, quartileCount).map(team => team.equipe),
    );

    const inefficientTeams = new Set(
      sortedByConsumption.slice(-quartileCount).map(team => team.equipe),
    );

    return { rows: ranking, efficientTeams, inefficientTeams };
  }, [data]);

  const tableBorder = darkMode ? 'border-slate-700' : 'border-slate-200';
  const headerBg = darkMode ? 'bg-slate-800/60 text-slate-300' : 'bg-slate-50 text-slate-500';
  const rowBorder = darkMode ? 'border-slate-800/80' : 'border-slate-100';
  const neutralText = darkMode ? 'text-slate-200' : 'text-slate-600';
  const neutralHover = darkMode ? 'hover:bg-slate-800/70' : 'hover:bg-slate-100';

  const getRowVariant = teamName => {
    const isEfficient = efficientTeams.has(teamName);
    const isInefficient = inefficientTeams.has(teamName);

    if (isEfficient && isInefficient) {
      return 'efficient';
    }
    if (isEfficient) {
      return 'efficient';
    }
    if (isInefficient) {
      return 'inefficient';
    }
    return 'neutral';
  };

  const variantClasses = {
    efficient: darkMode
      ? 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    inefficient: darkMode
      ? 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
      : 'bg-rose-50 text-rose-700 hover:bg-rose-100',
    neutral: `${neutralText} ${neutralHover}`,
  };

  const getRowClasses = teamName => variantClasses[getRowVariant(teamName)];

  if (!rows.length) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        Nenhum dado disponível.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className={`overflow-x-auto rounded-xl border ${tableBorder}`}>
        <table className="min-w-full text-sm">
          <thead className={headerBg}>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Equipe</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide">Valor gasto (R$)</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide">Km rodados</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide">Consumo médio (km/L)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(team => (
              <tr
                key={team.equipe}
                className={`${getRowClasses(team.equipe)} border-b ${rowBorder} transition-colors`}
              >
                <td className="px-4 py-3 font-medium">{team.equipe}</td>
                <td className="px-4 py-3 text-right font-semibold">
                  {currencyFormatter.format(team.totalValor)}
                </td>
                <td className="px-4 py-3 text-right">
                  {`${distanceFormatter.format(team.totalKm)} km`}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {`${consumptionFormatter.format(team.consumoMedio)} km/L`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ConsumptionByTeam;
