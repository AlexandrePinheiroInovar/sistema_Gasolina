import { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Upload, Download, FileText, Truck, Clock, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const normalizeString = (value = '') => (value === null || value === undefined ? '' : value.toString().trim());

const parseLocaleNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const str = normalizeString(value);
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

const parseCurrency = parseLocaleNumber;

const normalizePlate = (value = '') => {
  const str = normalizeString(value).toUpperCase();
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
  const info = normalizeString(identification);
  if (!info) {
    return { plate: '', vehicle: '' };
  }
  const parts = info.split('|').map(part => part.trim()).filter(Boolean);
  const vehicle = parts.length ? parts[0] : '';
  const plateFromLabel = info.match(/Placa\s*-\s*([A-Z0-9]+)/i);
  if (plateFromLabel) {
    const plate = normalizePlate(plateFromLabel[1]);
    return { plate, vehicle };
  }
  const mercosulMatch = info.match(/([A-Z]{3}[0-9][A-Z0-9][0-9]{2})/i);
  if (mercosulMatch) {
    return { plate: normalizePlate(mercosulMatch[1]), vehicle: vehicle === mercosulMatch[1] ? '' : vehicle };
  }
  const fallback = normalizePlate(info);
  return { plate: fallback, vehicle: vehicle === fallback ? '' : vehicle };
};

const parseExcelDate = (value) => {
  if (typeof value !== 'number') {
    return null;
  }
  try {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) {
      return null;
    }
    const jsDate = new Date(Date.UTC(parsed.y, (parsed.m || 1) - 1, parsed.d || 1, parsed.H || 0, parsed.M || 0, Math.round(parsed.S || 0)));
    return jsDate.toISOString();
  } catch (error) {
    return null;
  }
};

const normalizeDateTime = (value) => {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'number') {
    const excelIso = parseExcelDate(value);
    if (excelIso) {
      return excelIso;
    }
  }
  const str = normalizeString(value);
  if (!str) {
    return '';
  }
  let candidate = str;
  if (/^\d{4}-\d{2}-\d{2}\s/.test(str)) {
    candidate = str.replace(' ', 'T');
  } else if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) {
    const [datePart, timePart = '00:00:00'] = str.split(/\s+/);
    const [day, month, year] = datePart.split('/');
    candidate = `${year}-${month}-${day}T${timePart}`;
  }
  const parsedDate = new Date(candidate);
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.toISOString();
  }
  return str;
};

const ensureUpper = (value = '') => normalizeString(value).toUpperCase();

// Sanitiza o objeto antes de enviar para o Firestore
const sanitizeForFirestore = (obj) => {
  const sanitized = {};

  for (const [key, value] of Object.entries(obj)) {
    // Remove undefined e null
    if (value === undefined || value === null) {
      continue;
    }

    // Valida números - remove NaN e Infinity
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        sanitized[key] = 0;
        continue;
      }
    }

    // Converte strings de data ISO para Timestamp do Firestore
    if (typeof value === 'string' && (key === 'dataHora' || key === 'importedAt')) {
      // Tenta converter para Date
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        sanitized[key] = Timestamp.fromDate(date);
        continue;
      } else if (value === '') {
        // Se for string vazia, pula o campo (exceto importedAt)
        if (key !== 'importedAt') {
          continue;
        }
      }
    }

    // Remove strings vazias de campos que não são essenciais
    if (typeof value === 'string' && value.trim() === '' &&
        !['autorizacao', 'transacao', 'placa'].includes(key)) {
      continue;
    }

    sanitized[key] = value;
  }

  // Garante que importedAt sempre exista como Timestamp
  if (!sanitized.importedAt) {
    sanitized.importedAt = Timestamp.now();
  }

  return sanitized;
};

const getColumnValue = (row, keys = []) => {
  if (!row) {
    return '';
  }
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(row, key) && row[key] !== undefined) {
      return row[key];
    }
  }
  return '';
};

