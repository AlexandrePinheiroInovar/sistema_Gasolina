import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import ConsumptionBySector from '../components/charts/ConsumptionBySector';
import ConsumptionByDriver from '../components/charts/ConsumptionByDriver';
import ConsumptionBySupervisorHorizontal from '../components/charts/ConsumptionBySupervisorHorizontal';
import ConsumptionByTeam from '../components/charts/ConsumptionByTeam';
import ConsumptionByRegion from '../components/charts/ConsumptionByRegion';
import EfficiencyMetrics from '../components/charts/EfficiencyMetrics';
import { mockFuelData } from '../data/mockData';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  Filter,
  Fuel,
  CalendarDays,
  DollarSign,
  TrendingUp,
  BarChart3,
  X,
  Upload,
  FileText,
  CheckCircle,
  Clock,
  History,
  Eye,
  Users,
  UserCheck,
  Layers,
  Globe2,
  LineChart,
  Award,
  XCircle,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const litersFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const kmFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const currencyFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const integerFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

const formatLiters = (value = 0) => `${litersFormatter.format(value)} L`;
const formatKmPerLiter = (value = 0) => `${kmFormatter.format(value)} km/L`;
const formatCurrency = (value = 0) => `R$ ${currencyFormatter.format(value)}`;
const percentageFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const formatPercentage = (value = 0) => `${percentageFormatter.format(value)}%`;
const formatInteger = (value = 0) => integerFormatter.format(value);
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
         ' às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const normalizeStringValue = (value = '') => (value === null || value === undefined ? '' : value.toString().trim());

const parseLocaleNumberValue = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const str = normalizeStringValue(value);
  if (!str || str === '-') {
    return 0;
  }
  const cleaned = str
    .replace(/\s+/g, '')
    .replace(/\./g, '')
    .replace(/[^0-9,-]/g, '')
    .replace(',', '.');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseCurrencyValue = parseLocaleNumberValue;

const normalizePlateValue = (value = '') => {
  const str = normalizeStringValue(value).toUpperCase();
  if (!str) {
    return '';
  }
  const mercosulMatch = str.match(/([A-Z]{3}[0-9][A-Z0-9][0-9]{2})/);
  if (mercosulMatch) {
    return mercosulMatch[1];
  }
  const fallback = str.replace(/[^A-Z0-9]/g, '');
  if (fallback.length >= 7) {
    return fallback.slice(-7);
  }
  return fallback;
};

const extractIdentificationDetails = (identification = '') => {
  const info = normalizeStringValue(identification);
  if (!info) {
    return { plate: '', vehicle: '' };
  }
  const parts = info.split('|').map(part => part.trim()).filter(Boolean);
  const vehicle = parts.length ? parts[0] : '';
  const plateFromLabel = info.match(/Placa\s*-\s*([A-Z0-9]+)/i);
  if (plateFromLabel) {
    return { plate: normalizePlateValue(plateFromLabel[1]), vehicle };
  }
  const mercosulMatch = info.match(/([A-Z]{3}[0-9][A-Z0-9][0-9]{2})/i);
  if (mercosulMatch) {
    const plate = normalizePlateValue(mercosulMatch[1]);
    return { plate, vehicle: vehicle === mercosulMatch[1] ? '' : vehicle };
  }
  const fallback = normalizePlateValue(info);
  return { plate: fallback, vehicle: vehicle === fallback ? '' : vehicle };
};

const UF_TO_REGION = {
  AC: 'Norte',
  AL: 'Nordeste',
  AP: 'Norte',
  AM: 'Norte',
  BA: 'Nordeste',
  CE: 'Nordeste',
  DF: 'Centro-Oeste',
  ES: 'Sudeste',
  GO: 'Centro-Oeste',
  MA: 'Nordeste',
  MT: 'Centro-Oeste',
  MS: 'Centro-Oeste',
  MG: 'Sudeste',
  PA: 'Norte',
  PB: 'Nordeste',
  PR: 'Sul',
  PE: 'Nordeste',
  PI: 'Nordeste',
  RJ: 'Sudeste',
  RN: 'Nordeste',
  RS: 'Sul',
  RO: 'Norte',
  RR: 'Norte',
  SC: 'Sul',
  SP: 'Sudeste',
  SE: 'Nordeste',
  TO: 'Norte'
};

const mapUfToRegion = (uf = '') => UF_TO_REGION[uf.toUpperCase()] || 'Não informado';

const normalizeDateValue = (value) => {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (!value && value !== 0) {
    return '';
  }
  if (typeof value === 'number') {
    const dateFromNumber = new Date(value);
    if (!Number.isNaN(dateFromNumber.getTime())) {
      return dateFromNumber.toISOString();
    }
  }
  const str = normalizeStringValue(value);
  if (!str) {
    return '';
  }
  if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
    return str;
  }
  if (/^\d{4}-\d{2}-\d{2}\s/.test(str)) {
    const converted = new Date(str.replace(' ', 'T'));
    if (!Number.isNaN(converted.getTime())) {
      return converted.toISOString();
    }
  }
  if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) {
    const [datePart, timePart = '00:00:00'] = str.split(/\s+/);
    const [day, month, year] = datePart.split('/');
    const candidate = new Date(`${year}-${month}-${day}T${timePart}`);
    if (!Number.isNaN(candidate.getTime())) {
      return candidate.toISOString();
    }
  }
  const fallback = new Date(str);
  if (!Number.isNaN(fallback.getTime())) {
    return fallback.toISOString();
  }
  return '';
};

