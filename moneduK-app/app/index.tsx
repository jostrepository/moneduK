//Punto de entrada o router"inicial. Consulta useAuth() para saber si hay algún token
//  guardado: si está cargando muestra un spinner, si hay token se redirige a el menú tabs, si no hay token redirige 
// a menú de bienvenida auth. Decide si ya se inició la sesión.

import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { Colors } from '../constants/theme';

      export default function Index() {
        const { token, isLoading } = useAuth();

        if (isLoading) {
          return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
              <ActivityIndicator size="large" color={Colors.pinkMid} />
            </View>
          );
        }

        return token
          ? <Redirect href="/(tabs)/menu" />
          : <Redirect href="/(auth)/welcome" />;
    }