const ImportData = () => {
  const [loading, setLoading] = useState(false);
  const [uploadStats, setUploadStats] = useState({});

  const handleFileUpload = async (file, type) => {
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        let processedCount = 0;
        let errorCount = 0;

        for (const row of jsonData) {
          try {
            let docData = {};
            let collectionName = '';

            switch (type) {
              case 'condutor': {
                collectionName = 'driverReports';
                const identificacaoRaw = getColumnValue(row, ['Identificação', 'Identificacao']);
                const identificacaoInfo = extractIdentificationDetails(identificacaoRaw);
                const autorizacaoValue = getColumnValue(row, ['Autorização', 'Autorizacao']);
                const dataHoraValue = getColumnValue(row, ['Data/Hora', 'Data Hora', 'Data/Hora ']);
                const valorRaw = getColumnValue(row, ['Valor', ' Valor ', 'Valor (R$)', 'Valor Total']);
                docData = {
                  autorizacao: normalizeString(autorizacaoValue),
                  dataHora: normalizeDateTime(dataHoraValue),
                  identificacao: normalizeString(identificacaoRaw),
                  condutor: normalizeString(getColumnValue(row, ['Condutor'])),
                  segmento: normalizeString(getColumnValue(row, ['Segmento'])),
                  credenciado: normalizeString(getColumnValue(row, ['Credenciado'])),
                  municipio: normalizeString(getColumnValue(row, ['Município', 'Municipio'])),
                  uf: ensureUpper(getColumnValue(row, ['UF'])),
                  valor: parseCurrency(valorRaw),
                  valorOriginal: normalizeString(valorRaw),
                  placa: identificacaoInfo.plate,
                  veiculo: identificacaoInfo.vehicle,
                  importedAt: new Date().toISOString(),
                  type: 'condutor'
                };
                break;
              }

              case 'maxifrota': {
                collectionName = 'maxifrotaReports';
                const transacao = getColumnValue(row, ['Transação', 'Transacao']);
                const dataHoraValue = getColumnValue(row, ['Data/Hora', 'Data Hora']);
                const identificacaoRaw = getColumnValue(row, ['Identificação', 'Identificacao']);
                const identificacaoInfo = extractIdentificationDetails(identificacaoRaw);
                const quantidadeRaw = getColumnValue(row, ['Quantidade']);
                const valorTotalRaw = getColumnValue(row, ['Valor Total', ' Valor Total ', 'Valor Total (R$)']);
                const valorLiquidoRaw = getColumnValue(row, ['Valor Líquido', 'Valor Liquido', ' Valor Liquido ']);
                const valorUnitarioRaw = getColumnValue(row, ['Valor (Unit)', 'Valor Unitário', 'Valor Unit', ' Valor (Unit) ']);
                const usoKmRaw = getColumnValue(row, ['Uso (Km)', 'Uso Km', 'Uso KM']);
                docData = {
                  transacao: normalizeString(transacao),
                  status: normalizeString(getColumnValue(row, ['Status'])),
                  tipo: normalizeString(getColumnValue(row, ['Tipo'])),
                  dataHora: normalizeDateTime(dataHoraValue),
                  cartao: normalizeString(getColumnValue(row, ['Cartão', 'Cartao'])),
                  identificacao: normalizeString(identificacaoRaw),
                  placa: identificacaoInfo.plate || normalizePlate(getColumnValue(row, ['Placa'])),
                  veiculo: identificacaoInfo.vehicle,
                  ordem: normalizeString(getColumnValue(row, ['Ordem'])),
                  condutor: normalizeString(getColumnValue(row, ['Condutor'])),
                  centroCusto: normalizeString(getColumnValue(row, ['Centro de Custo', 'Centro Custo'])),
                  servico: normalizeString(getColumnValue(row, ['Serviço', 'Servico'])),
                  usoKm: parseLocaleNumber(usoKmRaw),
                  quantidade: parseLocaleNumber(quantidadeRaw),
                  valorTotal: parseCurrency(valorTotalRaw),
                  valorTotalOriginal: normalizeString(valorTotalRaw),
                  valorLiquido: parseCurrency(valorLiquidoRaw),
                  valorLiquidoOriginal: normalizeString(valorLiquidoRaw),
                  valorUnitario: parseCurrency(valorUnitarioRaw),
                  valorUnitarioOriginal: normalizeString(valorUnitarioRaw),
                  importedAt: new Date().toISOString(),
                  type: 'maxifrota'
                };
                break;
              }

              case 'ticketlog': {
                collectionName = 'ticketlogReports';
                const placaRaw = getColumnValue(row, ['Placa']);
                const cartaoValorRaw = getColumnValue(row, ['Cartão R$', 'Cartao R$', 'Cartão', 'Cartao']);
                const ultimaKmRaw = getColumnValue(row, ['Última Km e/ou H', 'Ultima Km e/ou H', 'Última Km', 'Ultima Km']);
                const kmRodadosRaw = getColumnValue(row, ['Km Rodados', 'KM Rodados']);
                const horasTrabalhadasRaw = getColumnValue(row, ['Horas Trabalhadas']);
                const litrosRaw = getColumnValue(row, ['Litros']);
                const valorMedioLitroRaw = getColumnValue(row, ['Valor Médio (R$) Litro', 'Valor Medio (R$) Litro', 'Valor Medio Litro']);
                const kmPorLitroRaw = getColumnValue(row, ['Km por Litro', 'KM por Litro']);
                const litrosPorHoraRaw = getColumnValue(row, ['Litros/Hora', 'Litros por Hora']);
                const totalTransacaoRaw = getColumnValue(row, ['Total (R$) Transação', 'Total (R$) Transacao', 'Total R$ Transação']);
                const periodoRaw = getColumnValue(row, ['Período', 'Periodo']);
                docData = {
                  placa: normalizePlate(placaRaw),
                  placaOriginal: normalizeString(placaRaw),
                  modelo: normalizeString(getColumnValue(row, ['Modelo'])),
                  familia: normalizeString(getColumnValue(row, ['Família', 'Familia'])),
                  ano: normalizeString(getColumnValue(row, ['Ano'])),
                  marca: normalizeString(getColumnValue(row, ['Marca'])),
                  numeroFrota: normalizeString(getColumnValue(row, ['Nr.Frota', 'Nr Frota', 'Numero Frota'])),
                  tipoCombustivel: normalizeString(getColumnValue(row, ['Tipo Combustível', 'Tipo Combustivel'])),
                  cartaoValor: parseCurrency(cartaoValorRaw),
                  cartaoValorOriginal: normalizeString(cartaoValorRaw),
                  ultimaKm: parseLocaleNumber(ultimaKmRaw),
                  kmRodados: parseLocaleNumber(kmRodadosRaw),
                  horasTrabalhadas: parseLocaleNumber(horasTrabalhadasRaw),
                  litros: parseLocaleNumber(litrosRaw),
                  valorMedioLitro: parseLocaleNumber(valorMedioLitroRaw),
                  kmPorLitro: parseLocaleNumber(kmPorLitroRaw),
                  litrosPorHora: parseLocaleNumber(litrosPorHoraRaw),
                  totalTransacao: parseCurrency(totalTransacaoRaw),
                  totalTransacaoOriginal: normalizeString(totalTransacaoRaw),
                  periodo: normalizeString(periodoRaw),
                  importedAt: new Date().toISOString(),
                  type: 'ticketlog'
                };
                break;
              }

              default:
                throw new Error('Tipo de relatório não reconhecido');
            }

            const hasRequiredId = (() => {
              switch (type) {
                case 'condutor':
                  return !!docData.autorizacao;
                case 'maxifrota':
                  return !!docData.transacao;
                case 'ticketlog':
                  return !!docData.placa;
                default:
                  return false;
              }
            })();

            if (hasRequiredId) {
              // Sanitiza os dados antes de enviar para o Firestore
              const sanitizedData = sanitizeForFirestore(docData);
              await addDoc(collection(db, collectionName), sanitizedData);
              processedCount++;
            } else {
              console.warn('Linha ignorada - ID obrigatório não encontrado:', docData);
              errorCount++;
            }
          } catch (error) {
            console.error('Erro ao processar linha:', error);
            console.error('Dados da linha com erro:', row);
            if (error.code) {
              console.error('Código de erro Firestore:', error.code, error.message);
            }
            errorCount++;
          }
        }

        setUploadStats(prev => ({
          ...prev,
          [type]: { processed: processedCount, errors: errorCount }
        }));

        if (processedCount === 0 && errorCount > 0) {
          toast.error(`❌ Nenhum registro foi importado. ${errorCount} erros encontrados. Verifique o console para detalhes.`);
        } else if (errorCount > 0) {
          toast.warning(`⚠️ ${processedCount} registros importados, mas ${errorCount} linhas tiveram erro. Verifique o console.`, { duration: 5000 });
        } else {
          toast.success(`✅ ${processedCount} registros importados com sucesso!`);
        }
      } catch (error) {
        console.error('Erro ao importar planilha:', error);
        toast.error(`❌ Erro ao importar planilha: ${error.message || 'Erro desconhecido'}`);
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      toast.error('Não foi possível ler o arquivo selecionado.');
      setLoading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = (type) => {
    let template = [];
    let fileName = '';

    switch (type) {
      case 'condutor':
        template = [{
          'Autorização': '',
          'Data/Hora': '',
          'Identificação': '',
          'Condutor': '',
          'Segmento': '',
          'Credenciado': '',
          'Município': '',
          'UF': '',
          'Valor': ''
        }];
        fileName = 'template_relatorio_condutor.xlsx';
        break;

      case 'maxifrota':
        template = [{
          'Transação': '',
          'Status': '',
          'Tipo': '',
          'Data/Hora': '',
          'Cartão': '',
          'Identificação': '',
          'Ordem': '',
          'Condutor': '',
          'Centro de Custo': '',
          'Serviço': '',
          'Uso (Km)': '',
          'Quantidade': '',
          'Valor Total': '',
          'Valor Líquido': '',
          'Valor (Unit)': ''
        }];
        fileName = 'template_relatorio_maxifrota.xlsx';
        break;

      case 'ticketlog':
        template = [{
          'Placa': '',
          'Modelo': '',
          'Família': '',
          'Ano': '',
          'Marca': '',
          'Nr.Frota': '',
          'Tipo Combustível': '',
          'Cartão R$': '',
          'Última Km e/ou H': '',
          'Km Rodados': '',
          'Horas Trabalhadas': '',
          'Litros': '',
          'Valor Médio (R$) Litro': '',
          'Km por Litro': '',
          'Litros/Hora': '',
          'Total (R$) Transação': '',
          'Período': ''
        }];
        fileName = 'template_periodo_ticketlog.xlsx';
        break;
    }

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, fileName);
  };

  const ImportCard = ({ title, description, icon: Icon, type, color }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => downloadTemplate(type)}
          className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          Baixar Template
        </button>

        <label className="w-full flex items-center justify-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium cursor-pointer transition-colors">
          <Upload className="h-4 w-4 mr-2" />
          Importar Planilha
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => handleFileUpload(e.target.files[0], type)}
            className="hidden"
            disabled={loading}
          />
        </label>

        {uploadStats[type] && (
          <div className="flex items-center text-sm text-green-600 dark:text-green-400">
            <Check className="h-4 w-4 mr-1" />
            {uploadStats[type].processed} registros importados
            {uploadStats[type].errors > 0 && (
              <span className="text-orange-600 dark:text-orange-400 ml-2">
                ({uploadStats[type].errors} erros)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Importar Dados
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Importe planilhas de relatórios para análise no dashboard
          </p>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            <span className="text-gray-900 dark:text-white">Processando dados...</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ImportCard
          title="Relatório - Condutor"
          description="Dados detalhados de abastecimento por condutor"
          icon={FileText}
          type="condutor"
          color="bg-blue-500"
        />

        <ImportCard
          title="Relatório - Maxi Frota"
          description="Transações e dados do sistema Maxi Frota"
          icon={Truck}
          type="maxifrota"
          color="bg-green-500"
        />

        <ImportCard
          title="Relatório - Período Ticket Log"
          description="Dados consolidados por período do Ticket Log"
          icon={Clock}
          type="ticketlog"
          color="bg-purple-500"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Instruções de Importação
        </h3>
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">1. Baixe o template correspondente</h4>
            <p>Cada tipo de relatório possui um template específico com as colunas necessárias.</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">2. Preencha os dados</h4>
            <p>Complete o template com os dados do seu relatório, mantendo o formato das colunas.</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">3. Importe a planilha</h4>
            <p>Use o botão "Importar Planilha" para carregar os dados no sistema.</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">4. Verificação automática</h4>
            <p>O sistema relacionará automaticamente os dados com o cadastro de condutores através da placa do veículo.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportData;