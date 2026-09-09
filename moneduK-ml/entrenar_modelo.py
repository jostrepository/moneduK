# ============================================================
#  MoneduK Machine Learning: Entrenamiento del modelo de clasificación
#  Archivo: entrenar_modelo.py
#
#  Ejecutar una sola vez (o cuando haya datos nuevos):
#  python entrenar_modelo.py
# ============================================================

import numpy as np
import pandas as pd
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib
import os


# Semilla para reproducibilidad

np.random.seed(42)
N = 500 # usuarios sintéticos

print("🐷 MoneduK Machine Learning, Generando datos de entrenamiento...")


# Generar datos sintéticos realistas
# Cada fila representa el comportamiento acumulado de un usuario

data = {
    # KoinK ahorrados en total
    "total_ahorrado": np.random.randint(0, 2000, N),

    # Número de apuestas realizadas
    "num_apuestas": np.random.randint(0, 30, N),

    # Número de trabajos completados
    "num_trabajos": np.random.randint(0, 50, N),

    # Número de inversiones creadas
    "num_inversiones": np.random.randint(0, 15, N),

    # Número de misiones completadas
    "num_misiones": np.random.randint(0, 8, N),

    # Salud actual de la mascota (0-100)
    "salud_mascota": np.random.randint(0, 100, N),

    # Saldo actual de KoinK
    "saldo_actual": np.random.randint(0, 3000, N),

    # Puntaje promedio del quiz (0-5)
    "puntaje_quiz_promedio": np.round(np.random.uniform(0, 5, N), 1),

    # Proporción de gasto vs ingreso (0=todo ahorra, 1=todo gasta)
    "ratio_gasto": np.round(np.random.uniform(0, 1, N), 2),
}

df = pd.DataFrame(data)


# Función para asignar perfil según comportamiento 
def asignar_perfil(row):
    ahorro = row["total_ahorrado"]
    apuestas = row["num_apuestas"]
    trabajos = row["num_trabajos"]
    inversiones = row["num_inversiones"]
    misiones = row["num_misiones"]
    salud = row["salud_mascota"]
    saldo = row["saldo_actual"]
    quiz = row["puntaje_quiz_promedio"]
    ratio = row["ratio_gasto"]

    # Perfil de ahorrador: ahorra mucho, pocas apuestas, buena salud
    if ahorro > 800 and apuestas < 5 and salud > 70 and ratio < 0.4:
        return "Ahorrador"

    # Perfil de inversor: muchas inversiones, misiones completadas, buen quiz
    if inversiones > 5 and misiones > 3 and quiz > 3.5 and saldo > 500:
        return "Inversor"

    # Perfil de trabajador: muchos trabajos, ingresos constantes
    if trabajos > 20 and misiones > 2 and ratio < 0.6:
        return "Trabajador"

    # Perfil de apostador: muchas apuestas, salud baja, poco ahorro
    if apuestas > 10 and salud < 40 and ahorro < 300:
        return "Apostador"

    # Perfil de gastador: ratio alto, poco saldo, pocas misiones
    if ratio > 0.7 and saldo < 200 and misiones < 2:
        return "Gastador"

    # Perfil de aprendiz: comportamiento mixto, promedio general
    return "Aprendiz"


df["perfil"] = df.apply(asignar_perfil, axis=1)

print(f"\n📊 Distribución de perfiles en datos de entrenamiento:")
print(df["perfil"].value_counts())


# Preparar features y etiquetas

X = df.drop(columns=["perfil"])
y = df["perfil"]

le = LabelEncoder()
y_encoded = le.fit_transform(y)


# Dividir en entrenamiento y prueba

X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded, test_size=0.2, random_state=42
)


# Entrenar modelo (árbol de decisión)

print("\n🧠 Entrenando modelo de clasificación...")
modelo = DecisionTreeClassifier(
    max_depth=8,
    min_samples_split=5,
    random_state=42
)
modelo.fit(X_train, y_train)


# Evaluar el modelo

y_pred = modelo.predict(X_test)
print("\n📈 Reporte de clasificación:")
print(classification_report(
    y_test, y_pred,
    target_names=le.classes_
))


# Guardar el modelo y encoder

import pickle
with open("modelo_perfil.pkl", "wb") as f:
    pickle.dump(modelo, f)
with open("encoder_perfil.pkl", "wb") as f:
    pickle.dump(le, f)
print("✅ Modelo guardado: modelo_perfil.pkl")
print("✅ Encoder guardado: encoder_perfil.pkl")
print("\n🐷 ¡Entrenamiento completado! Ya puedes iniciar el servidor con:")
print("   python servidor_ml.py")