const buildDashboardDataset = (driverDocs = [], maxifrotaDocs = [], ticketDocs = []) => {
  const driversByPlate = new Map();
  const driversByCondutor = new Map();

  driverDocs.forEach(doc => {
    const identificacaoInfo = extractIdentificationDetails(doc.identificacao || doc.identification || '');
    const plate = normalizePlateValue(doc.placa || identificacaoInfo.plate);
    const condutor = normalizeStringValue(doc.condutor);
    const record = {
      condutor,
      segmento: normalizeStringValue(doc.segmento),
      credenciado: normalizeStringValue(doc.credenciado),
      municipio: normalizeStringValue(doc.municipio),
      uf: normalizeStringValue(doc.uf),
      valor: parseCurrencyValue(doc.valor ?? doc.valorOriginal),
      veiculo: normalizeStringValue(doc.veiculo || identificacaoInfo.vehicle),
      dataHora: normalizeDateValue(doc.dataHora)
    };

    if (plate) {
      driversByPlate.set(plate, record);
    }
    if (condutor) {
      driversByCondutor.set(condutor.toLowerCase(), { ...record, plate });
    }
  });

  const ticketByPlate = new Map();
  ticketDocs.forEach(doc => {
    const plate = normalizePlateValue(doc.placa || doc.placaOriginal);
    if (!plate) return;
    const litros = parseLocaleNumberValue(doc.litros);
    const kmRodados = parseLocaleNumberValue(doc.kmRodados || doc.kmTotal);
    const kmPorLitro = parseLocaleNumberValue(doc.kmPorLitro) || (litros ? kmRodados / (litros || 1) : 0);
    const totalTransacao = parseCurrencyValue(doc.totalTransacao ?? doc.totalTransacaoOriginal ?? doc.cartaoValor);
    ticketByPlate.set(plate, {
      litros,
      kmRodados,
      kmPorLitro,
      totalTransacao,
      periodo: normalizeStringValue(doc.periodo)
    });
  });

  const dataset = [];
  const platesWithData = new Set();

  maxifrotaDocs.forEach(doc => {
    const identificacaoInfo = extractIdentificationDetails(doc.identificacao || doc.identification || '');
    let plate = normalizePlateValue(doc.placa || identificacaoInfo.plate);
    const condutor = normalizeStringValue(doc.condutor);
    const driverInfo = plate ? driversByPlate.get(plate) : driversByCondutor.get(condutor.toLowerCase());
    if (!plate && driverInfo?.plate) {
      plate = driverInfo.plate;
    }
    if (!plate) {
      return;
    }

    const litros = parseLocaleNumberValue(doc.quantidade ?? doc.litros);
    const valor = parseCurrencyValue(
      doc.valorTotal ?? doc.valorTotalOriginal ?? doc.valorTransacao ?? doc.valorLiquido ?? doc.valorLiquidoOriginal
    );
    let kmRodados = parseLocaleNumberValue(doc.kmRodados ?? doc.usoKm ?? doc.kmOdometro);
    const ticketInfo = ticketByPlate.get(plate);
    if ((!kmRodados || kmRodados === 0) && ticketInfo) {
      if (ticketInfo.kmPorLitro && litros) {
        kmRodados = ticketInfo.kmPorLitro * litros;
      } else if (ticketInfo.kmRodados) {
        kmRodados = ticketInfo.kmRodados;
      }
    }

    const veiculo = normalizeStringValue(doc.veiculo || identificacaoInfo.vehicle || driverInfo?.veiculo);
    const dataIso = normalizeDateValue(doc.dataHora);

    dataset.push({
      id: `maxifrota-${doc.id || `${plate}-${condutor}-${dataIso}`}`,
      data: dataIso || new Date().toISOString(),
      condutor: driverInfo?.condutor || condutor || 'Não informado',
      setor: driverInfo?.segmento || normalizeStringValue(doc.centroCusto) || 'Não informado',
      supervisor: 'Não informado',
      equipe: driverInfo?.segmento || normalizeStringValue(doc.centroCusto) || 'Equipe não informada',
      regiao: driverInfo?.uf ? mapUfToRegion(driverInfo.uf) : 'Não informado',
      litros,
      valor,
      kmRodados,
      veiculo,
      placa: plate,
      municipio: driverInfo?.municipio || '',
      uf: driverInfo?.uf || '',
      posto: driverInfo?.credenciado || '',
      fonte: 'maxifrota',
      periodo: ticketInfo?.periodo || ''
    });

    platesWithData.add(plate);
  });

  ticketByPlate.forEach((ticketInfo, plate) => {
    if (platesWithData.has(plate)) {
      return;
    }
    const driverInfo = driversByPlate.get(plate);
    dataset.push({
      id: `ticket-${plate}`,
      data: new Date().toISOString(),
      condutor: driverInfo?.condutor || 'Não informado',
      setor: driverInfo?.segmento || 'Não informado',
      supervisor: 'Não informado',
      equipe: driverInfo?.segmento || 'Equipe não informada',
      regiao: driverInfo?.uf ? mapUfToRegion(driverInfo.uf) : 'Não informado',
      litros: ticketInfo.litros,
      valor: ticketInfo.totalTransacao,
      kmRodados: ticketInfo.kmRodados,
      veiculo: driverInfo?.veiculo || '',
      placa: plate,
      municipio: driverInfo?.municipio || '',
      uf: driverInfo?.uf || '',
      posto: driverInfo?.credenciado || '',
      fonte: 'ticketlog',
      periodo: ticketInfo.periodo
    });
    platesWithData.add(plate);
  });

  driversByPlate.forEach((driverInfo, plate) => {
    if (platesWithData.has(plate)) {
      return;
    }
    dataset.push({
      id: `condutor-${plate}`,
      data: driverInfo.dataHora || new Date().toISOString(),
      condutor: driverInfo.condutor || 'Não informado',
      setor: driverInfo.segmento || 'Não informado',
      supervisor: 'Não informado',
      equipe: driverInfo.segmento || 'Equipe não informada',
      regiao: driverInfo.uf ? mapUfToRegion(driverInfo.uf) : 'Não informado',
      litros: 0,
      valor: driverInfo.valor || 0,
      kmRodados: 0,
      veiculo: driverInfo.veiculo || '',
      placa: plate,
      municipio: driverInfo.municipio || '',
      uf: driverInfo.uf || '',
      posto: driverInfo.credenciado || '',
      fonte: 'condutor',
      periodo: ''
    });
  });

  dataset.sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0));
  return dataset;
};

