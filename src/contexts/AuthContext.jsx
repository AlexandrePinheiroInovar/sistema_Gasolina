import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

// Mock users for testing - TEMPORARY SOLUTION
const MOCK_USERS = [
  {
    email: 'admin@teste.com',
    password: 'admin123',
    uid: 'admin-uid-123',
    profile: {
      nome: 'Administrador',
      email: 'admin@teste.com',
      setor: 'TI',
      empresa: 'Teste Corp',
      role: 'admin',
      createdAt: new Date().toISOString(),
      isActive: true
    }
  },
  {
    email: 'user@teste.com',
    password: 'user123',
    uid: 'user-uid-456',
    profile: {
      nome: 'Usuário Comum',
      email: 'user@teste.com',
      setor: 'Operacional',
      empresa: 'Teste Corp',
      role: 'user',
      createdAt: new Date().toISOString(),
      isActive: true
    }
  }
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock login function
  const login = async (email, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const mockUser = MOCK_USERS.find(u => u.email === email && u.password === password);

        if (mockUser) {
          const userCredential = {
            user: {
              uid: mockUser.uid,
              email: mockUser.email,
              emailVerified: true
            }
          };

          // Simulate successful login
          setUser(userCredential.user);
          setUserProfile(mockUser.profile);

          // Save to localStorage for persistence
          localStorage.setItem('mockUser', JSON.stringify(userCredential.user));
          localStorage.setItem('mockUserProfile', JSON.stringify(mockUser.profile));

          resolve(userCredential);
        } else {
          reject(new Error('Credenciais inválidas'));
        }
      }, 1000); // Simulate network delay
    });
  };

  const logout = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        setUser(null);
        setUserProfile(null);
        localStorage.removeItem('mockUser');
        localStorage.removeItem('mockUserProfile');
        resolve();
      }, 500);
    });
  };

  const createUser = async (email, password, userData) => {
    // Mock user creation - in real app this would create in Firebase
    return new Promise((resolve) => {
      setTimeout(() => {
        const newUser = {
          uid: `mock-${Date.now()}`,
          email,
          emailVerified: true
        };
        resolve({ user: newUser });
      }, 1000);
    });
  };

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('mockUser');
    const savedProfile = localStorage.getItem('mockUserProfile');

    if (savedUser && savedProfile) {
      try {
        setUser(JSON.parse(savedUser));
        setUserProfile(JSON.parse(savedProfile));
      } catch (error) {
        console.error('Erro ao recuperar sessão:', error);
        localStorage.removeItem('mockUser');
        localStorage.removeItem('mockUserProfile');
      }
    }

    setLoading(false);
  }, []);

  const value = {
    user,
    userProfile,
    login,
    logout,
    createUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};