import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api';

interface Usuario {
  id_usuario: number;
  nombre: string;
  apellido: string;
  email: string;
  id_rol: number;
}

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, contrasena: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [usuario, setUsuario]   = useState<Usuario | null>(null);
  const [token, setToken]       = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar sesión guardada al iniciar
  useEffect(() => {
    (async () => {
      try {
        const [savedToken, savedUser] = await AsyncStorage.multiGet(['token', 'usuario']);
        if (savedToken[1] && savedUser[1]) {
          setToken(savedToken[1]);
          setUsuario(JSON.parse(savedUser[1]));
        }
      } catch (_) {}
      finally { setIsLoading(false); }
    })();
  }, []);

  const login = async (email: string, contrasena: string) => {
    const res = await authService.login(email, contrasena);
    const { token: t, usuario: u } = res.data.data;
    await AsyncStorage.multiSet([['token', t], ['usuario', JSON.stringify(u)]]);
    setToken(t);
    setUsuario(u);
  };

  const register = async (data: any) => {
    const res = await authService.register(data);
    const { token: t, id_usuario } = res.data.data;
    // Luego del registro hacemos login automático
    await AsyncStorage.setItem('token', t);
    setToken(t);
    // Obtenemos el perfil completo
    const perfil = await authService.me();
    const u = perfil.data.data;
    await AsyncStorage.setItem('usuario', JSON.stringify(u));
    setUsuario(u);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'usuario']);
    setToken(null);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