const computeMetricTrends = (collection = []) => {
  if (!collection.length) {
    return {
      totalLitros: { current: 0, change: 0 },
      totalValor: { current: 0, change: 0 },
      ticketMedio: { current: 0, change: 0 },
      avgKmLitro: { current: 0, change: 0 },
      avgCustoPorKm: { current: 0, change: 0 },
      totalTransacoes: { current: 0, change: 0 },
    };
  }

  const sorted = [...collection].sort((a, b) => new Date(a.data || 0) - new Date(b.data || 0));
  const splitIndex = Math.max(1, Math.floor(sorted.length / 2));
  let previousSlice = sorted.slice(0, splitIndex);
  let currentSlice = sorted.slice(splitIndex);

  if (!currentSlice.length) {
    currentSlice = previousSlice;
    previousSlice = [];
  }

  const sumBy = (items, selector) => items.reduce((sum, item) => sum + selector(item), 0);
  const averageBy = (items, selector) => {
    if (!items.length) return 0;
    const total = items.reduce((acc, item) => acc + selector(item), 0);
    return total / items.length;
  };

  const computeKmLitro = (item) => {
    const litros = item.litros || 0;
    return litros > 0 ? (item.kmRodados || 0) / litros : 0;
  };

  const computeCustoPorKm = (item) => {
    const km = item.kmRodados || 0;
    return km > 0 ? (item.valor || 0) / km : 0;
  };

  const values = {
    totalLitros: {
      current: sumBy(currentSlice, item => item.litros || 0),
      previous: sumBy(previousSlice, item => item.litros || 0),
    },
    totalValor: {
      current: sumBy(currentSlice, item => item.valor || 0),
      previous: sumBy(previousSlice, item => item.valor || 0),
    },
    ticketMedio: {
      current: averageBy(currentSlice, item => item.valor || 0),
      previous: averageBy(previousSlice, item => item.valor || 0),
    },
    avgKmLitro: {
      current: averageBy(currentSlice, computeKmLitro),
      previous: averageBy(previousSlice, computeKmLitro),
    },
    avgCustoPorKm: {
      current: averageBy(currentSlice, computeCustoPorKm),
      previous: averageBy(previousSlice, computeCustoPorKm),
    },
    totalTransacoes: {
      current: currentSlice.length,
      previous: previousSlice.length,
    },
  };

  const calcChange = (current, previous) => {
    if (!Number.isFinite(previous) || previous === 0) {
      return 0;
    }
    return ((current - previous) / Math.abs(previous)) * 100;
  };

  return Object.fromEntries(
    Object.entries(values).map(([key, { current, previous }]) => [
      key,
      {
        current,
        change: calcChange(current, previous),
      },
    ]),
  );
};

const computeGroupSummary = (collection = [], key) => {
  if (!collection.length) {
    return { value: 0, label: 'Sem dados', change: 0 };
  }

  const aggregated = collection.reduce((acc, item) => {
    const groupKey = item[key] || 'Não informado';
    const litros = item.litros || 0;
    acc[groupKey] = (acc[groupKey] || 0) + litros;
    return acc;
  }, {});

  const entries = Object.entries(aggregated);
  if (!entries.length) {
    return { value: 0, label: 'Sem dados', change: 0 };
  }

  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  entries.sort((a, b) => b[1] - a[1]);
  const [label, value] = entries[0];
  const average = total / entries.length || 0;
  const change = average ? ((value - average) / average) * 100 : 0;

  return { value, label, change };
};

const computeTopDriverSummary = (collection = []) => {
  if (!collection.length) {
    return { value: 0, label: 'Sem dados', change: 0 };
  }

  const aggregated = collection.reduce((acc, item) => {
    const driver = item.condutor || item.nome || 'Não informado';
    const litros = item.litros || 0;
    acc[driver] = (acc[driver] || 0) + litros;
    return acc;
  }, {});

  const entries = Object.entries(aggregated).sort((a, b) => b[1] - a[1]).slice(0, 10);
  if (!entries.length) {
    return { value: 0, label: 'Sem dados', change: 0 };
  }

  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  const average = total / entries.length || 0;
  const [label, value] = entries[0];
  const change = average ? ((value - average) / average) * 100 : 0;

  return { value, label, change };
};

