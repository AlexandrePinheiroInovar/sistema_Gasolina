import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Plus, Edit, Trash2, Upload, Download, X, Car, User, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const Drivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const { userProfile } = useAuth();
  const { darkMode } = useTheme();
  const isAdmin = userProfile?.role === 'admin';

  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    email: '',
    setor: '',
    supervisor: '',
    unidade: '',
    veiculo: '',
    marcaModelo: '',
    cor: '',
    ano: '',
    placa: '',
    status: 'ATIVO'
  });

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'drivers'));
      const driversData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDrivers(driversData);
    } catch (error) {
      console.error('Erro ao buscar condutores:', error);
      toast.error('Erro ao carregar condutores');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar placa única (chave primária)
      const placaUpper = formData.placa.toUpperCase().trim();

      if (!editingDriver) {
        // Verificar se a placa já existe (apenas para novo cadastro)
        const existingDriver = drivers.find(d =>
          d.placa?.toUpperCase().trim() === placaUpper
        );

        if (existingDriver) {
          toast.error(`A placa ${placaUpper} já está cadastrada para ${existingDriver.nome}`);
          setLoading(false);
          return;
        }
      }

      const driverData = {
        ...formData,
        placa: placaUpper
      };

      if (editingDriver) {
        await updateDoc(doc(db, 'drivers', editingDriver.id), {
          ...driverData,
          updatedAt: new Date().toISOString()
        });
        toast.success('Condutor atualizado com sucesso!');
      } else {
        await addDoc(collection(db, 'drivers'), {
          ...driverData,
          createdAt: new Date().toISOString()
        });
        toast.success('Condutor cadastrado com sucesso!');
      }

      setShowModal(false);
      setEditingDriver(null);
      resetForm();
      fetchDrivers();
    } catch (error) {
      console.error('Erro ao salvar condutor:', error);
      toast.error('Erro ao salvar condutor');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (driver) => {
    setEditingDriver(driver);
    setFormData({
      nome: driver.nome || '',
      cpf: driver.cpf || '',
      email: driver.email || '',
      setor: driver.setor || '',
      supervisor: driver.supervisor || '',
      unidade: driver.unidade || '',
      veiculo: driver.veiculo || '',
      marcaModelo: driver.marcaModelo || '',
      cor: driver.cor || '',
      ano: driver.ano || '',
      placa: driver.placa || '',
      status: driver.status || 'ATIVO'
    });
    setShowModal(true);
  };

  const handleDelete = async (driverId) => {
    if (!confirm('Tem certeza que deseja excluir este condutor?')) return;

    try {
      await deleteDoc(doc(db, 'drivers', driverId));
      toast.success('Condutor excluído com sucesso!');
      fetchDrivers();
    } catch (error) {
      console.error('Erro ao excluir condutor:', error);
      toast.error('Erro ao excluir condutor');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      cpf: '',
      email: '',
      setor: '',
      supervisor: '',
      unidade: '',
      veiculo: '',
      marcaModelo: '',
      cor: '',
      ano: '',
      placa: '',
      status: 'ATIVO'
    });
  };

  const openModal = () => {
    resetForm();
    setEditingDriver(null);
    setShowModal(true);
  };

  const downloadTemplate = () => {
    const template = [
      {
        'Matrícula': '',
        'Nome': '',
        'Forma de Pagamento': '',
        'Chave Pix': '',
        'Agência': '',
        'Conta': '',
        'CPF': '',
        'E-mail': '',
        'Setor': '',
        'Unidade': '',
        'Supervisor': '',
        'Marca': '',
        'Modelo': '',
        'Cor': '',
        'Ano': '',
        'Placa': '',
        'Status': 'ativo',
        'Empresa': ''
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Condutores');

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, 'template_condutores.xlsx');
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        for (const row of jsonData) {
          const driverData = {
            matricula: row['Matrícula'] || '',
            nome: row['Nome'] || '',
            formaPagamento: row['Forma de Pagamento'] || '',
            chavePix: row['Chave Pix'] || '',
            agencia: row['Agência'] || '',
            conta: row['Conta'] || '',
            cpf: row['CPF'] || '',
            email: row['E-mail'] || '',
            setor: row['Setor'] || '',
            unidade: row['Unidade'] || '',
            supervisor: row['Supervisor'] || '',
            veiculo: {
              marca: row['Marca'] || '',
              modelo: row['Modelo'] || '',
              cor: row['Cor'] || '',
              ano: row['Ano'] || '',
              placa: row['Placa'] || ''
            },
            status: row['Status'] || 'ativo',
            empresa: row['Empresa'] || '',
            createdAt: new Date().toISOString()
          };

          if (driverData.nome) {
            await addDoc(collection(db, 'drivers'), driverData);
          }
        }

        toast.success('Planilha importada com sucesso!');
        fetchDrivers();
      } catch (error) {
        console.error('Erro ao importar planilha:', error);
        toast.error('Erro ao importar planilha');
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  };

  if (loading && drivers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Condutores
        </h1>
        <div className="flex space-x-2">
          {isAdmin && (
            <>
              <button
                onClick={downloadTemplate}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Template</span>
              </button>
              <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors cursor-pointer">
                <Upload className="h-4 w-4" />
                <span>Importar</span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </>
          )}
          <button
            onClick={openModal}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Condutor</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Condutor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Veículo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Setor/Supervisor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {drivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {driver.nome}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Mat: {driver.matricula} | {driver.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {driver.veiculo?.marca} {driver.veiculo?.modelo}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {driver.veiculo?.placa} | {driver.veiculo?.cor} | {driver.veiculo?.ano}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{driver.setor}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{driver.supervisor}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      driver.status === 'ativo'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                    }`}>
                      {driver.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(driver)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(driver.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Estilizado */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className={`relative w-full max-w-4xl mx-auto ${
            darkMode ? 'bg-slate-900' : 'bg-white'
          } rounded-2xl shadow-2xl`}>
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${
              darkMode ? 'border-slate-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className={`text-2xl font-bold ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {editingDriver ? 'Editar Condutor' : 'Novo Condutor'}
                  </h3>
                  <p className={`text-sm ${
                    darkMode ? 'text-slate-400' : 'text-gray-600'
                  }`}>
                    {editingDriver ? 'Atualize as informações do condutor' : 'Preencha os dados para cadastrar um novo condutor'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className={`p-2 rounded-xl transition-colors ${
                  darkMode
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                    : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Card 1: Dados Pessoais */}
              <div className={`${darkMode ? 'bg-slate-800' : 'bg-gray-50'} p-5 rounded-xl shadow-sm border ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-500" />
                  </div>
                  <h4 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Dados Pessoais
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      Nome *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: João Silva"
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl text-sm transition-all ${
                        darkMode
                          ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                      } border focus:outline-none`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      CPF *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl text-sm transition-all ${
                        darkMode
                          ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                      } border focus:outline-none`}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      E-mail *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="joao@exemplo.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl text-sm transition-all ${
                        darkMode
                          ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                      } border focus:outline-none`}
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Dados Organizacionais */}
              <div className={`${darkMode ? 'bg-slate-800' : 'bg-gray-50'} p-5 rounded-xl shadow-sm border ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-blue-500" />
                  </div>
                  <h4 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Dados Organizacionais
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      Setor *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Administrativo"
                      value={formData.setor}
                      onChange={(e) => setFormData({...formData, setor: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl text-sm transition-all ${
                        darkMode
                          ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                      } border focus:outline-none`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      Supervisor *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Maria Santos"
                      value={formData.supervisor}
                      onChange={(e) => setFormData({...formData, supervisor: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl text-sm transition-all ${
                        darkMode
                          ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                      } border focus:outline-none`}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      Unidade *
                    </label>
                    <select
                      required
                      value={formData.unidade}
                      onChange={(e) => setFormData({...formData, unidade: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl text-sm transition-all ${
                        darkMode
                          ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                      } border focus:outline-none`}
                    >
                      <option value="">Selecione a unidade</option>
                      <option value="ALAGOINHAS">ALAGOINHAS</option>
                      <option value="FEIRA DE SANTANA">FEIRA DE SANTANA</option>
                      <option value="SALVADOR">SALVADOR</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Card 3: Dados do Veículo */}
              <div className={`${darkMode ? 'bg-slate-800' : 'bg-gray-50'} p-5 rounded-xl shadow-sm border ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Car className="h-5 w-5 text-blue-500" />
                  </div>
                  <h4 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Dados do Veículo
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      Veículo *
                    </label>
                    <select
                      required
                      value={formData.veiculo}
                      onChange={(e) => setFormData({...formData, veiculo: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl text-sm transition-all ${
                        darkMode
                          ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                      } border focus:outline-none`}
                    >
                      <option value="">Selecione o veículo</option>
                      <option value="Moto">Moto</option>
                      <option value="Carro">Carro</option>
                      <option value="Doblo">Doblo</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      Marca/Modelo *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Toyota Corolla"
                      value={formData.marcaModelo}
                      onChange={(e) => setFormData({...formData, marcaModelo: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl text-sm transition-all ${
                        darkMode
                          ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                      } border focus:outline-none`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      Cor *
                    </label>
                    <select
                      required
                      value={formData.cor}
                      onChange={(e) => setFormData({...formData, cor: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl text-sm transition-all ${
                        darkMode
                          ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                      } border focus:outline-none`}
                    >
                      <option value="">Selecione a cor</option>
                      <option value="Branco">Branco</option>
                      <option value="Cinza">Cinza</option>
                      <option value="Preto">Preto</option>
                      <option value="Prata">Prata</option>
                      <option value="Bege">Bege</option>
                      <option value="Vermelho">Vermelho</option>
                      <option value="Verde">Verde</option>
                      <option value="Azul">Azul</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      Ano *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 2023"
                      value={formData.ano}
                      onChange={(e) => setFormData({...formData, ano: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl text-sm transition-all ${
                        darkMode
                          ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                      } border focus:outline-none`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      Placa * <span className="ml-2 px-2 py-1 text-xs font-bold bg-red-500 text-white rounded-md">Chave Primária</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ABC1D23"
                      value={formData.placa}
                      onChange={(e) => setFormData({...formData, placa: e.target.value.toUpperCase()})}
                      className={`w-full px-4 py-3 rounded-xl text-sm transition-all uppercase ${
                        darkMode
                          ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                      } border focus:outline-none`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      Status *
                    </label>
                    <select
                      required
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl text-sm transition-all ${
                        darkMode
                          ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                      } border focus:outline-none`}
                    >
                      <option value="ATIVO">ATIVO</option>
                      <option value="INATIVO">INATIVO</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className={`flex items-center justify-end gap-3 p-6 border-t ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                    darkMode
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-xl font-semibold text-sm transition-all bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Salvando...' : (editingDriver ? 'Atualizar Condutor' : 'Cadastrar Condutor')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Drivers;