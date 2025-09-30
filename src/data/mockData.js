// Dados mock para desenvolvimento - TEMPORARY
export const mockFuelData = [
  {
    id: '1',
    condutor: 'João Silva',
    setor: 'Operacional',
    supervisor: 'Maria Santos',
    equipe: 'Equipe Alpha',
    regiao: 'Sul',
    data: '2024-01-15',
    litros: 45.2,
    valor: 287.5,
    kmRodados: 380,
    veiculo: 'Honda Civic',
    placa: 'ABC-1234',
    empresa: 'Teste Corp'
  },
  {
    id: '2',
    condutor: 'Ana Costa',
    setor: 'Administrativo',
    supervisor: 'Carlos Lima',
    equipe: 'Equipe Beta',
    regiao: 'Norte',
    data: '2024-01-14',
    litros: 52.8,
    valor: 335.2,
    kmRodados: 420,
    veiculo: 'Toyota Corolla',
    placa: 'DEF-5678',
    empresa: 'Teste Corp'
  },
  {
    id: '3',
    condutor: 'Pedro Oliveira',
    setor: 'Vendas',
    supervisor: 'Ana Rodrigues',
    equipe: 'Equipe Gamma',
    regiao: 'Centro-Oeste',
    data: '2024-01-13',
    litros: 38.5,
    valor: 244.8,
    kmRodados: 315,
    veiculo: 'Volkswagen Polo',
    placa: 'GHI-9012',
    empresa: 'Teste Corp'
  },
  {
    id: '4',
    condutor: 'Mariana Santos',
    setor: 'TI',
    supervisor: 'Roberto Silva',
    equipe: 'Equipe Alpha',
    regiao: 'Sudeste',
    data: '2024-01-12',
    litros: 41.7,
    valor: 265.1,
    kmRodados: 350,
    veiculo: 'Hyundai HB20',
    placa: 'JKL-3456',
    empresa: 'Teste Corp'
  },
  {
    id: '5',
    condutor: 'Lucas Ferreira',
    setor: 'Operacional',
    supervisor: 'Maria Santos',
    equipe: 'Equipe Beta',
    regiao: 'Nordeste',
    data: '2024-01-11',
    litros: 47.3,
    valor: 300.4,
    kmRodados: 395,
    veiculo: 'Chevrolet Onix',
    placa: 'MNO-7890',
    empresa: 'Teste Corp'
  },
  {
    id: '6',
    condutor: 'Sandra Lima',
    setor: 'Vendas',
    supervisor: 'Ana Rodrigues',
    equipe: 'Equipe Gamma',
    regiao: 'Sul',
    data: '2024-01-10',
    litros: 39.8,
    valor: 252.9,
    kmRodados: 325,
    veiculo: 'Ford Ka',
    placa: 'PQR-1357',
    empresa: 'Teste Corp'
  },
  {
    id: '7',
    condutor: 'Carlos Mendes',
    setor: 'Operacional',
    supervisor: 'Maria Santos',
    equipe: 'Equipe Alpha',
    regiao: 'Norte',
    data: '2024-01-09',
    litros: 49.1,
    valor: 312.1,
    kmRodados: 405,
    veiculo: 'Nissan March',
    placa: 'STU-2468',
    empresa: 'Teste Corp'
  },
  {
    id: '8',
    condutor: 'Fernanda Silva',
    setor: 'Administrativo',
    supervisor: 'Carlos Lima',
    equipe: 'Equipe Beta',
    regiao: 'Centro-Oeste',
    data: '2024-01-08',
    litros: 43.6,
    valor: 277.3,
    kmRodados: 360,
    veiculo: 'Fiat Argo',
    placa: 'VWX-3579',
    empresa: 'Teste Corp'
  },
  {
    id: '9',
    condutor: 'Ricardo Pereira',
    setor: 'TI',
    supervisor: 'Roberto Silva',
    equipe: 'Equipe Delta',
    regiao: 'Sudeste',
    data: '2024-01-07',
    litros: 36.4,
    valor: 231.4,
    kmRodados: 298,
    veiculo: 'Renault Logan',
    placa: 'YZA-4680',
    empresa: 'Teste Corp'
  },
  {
    id: '10',
    condutor: 'Patricia Alves',
    setor: 'Vendas',
    supervisor: 'Ana Rodrigues',
    equipe: 'Equipe Gamma',
    regiao: 'Nordeste',
    data: '2024-01-06',
    litros: 44.9,
    valor: 285.6,
    kmRodados: 372,
    veiculo: 'Peugeot 208',
    placa: 'BCD-5791',
    empresa: 'Teste Corp'
  }
];

export const mockDrivers = [
  {
    id: '1',
    matricula: '001',
    nome: 'João Silva',
    formaPagamento: 'PIX',
    chavePix: 'joao.silva@email.com',
    cpf: '123.456.789-00',
    email: 'joao.silva@teste.com',
    setor: 'Operacional',
    unidade: 'Matriz',
    supervisor: 'Maria Santos',
    veiculo: {
      marca: 'Honda',
      modelo: 'Civic',
      cor: 'Branco',
      ano: '2020',
      placa: 'ABC-1234'
    },
    status: 'ativo',
    empresa: 'Teste Corp'
  },
  {
    id: '2',
    matricula: '002',
    nome: 'Ana Costa',
    formaPagamento: 'PIX',
    chavePix: 'ana.costa@email.com',
    cpf: '987.654.321-00',
    email: 'ana.costa@teste.com',
    setor: 'Administrativo',
    unidade: 'Matriz',
    supervisor: 'Carlos Lima',
    veiculo: {
      marca: 'Toyota',
      modelo: 'Corolla',
      cor: 'Prata',
      ano: '2019',
      placa: 'DEF-5678'
    },
    status: 'ativo',
    empresa: 'Teste Corp'
  }
];

// Mock para substituir chamadas Firebase
export const mockFirebaseOperations = {
  // Mock para collection queries
  getDocs: async (collection) => {
    console.log('Mock getDocs called for:', collection);

    if (collection.includes('fuelConsumption')) {
      return {
        docs: mockFuelData.map(item => ({
          id: item.id,
          data: () => item
        }))
      };
    }

    if (collection.includes('drivers')) {
      return {
        docs: mockDrivers.map(item => ({
          id: item.id,
          data: () => item
        }))
      };
    }

    return { docs: [] };
  },

  // Mock para add document
  addDoc: async (collection, data) => {
    console.log('Mock addDoc called:', collection, data);
    return {
      id: `mock-${Date.now()}`,
      ...data
    };
  },

  // Mock para update document
  updateDoc: async (docRef, data) => {
    console.log('Mock updateDoc called:', docRef, data);
    return Promise.resolve();
  },

  // Mock para delete document
  deleteDoc: async (docRef) => {
    console.log('Mock deleteDoc called:', docRef);
    return Promise.resolve();
  }
};