const computeEfficiencySummary = (collection = []) => {
  if (!collection.length) {
    return { value: 0, label: 'Sem dados', change: 0, helper: 'Sem registros suficientes' };
  }

  const sorted = [...collection]
    .filter(item => (item.kmRodados || item.kmTotal || item.kmAtual) && item.litros)
    .sort((a, b) => new Date(a.data) - new Date(b.data));

  if (!sorted.length) {
    return { value: 0, label: 'Sem dados', change: 0, helper: 'Sem registros suficientes' };
  }

  const ratios = sorted.map(item => {
    const km = item.kmRodados || item.kmTotal || item.kmAtual || 0;
    const litros = item.litros || 0;
    return litros > 0 ? km / litros : 0;
  });

  const latest = ratios[ratios.length - 1] || 0;
  const previous = ratios[ratios.length - 2] || ratios[ratios.length - 1] || 0;
  const change = previous ? ((latest - previous) / previous) * 100 : 0;
  const helper = sorted.length ? `Último registro: ${new Date(sorted[sorted.length - 1].data).toLocaleDateString('pt-BR')}` : '';

  return { value: latest, label: 'Eficiência média', change, helper };
};

const Dashboard = () => {
  const [data, setData] = useState(mockFuelData);
  const [filteredData, setFilteredData] = useState(mockFuelData);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    setor: '',
    condutor: '',
    placa: '',
    supervisor: ''
  });
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const { darkMode } = useTheme();
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const [importHistory] = useState([
    {
      id: 1,
      type: 'Condutor',
      date: '2024-01-15T14:30:00',
      status: 'success',
      records: 124,
      fileName: 'relatorio_condutor_jan24.xlsx'
    },
    {
      id: 2,
      type: 'Maxi Frota',
      date: '2024-01-14T09:15:00',
      status: 'error',
      records: 0,
      fileName: 'maxi_frota_jan24.xlsx',
      error: 'Formato de arquivo inválido'
    },
    {
      id: 3,
      type: 'Ticket Log',
      date: '2024-01-13T16:45:00',
      status: 'success',
      records: 89,
      fileName: 'ticket_log_jan24.xlsx'
    },
    {
      id: 4,
      type: 'Condutor',
      date: '2024-01-12T11:20:00',
      status: 'pending',
      records: 0,
      fileName: 'relatorio_condutor_dez23.xlsx'
    },
    {
      id: 5,
      type: 'Maxi Frota',
      date: '2024-01-10T15:30:00',
      status: 'success',
      records: 156,
      fileName: 'maxi_frota_dez23.xlsx'
    }
  ]);

  useEffect(() => {
    let isMounted = true;

    const loadReports = async () => {
      setDataLoading(true);
      setDataError('');
      try {
        const [driverSnapshot, maxiSnapshot, ticketSnapshot] = await Promise.all([
          getDocs(collection(db, 'driverReports')),
          getDocs(collection(db, 'maxifrotaReports')),
          getDocs(collection(db, 'ticketlogReports'))
        ]);

        if (!isMounted) {
          return;
        }

        const driverDocs = driverSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const maxiDocs = maxiSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const ticketDocs = ticketSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const hasNoData = driverSnapshot.empty && maxiSnapshot.empty && ticketSnapshot.empty;
        const integrated = buildDashboardDataset(driverDocs, maxiDocs, ticketDocs);

        if (integrated.length) {
          setData(integrated);
          setDataError('');
        } else {
          setData(mockFuelData);
          setDataError(hasNoData
            ? 'Nenhum dado importado encontrado. Exibindo dados de demonstração.'
            : 'Os dados importados não puderam ser consolidados. Verifique os templates.');
        }
      } catch (error) {
        console.error('Erro ao carregar dados do Firestore:', error);
        if (isMounted) {
          setData(mockFuelData);
          setDataError('Não foi possível carregar dados reais. Exibindo dados de demonstração.');
        }
      } finally {
        if (isMounted) {
          setDataLoading(false);
        }
      }
    };

    loadReports();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [data, filters]);

  const applyFilters = () => {
    let filtered = [...data];

    if (filters.startDate) {
      filtered = filtered.filter(item => item.data >= filters.startDate);
    }
    if (filters.endDate) {
      filtered = filtered.filter(item => item.data <= filters.endDate);
    }
    if (filters.setor) {
      filtered = filtered.filter(item =>
        item.setor?.toLowerCase().includes(filters.setor.toLowerCase())
      );
    }
    if (filters.condutor) {
      filtered = filtered.filter(item =>
        item.condutor?.toLowerCase().includes(filters.condutor.toLowerCase())
      );
    }
    if (filters.placa) {
      filtered = filtered.filter(item =>
        item.placa?.toLowerCase().includes(filters.placa.toLowerCase())
      );
    }
    if (filters.supervisor) {
      filtered = filtered.filter(item =>
        item.supervisor?.toLowerCase().includes(filters.supervisor.toLowerCase())
      );
    }

    setFilteredData(filtered);
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      setor: '',
      condutor: '',
      placa: '',
      supervisor: ''
    });
  };

  const metricTrends = useMemo(() => computeMetricTrends(filteredData), [filteredData]);

  const indicatorCards = useMemo(() => [
    {
      id: 'totalLitros',
      title: 'Total de Litros',
      value: metricTrends.totalLitros.current,
      change: metricTrends.totalLitros.change,
      format: 'liters',
      theme: 'emerald',
      icon: Fuel
    },
    {
      id: 'totalValor',
      title: 'Valor Total',
      value: metricTrends.totalValor.current,
      change: metricTrends.totalValor.change,
      format: 'currency',
      theme: 'rose',
      icon: DollarSign
    },
    {
      id: 'ticketMedio',
      title: 'Ticket Médio',
      value: metricTrends.ticketMedio.current,
      change: metricTrends.ticketMedio.change,
      format: 'currency',
      theme: 'amber',
      icon: BarChart3
    },
    {
      id: 'avgKmLitro',
      title: 'Média km/L',
      value: metricTrends.avgKmLitro.current,
      change: metricTrends.avgKmLitro.change,
      format: 'kmPerLiter',
      theme: 'emerald',
      icon: TrendingUp
    },
    {
      id: 'avgCustoPorKm',
      title: 'Custo por km',
      value: metricTrends.avgCustoPorKm.current,
      change: metricTrends.avgCustoPorKm.change,
      format: 'currency',
      theme: 'rose',
      icon: CalendarDays
    },
    {
      id: 'totalTransacoes',
      title: 'Transações',
      value: metricTrends.totalTransacoes.current,
      change: metricTrends.totalTransacoes.change,
      format: 'integer',
      theme: 'blue',
      icon: Activity
    }
  ], [metricTrends]);

  const sectorSummary = useMemo(() => computeGroupSummary(filteredData, 'setor'), [filteredData]);
  const regionSummary = useMemo(() => computeGroupSummary(filteredData, 'regiao'), [filteredData]);
  const teamSummary = useMemo(() => computeGroupSummary(filteredData, 'equipe'), [filteredData]);
  const supervisorSummary = useMemo(() => computeGroupSummary(filteredData, 'supervisor'), [filteredData]);
  const driverSummary = useMemo(() => computeTopDriverSummary(filteredData), [filteredData]);
  const efficiencySummary = useMemo(() => computeEfficiencySummary(filteredData), [filteredData]);

  const buildHelperText = (summary, prefix) => summary.label === 'Sem dados'
    ? 'Sem dados disponíveis'
    : `${prefix}: ${summary.label}`;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-emerald-500" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'pending':
        return <Clock className="w-6 h-6 text-yellow-500" />;
      default:
        return <Clock className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      error: 'bg-red-500/20 text-red-400 border-red-500/30',
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    };
    const labels = {
      success: 'Sucesso',
      error: 'Erro',
      pending: 'Pendente'
    };

    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${badges[status] || badges.pending}`}>
        {labels[status] || 'Desconhecido'}
      </span>
    );
  };

  const getRecordsBadge = (records, status) => {
    if (status !== 'success' || records === 0) return null;
    return (
      <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
        {records} registros
      </span>
    );
  };

  // Classes dinâmicas baseadas no tema
  const cardClasses = darkMode
    ? 'rounded-2xl bg-slate-800 p-4 shadow-md text-white'
    : 'rounded-2xl bg-white p-4 shadow-md text-gray-900 border border-gray-200';

  const titleClasses = darkMode ? 'text-slate-400' : 'text-gray-600';
  const valueClasses = darkMode ? 'text-slate-50' : 'text-gray-900';
  const helperClasses = darkMode ? 'text-slate-400' : 'text-gray-600';
  const iconBgClasses = darkMode ? 'bg-slate-700' : 'bg-gray-100';
  const iconTextClasses = darkMode ? 'text-slate-200' : 'text-gray-700';
  const borderClasses = darkMode ? 'border-slate-700' : 'border-gray-200';

  const indicatorThemes = {
    emerald: {
      border: 'border-emerald-500/40',
      value: 'text-emerald-400',
      title: 'text-emerald-200',
      icon: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
    },
    rose: {
      border: 'border-rose-500/40',
      value: 'text-rose-400',
      title: 'text-rose-200',
      icon: 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
    },
    amber: {
      border: 'border-amber-500/40',
      value: 'text-amber-400',
      title: 'text-amber-200',
      icon: 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
    },
    blue: {
      border: 'border-blue-500/40',
      value: 'text-blue-400',
      title: 'text-blue-200',
      icon: 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
    }
  };

  return (
    <div className={`grid grid-cols-12 gap-4 w-full min-h-screen px-6 py-6 transition-colors ${
      darkMode ? 'bg-slate-900' : 'bg-gray-50'
    }`}>
      {/* Header */}
      <div className="col-span-12 flex items-center justify-between mb-4">
        <div>
          <h1 className={`text-4xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Dashboard</h1>
          <p className={`text-lg ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Visão geral do consumo de combustível</p>
        </div>
        <button
          onClick={() => setShowFiltersModal(true)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Filter className="w-5 h-5" />
          Filtros Avançados
        </button>
      </div>

      {dataError && (
        <div className="col-span-12 mb-2">
          <div className={`rounded-2xl border ${darkMode ? 'border-amber-500/40 bg-amber-500/10 text-amber-300' : 'border-amber-200 bg-amber-50 text-amber-700'} p-4 text-sm`}>
            {dataError}
          </div>
        </div>
      )}

      {dataLoading && (
        <div className="col-span-12 mb-2">
          <div className={`rounded-2xl border-dashed ${darkMode ? 'border-slate-700 text-slate-300 bg-slate-800/60' : 'border-gray-300 text-gray-600 bg-white'} p-4 text-sm flex items-center gap-3`}>
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            Carregando dados importados do Firestore...
          </div>
        </div>
      )}

      {/* Indicadores Gerais */}
      <div className="col-span-12">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {indicatorCards.map((card) => {
            const theme = indicatorThemes[card.theme] || indicatorThemes.emerald;
            let valueDisplay = '';
            switch (card.format) {
              case 'currency':
                valueDisplay = formatCurrency(card.value);
                break;
              case 'percentage':
                valueDisplay = formatPercentage(card.value);
                break;
              case 'liters':
                valueDisplay = formatLiters(card.value);
                break;
              case 'kmPerLiter':
                valueDisplay = formatKmPerLiter(card.value);
                break;
              case 'integer':
                valueDisplay = formatInteger(card.value);
                break;
              default:
                valueDisplay = String(card.value ?? '—');
                break;
            }
            const changeValue = Number(card.change || 0);
            const isPositive = changeValue > 0;
            const isNegative = changeValue < 0;
            const changeClass = isPositive
              ? 'text-emerald-400'
              : isNegative
              ? 'text-rose-400'
              : 'text-slate-400';
            const ChangeIcon = isPositive ? ArrowUpRight : isNegative ? ArrowDownRight : ArrowUpRight;
            const formattedChange = formatPercentage(Math.abs(changeValue));

            return (
              <div
                key={card.id}
                className={`relative flex h-full min-h-[170px] flex-col justify-between rounded-3xl border ${theme.border} bg-slate-900/90 px-6 py-6 shadow-lg shadow-slate-900/40`}
              >
                <div className="flex items-start justify-between">
                  <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${theme.title}`}>{card.title}</p>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${theme.icon}`}>
                    <card.icon className="h-6 w-6" />
                  </div>
                </div>

                <div className="mt-6">
                  <p className={`text-3xl font-extrabold ${theme.value}`}>{valueDisplay}</p>
                </div>

                <div className="mt-6 flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 text-sm font-semibold ${changeClass}`}>
                    <ChangeIcon className="h-4 w-4" />
                    {formattedChange}
                  </span>
                  <span className="text-xs text-slate-500">vs período anterior</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>


      {/* Linha 2: Histórico (col-span-7) + Importar (col-span-5) */}
      {userProfile?.role === 'admin' && (
        <>
          <div className={`col-span-12 sm:col-span-12 md:col-span-6 lg:col-span-7 ${cardClasses}`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center`}>
                  <History className="h-6 w-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${valueClasses}`}>Histórico de Importações</h3>
                  <p className={`text-sm ${helperClasses}`}>Últimas 3 importações realizadas</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              {importHistory.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
                    darkMode ? 'bg-slate-700/50 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {getStatusIcon(item.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-sm font-semibold ${valueClasses}`}>{item.type}</p>
                      {getRecordsBadge(item.records, item.status)}
                    </div>
                    <p className={`text-xs ${helperClasses} truncate`}>{item.fileName}</p>
                    <p className={`text-xs ${helperClasses} mt-1`}>{formatDate(item.date)}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {getStatusBadge(item.status)}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowHistoryModal(true)}
              className={`w-full py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                darkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
              }`}
            >
              <Eye className="w-4 h-4" />
              Ver Todos os Detalhes
            </button>
          </div>

          <div className="col-span-12 sm:col-span-12 md:col-span-6 lg:col-span-5 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-4 shadow-md text-white flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Importar Dados</h3>
                  <p className={`text-sm ${darkMode ? 'text-indigo-100' : 'text-white/90'}`}>Gerenciar planilhas do sistema</p>
                </div>
                <Upload className="w-8 h-8 text-white/80" />
              </div>
              <div className={`space-y-2 text-sm mb-4 ${darkMode ? 'text-indigo-100' : 'text-white/90'}`}>
                <p>✓ Formatos: .xlsx, .csv</p>
                <p>✓ Upload rápido e seguro</p>
                <p>✓ Validação automática</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard/importar-dados')}
              className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5" />
              Nova Importação
            </button>
          </div>
        </>
      )}

      {/* Linha 3: Consumo por Setor (col-span-6) + Consumo por Região (col-span-6) */}
      <div className={`col-span-12 sm:col-span-12 md:col-span-6 lg:col-span-6 ${cardClasses} flex flex-col`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className={`text-xs uppercase tracking-wider ${titleClasses}`}>Consumo por Setor</p>
            <p className={`mt-2 text-2xl font-semibold ${valueClasses}`}>{formatLiters(sectorSummary.value)}</p>
            <p className={`mt-1 text-sm ${helperClasses}`}>{buildHelperText(sectorSummary, 'Setor líder')}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${iconBgClasses} ${iconTextClasses}`}>
              <Layers className="h-5 w-5" />
            </div>
            <button
              type="button"
              className={`p-2 rounded-xl transition-colors ${
                darkMode ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-700' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-[18rem] mb-4">
          <ConsumptionBySector data={filteredData} darkMode={darkMode} />
        </div>
        <div className={`flex items-center gap-2 text-sm font-medium ${
          sectorSummary.change > 0 ? 'text-emerald-400' : sectorSummary.change < 0 ? 'text-red-400' : 'text-amber-400'
        }`}>
          <span>{sectorSummary.change > 0 ? '+' : ''}{sectorSummary.change.toFixed(1)}%</span>
          <span className={helperClasses}>vs média dos setores</span>
        </div>
      </div>

      <div className={`col-span-12 sm:col-span-12 md:col-span-6 lg:col-span-6 ${cardClasses} flex flex-col`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className={`text-xs uppercase tracking-wider ${titleClasses}`}>Consumo por Região</p>
            <p className={`mt-2 text-2xl font-semibold ${valueClasses}`}>{formatLiters(regionSummary.value)}</p>
            <p className={`mt-1 text-sm ${helperClasses}`}>{buildHelperText(regionSummary, 'Região líder')}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${iconBgClasses} ${iconTextClasses}`}>
              <Globe2 className="h-5 w-5" />
            </div>
            <button
              type="button"
              className={`p-2 rounded-xl transition-colors ${
                darkMode ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-700' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-[18rem] mb-4">
          <ConsumptionByRegion data={filteredData} darkMode={darkMode} />
        </div>
        <div className={`flex items-center gap-2 text-sm font-medium ${
          regionSummary.change > 0 ? 'text-emerald-400' : regionSummary.change < 0 ? 'text-red-400' : 'text-amber-400'
        }`}>
          <span>{regionSummary.change > 0 ? '+' : ''}{regionSummary.change.toFixed(1)}%</span>
          <span className={helperClasses}>vs média das regiões</span>
        </div>
      </div>

      {/* Linha 4: Consumo por Equipe (col-span-6) + Consumo por Supervisor (col-span-6) */}
      <div className={`col-span-12 sm:col-span-12 md:col-span-6 lg:col-span-6 ${cardClasses} flex flex-col`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className={`text-xs uppercase tracking-wider ${titleClasses}`}>Consumo por Equipe</p>
            <p className={`mt-2 text-2xl font-semibold ${valueClasses}`}>{formatLiters(teamSummary.value)}</p>
            <p className={`mt-1 text-sm ${helperClasses}`}>{buildHelperText(teamSummary, 'Equipe destaque')}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${iconBgClasses} ${iconTextClasses}`}>
              <Users className="h-5 w-5" />
            </div>
            <button
              type="button"
              className={`p-2 rounded-xl transition-colors ${
                darkMode ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-700' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-[18rem] mb-4">
          <ConsumptionByTeam data={filteredData} darkMode={darkMode} />
        </div>
        <div className={`flex items-center gap-2 text-sm font-medium ${
          teamSummary.change > 0 ? 'text-emerald-400' : teamSummary.change < 0 ? 'text-red-400' : 'text-amber-400'
        }`}>
          <span>{teamSummary.change > 0 ? '+' : ''}{teamSummary.change.toFixed(1)}%</span>
          <span className={helperClasses}>vs média das equipes</span>
        </div>
      </div>

      <div className={`col-span-12 sm:col-span-12 md:col-span-6 lg:col-span-6 ${cardClasses} flex flex-col`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className={`text-xs uppercase tracking-wider ${titleClasses}`}>Consumo por Supervisor</p>
            <p className={`mt-2 text-2xl font-semibold ${valueClasses}`}>{formatLiters(supervisorSummary.value)}</p>
            <p className={`mt-1 text-sm ${helperClasses}`}>{buildHelperText(supervisorSummary, 'Supervisor destaque')}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${iconBgClasses} ${iconTextClasses}`}>
              <UserCheck className="h-5 w-5" />
            </div>
            <button
              type="button"
              className={`p-2 rounded-xl transition-colors ${
                darkMode ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-700' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-[18rem] mb-4">
          <ConsumptionBySupervisorHorizontal data={filteredData} darkMode={darkMode} />
        </div>
        <div className={`flex items-center gap-2 text-sm font-medium ${
          supervisorSummary.change > 0 ? 'text-emerald-400' : supervisorSummary.change < 0 ? 'text-red-400' : 'text-amber-400'
        }`}>
          <span>{supervisorSummary.change > 0 ? '+' : ''}{supervisorSummary.change.toFixed(1)}%</span>
          <span className={helperClasses}>vs média dos supervisores</span>
        </div>
      </div>

      {/* Linha 5: Top 10 Condutores (col-span-6) + Eficiência Temporal (col-span-6) */}
      <div className={`col-span-12 sm:col-span-12 md:col-span-6 lg:col-span-6 ${cardClasses} flex flex-col`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className={`text-xs uppercase tracking-wider ${titleClasses}`}>Top 10 Condutores</p>
            <p className={`mt-2 text-2xl font-semibold ${valueClasses}`}>{formatLiters(driverSummary.value)}</p>
            <p className={`mt-1 text-sm ${helperClasses}`}>{buildHelperText(driverSummary, 'Condutor destaque')}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${iconBgClasses} ${iconTextClasses}`}>
              <Award className="h-5 w-5" />
            </div>
            <button
              type="button"
              className={`p-2 rounded-xl transition-colors ${
                darkMode ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-700' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-[18rem] mb-4">
          <ConsumptionByDriver data={filteredData} darkMode={darkMode} />
        </div>
        <div className={`flex items-center gap-2 text-sm font-medium ${
          driverSummary.change > 0 ? 'text-emerald-400' : driverSummary.change < 0 ? 'text-red-400' : 'text-amber-400'
        }`}>
          <span>{driverSummary.change > 0 ? '+' : ''}{driverSummary.change.toFixed(1)}%</span>
          <span className={helperClasses}>vs média do top 10</span>
        </div>
      </div>

      <div className={`col-span-12 sm:col-span-12 md:col-span-6 lg:col-span-6 ${cardClasses} flex flex-col`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className={`text-xs uppercase tracking-wider ${titleClasses}`}>Eficiência Temporal</p>
            <p className={`mt-2 text-2xl font-semibold ${valueClasses}`}>{formatKmPerLiter(efficiencySummary.value)}</p>
            <p className={`mt-1 text-sm ${helperClasses}`}>{efficiencySummary.helper}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${iconBgClasses} ${iconTextClasses}`}>
              <LineChart className="h-5 w-5" />
            </div>
            <button
              type="button"
              className={`p-2 rounded-xl transition-colors ${
                darkMode ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-700' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-[18rem] mb-4">
          <EfficiencyMetrics data={filteredData} darkMode={darkMode} />
        </div>
        <div className={`flex items-center gap-2 text-sm font-medium ${
          efficiencySummary.change > 0 ? 'text-emerald-400' : efficiencySummary.change < 0 ? 'text-red-400' : 'text-amber-400'
        }`}>
          <span>{efficiencySummary.change > 0 ? '+' : ''}{efficiencySummary.change.toFixed(1)}%</span>
          <span className={helperClasses}>vs registro anterior</span>
        </div>
      </div>

      {/* Modais */}
      {showFiltersModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity" onClick={() => setShowFiltersModal(false)}></div>

            <div className="inline-block align-bottom bg-slate-800 rounded-3xl px-8 pt-6 pb-8 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-slate-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Filtros Avançados</h3>
                <button
                  onClick={() => setShowFiltersModal(false)}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Data Início</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-600 rounded-xl bg-slate-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Data Fim</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-600 rounded-xl bg-slate-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Setor</label>
                  <input
                    type="text"
                    placeholder="Filtrar por setor"
                    value={filters.setor}
                    onChange={(e) => setFilters({...filters, setor: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-600 rounded-xl bg-slate-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Condutor</label>
                  <input
                    type="text"
                    placeholder="Filtrar por condutor"
                    value={filters.condutor}
                    onChange={(e) => setFilters({...filters, condutor: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-600 rounded-xl bg-slate-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Placa</label>
                  <input
                    type="text"
                    placeholder="Filtrar por placa"
                    value={filters.placa}
                    onChange={(e) => setFilters({...filters, placa: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-600 rounded-xl bg-slate-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Supervisor</label>
                  <input
                    type="text"
                    placeholder="Filtrar por supervisor"
                    value={filters.supervisor}
                    onChange={(e) => setFilters({...filters, supervisor: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-600 rounded-xl bg-slate-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-8">
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 text-slate-300 bg-slate-700 rounded-xl hover:bg-slate-600 transition-colors font-medium"
                >
                  Limpar Filtros
                </button>
                <button
                  onClick={() => setShowFiltersModal(false)}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-medium shadow-lg hover:shadow-xl"
                >
                  Aplicar Filtros
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity" onClick={() => setShowHistoryModal(false)}></div>

            <div className="inline-block align-bottom bg-slate-800 rounded-3xl px-8 pt-6 pb-8 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full border border-slate-700">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                    <History className="h-6 w-6 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Histórico Completo de Importações</h3>
                    <p className="text-sm text-slate-400">Todas as importações realizadas no sistema</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left text-xs font-semibold text-slate-400 py-3 px-4">Status</th>
                      <th className="text-left text-xs font-semibold text-slate-400 py-3 px-4">Tipo</th>
                      <th className="text-left text-xs font-semibold text-slate-400 py-3 px-4">Arquivo</th>
                      <th className="text-left text-xs font-semibold text-slate-400 py-3 px-4">Data/Hora</th>
                      <th className="text-left text-xs font-semibold text-slate-400 py-3 px-4">Registros</th>
                      <th className="text-left text-xs font-semibold text-slate-400 py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {importHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="py-4 px-4">
                          {getStatusIcon(item.status)}
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm font-semibold text-white">{item.type}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm text-slate-300">{item.fileName}</p>
                          {item.error && (
                            <p className="text-xs text-red-400 mt-1">{item.error}</p>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm text-slate-300">{formatDate(item.date)}</p>
                        </td>
                        <td className="py-4 px-4">
                          {getRecordsBadge(item.records, item.status) || (
                            <span className="text-sm text-slate-500">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {getStatusBadge(item.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-all font-medium"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {filteredData.length === 0 && (
        <div className="col-span-12 text-center py-16">
          <CalendarDays className={`mx-auto h-16 w-16 mb-4 ${helperClasses}`} />
          <h3 className={`text-xl font-semibold ${valueClasses} mb-2`}>Nenhum dado encontrado</h3>
          <p className={`text-lg ${helperClasses}`}>Importe dados ou ajuste os filtros para visualizar o dashboard.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;