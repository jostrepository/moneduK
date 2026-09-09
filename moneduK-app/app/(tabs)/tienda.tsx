//Catálogo de los accesorios customizables del cerdito con KoinK, filtrable por categoría.

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { tiendaService, walletService } from '../../services/api';
import { Colors, FontSizes, Spacing, Radii, Shadows } from '../../constants/theme';

    interface Producto {
          id_producto: number;
          nombre: string;
          descripcion: string;
          precio_koin: number;
          imagen_url: string | null;
          categoria: string;
      }

    export default function TiendaScreen() {
      const [productos, setProductos] = useState<Producto[]>([]);
      const [saldo, setSaldo] = useState(0);
      const [loading, setLoading] = useState(true);
      const [comprando, setComprando] = useState<number | null>(null);
      const [resultado, setResultado] = useState<any>(null);
      const [categoriaActiva, setCategoriaActiva] = useState('Todas');

      const fetchData = async () => {
        try {
          const [pRes, wRes] = await Promise.all([
            tiendaService.getProductos(),
            walletService.getMiWallet(), ]);

          setProductos(pRes.data.data);
          setSaldo(Number(wRes.data.data.saldo));
        } catch {
          Alert.alert('Error', 'No se pudo cargar la tienda');
        } finally {
          setLoading(false);
        }
    };

      useEffect(() => { fetchData(); }, []);

      const categorias = ['Todas', ...Array.from(new Set(productos.map(p => p.categoria)))];
      const productosFiltrados = categoriaActiva === 'Todas'
        ? productos
        : productos.filter(p => p.categoria === categoriaActiva);

      const handleComprar = (producto: Producto) => {
        if (saldo < producto.precio_koin) {
          Alert.alert('KoinK insuficientes 😕', `Necesitas ${producto.precio_koin} KoinK. Tienes ${saldo.toFixed(0)}.`);
          return;
        }
        Alert.alert(
          '¿Confirmar compra?',
          `¿Comprar "${producto.nombre}" por ${producto.precio_koin} KoinK?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Comprar 🛍️', onPress: () => confirmarCompra(producto) },
          ]
        );
      };

      const confirmarCompra = async (producto: Producto) => {
        setComprando(producto.id_producto);
        try {
          const res = await tiendaService.comprar(producto.id_producto);
          const data = res.data.data;
          setSaldo(Number(data.saldo_nuevo));
          setResultado({ producto, data });
        } catch (err: any) {
          Alert.alert('Error', err.response?.data?.message || 'No se pudo completar la compra');
        } finally {
          setComprando(null);
        }
      };

      const CATEGORIA_EMOJI: Record<string, string> = {
        'Accesorios para la mascota': '🎩',
        'Fondos de pantalla': '🖼️',
        'Marcos de perfil': '🔲',
        'Efectos especiales': '✨',
      };

      const renderProducto = ({ item }: { item: Producto }) => {
        const puedeComprar = saldo >= item.precio_koin;
        return (
          <View style={[styles.card, !puedeComprar && styles.cardDisabled]}>
            <View style={styles.cardIconWrap}>
              <Text style={styles.cardIcon}>
                {CATEGORIA_EMOJI[item.categoria] || '🛍️'}
              </Text>
            </View>
            <Text style={styles.cardNombre}>{item.nombre}</Text>
            <Text style={styles.cardDesc} numberOfLines={2}>{item.descripcion}</Text>
            <View style={styles.precioRow}>
              <Text style={[styles.precio, !puedeComprar && styles.precioRojo]}>
                🪙 {item.precio_koin}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.btn, !puedeComprar && styles.btnDisabled]}
              onPress={() => handleComprar(item)}
              disabled={comprando !== null || !puedeComprar}
            >
              {comprando === item.id_producto
                ? <ActivityIndicator color={Colors.white} size="small" />
                : <Text style={styles.btnText}>{puedeComprar ? 'Comprar' : 'Sin KoinK'}</Text>
              }
            </TouchableOpacity>
          </View>
        );
      };

      if (loading) {
        return (
          <SafeAreaView style={styles.safe}>
            <ActivityIndicator size="large" color={Colors.pinkMid} style={{ marginTop: 80 }} />
          </SafeAreaView>
        );
      }

  return (
    <SafeAreaView style={styles.safe}>

      {/* Header */}

          <View style={styles.header}>
            <Text style={styles.title}>Tienda 🏪</Text>
            <View style={styles.saldoBadge}>
              <Text style={styles.saldoText}>🪙 {Number(saldo).toFixed(0)}</Text>
            </View>
          </View>

      {/* Filtro de categorías */}

          <FlatList
            data={categorias}
            keyExtractor={item => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtros}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.filtroBtn, categoriaActiva === item && styles.filtroBtnActive]}
                onPress={() => setCategoriaActiva(item)}
              >
                <Text style={[styles.filtroText, categoriaActiva === item && styles.filtroTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />

      {/* Grid de productos */}

          <FlatList
            data={productosFiltrados}
            keyExtractor={item => String(item.id_producto)}
            numColumns={2}
            columnWrapperStyle={styles.row}
            renderItem={renderProducto}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🛒</Text>
                <Text style={styles.emptyText}>No hay productos en esta categoría</Text>
              </View>
            }
          />

      {/* Modal de compra exitosa */}
      
          <Modal visible={!!resultado} transparent animationType="fade">
            <View style={styles.overlay}>
              <View style={styles.modal}>
                <Text style={styles.modalEmoji}>🎉</Text>
                <Text style={styles.modalTitle}>¡Compra exitosa!</Text>
                <Text style={styles.modalItem}>{resultado?.producto?.nombre}</Text>
                <Text style={styles.modalSaldo}>
                  Saldo restante: 🪙 {Number(resultado?.data?.saldo_nuevo).toFixed(0)} KoinK
                </Text>
                <TouchableOpacity style={styles.modalBtn} onPress={() => setResultado(null)}>
                  <Text style={styles.modalBtnText}>¡Genial! 🐷</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      );
  }



const styles = StyleSheet.create({
  
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  title: { fontSize: FontSizes.xl, fontWeight: '900', color: Colors.textPrimary },
  saldoBadge: { backgroundColor: Colors.yellowLight, borderRadius: Radii.full, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: Colors.yellow + '80' },
  saldoText: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.yellowDark },

  filtros: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, gap: 8 },
  filtroBtn: { borderRadius: Radii.full, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border },
  filtroBtnActive:{ backgroundColor: Colors.pinkMid, borderColor: Colors.pinkMid },
  filtroText: { fontSize: FontSizes.xs, fontWeight: '700', color: Colors.textMuted },
  filtroTextActive: { color: Colors.white },

  list: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl },
  row:  { justifyContent: 'space-between', marginBottom: Spacing.sm },

  card: { width: '48%', backgroundColor: Colors.white, borderRadius: Radii.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', ...Shadows.sm },
  cardDisabled: { opacity: 0.6 },
  cardIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.pinkLight, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  cardIcon: { fontSize: 32 },
  cardNombre: { fontSize: FontSizes.sm, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', marginBottom: 4 },
  cardDesc: { fontSize: FontSizes.xs, color: Colors.textMuted, textAlign: 'center', lineHeight: 16, marginBottom: Spacing.sm },
  precioRow: { marginBottom: Spacing.sm },
  precio: { fontSize: FontSizes.md, fontWeight: '900', color: Colors.yellowDark },
  precioRojo: { color: Colors.error },

  btn: { backgroundColor: Colors.pinkMid, borderRadius: Radii.full, height: 36, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', width: '100%' },
  btnDisabled: { backgroundColor: Colors.textMuted },
  btnText: { fontSize: FontSizes.xs, fontWeight: '700', color: Colors.white },

  empty: { alignItems: 'center', paddingTop: Spacing.xxl },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: FontSizes.md, color: Colors.textMuted, marginTop: Spacing.sm },

  overlay: { flex: 1, backgroundColor: Colors.overlay, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  modal: { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: Spacing.xl, width: '100%', alignItems: 'center', ...Shadows.lg },
  modalEmoji: { fontSize: 56, marginBottom: Spacing.sm },
  modalTitle: { fontSize: FontSizes.xl, fontWeight: '900', color: Colors.textPrimary },
  modalItem: { fontSize: FontSizes.md, color: Colors.textSecondary, marginTop: 4, marginBottom: Spacing.md },
  modalSaldo: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontWeight: '600', marginBottom: Spacing.lg },
  modalBtn:  { backgroundColor: Colors.pinkMid, borderRadius: Radii.full, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, width: '100%', alignItems: 'center' },
  modalBtnText: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.white },

});
