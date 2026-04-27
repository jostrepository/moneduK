# ============================================================
#  MoneduK ML v2 — Servidor Flask con aprendizaje incremental
#  Archivo: servidor_ml.py
#
#  Iniciar: py -3.11 servidor_ml.py
# ============================================================

from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import os
import json
import random
from datetime import datetime
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import LabelEncoder

app = Flask(__name__)
CORS(app)

# ── Archivos del modelo ───────────────────────────────────
MODELO_PATH      = "modelo_perfil.pkl"
ENCODER_PATH     = "encoder_perfil.pkl"
DATOS_REALES_PATH = "datos_reales.json"

# ── Personalidad del cerdito por perfil ───────────────────
PERSONALIDAD = {
    "Ahorrador": {
        "estado":   "feliz",
        "emoji":    "😄",
        "titulo":   "¡Eres un gran ahorrador!",
        "consejos": [
            "¡Increíble! Llevas un excelente control de tu dinero. ¡Sigue así!",
            "Tu disciplina financiera es admirable. El ahorro es la base de la riqueza.",
            "¡Tu cerdito está muy orgulloso de ti! Cada KoinK guardado cuenta.",
            "Con ese nivel de ahorro, pronto podrás invertir y hacer crecer tu dinero.",
            "¡Fantástico! Recuerda que cada KoinK ahorrado es un paso hacia tus metas.",
        ]
    },
    "Inversor": {
        "estado":   "emocionado",
        "emoji":    "🚀",
        "titulo":   "¡Eres un inversor inteligente!",
        "consejos": [
            "¡Impresionante! Sabes hacer crecer tu dinero. Las inversiones son tu fuerte.",
            "Invertir es una de las mejores decisiones financieras. ¡Sigue así!",
            "Tu dinero trabaja para ti. ¡Eso es educación financiera de verdad!",
            "Cada inversión que haces te acerca más a tus metas financieras.",
            "¡Excelente estrategia! Diversifica tus inversiones para minimizar riesgos.",
        ]
    },
    "Trabajador": {
        "estado":   "orgulloso",
        "emoji":    "💪",
        "titulo":   "¡Eres muy trabajador!",
        "consejos": [
            "¡Genial! Ganas tu dinero con esfuerzo. Eso habla muy bien de ti.",
            "El trabajo constante es la base del éxito financiero. ¡Sigue adelante!",
            "Ganar dinero trabajando es la manera más honesta. ¡Tu cerdito te admira!",
            "Ahora que tienes ingresos, piensa en ahorrar una parte cada vez que trabajes.",
            "¡Excelente ritmo de trabajo! Intenta también explorar las inversiones.",
        ]
    },
    "Apostador": {
        "estado":   "preocupado",
        "emoji":    "😟",
        "titulo":   "Tu cerdito está preocupado...",
        "consejos": [
            "Las apuestas son riesgosas. Por cada vez que ganas, puedes perder mucho más.",
            "Tu cerdito perdió salud por las apuestas. ¿Puedes darle un descanso?",
            "Recuerda: los juegos de azar están diseñados para que pierdas a la larga.",
            "En lugar de apostar, intenta invertir. ¡Tu dinero crecerá de forma segura!",
            "Cada vez que apuestas, tu cerdito sufre. ¡Cuídalo mejor!",
        ]
    },
    "Gastador": {
        "estado":   "triste",
        "emoji":    "😢",
        "titulo":   "Tu cerdito necesita tu ayuda...",
        "consejos": [
            "Estás gastando más de lo que ahorras. Intenta guardar aunque sea un poco.",
            "Recuerda la regla del 20%: guarda al menos el 20% de lo que ganas.",
            "Tu cerdito está triste porque el saldo baja mucho. ¡Ahorra un poco hoy!",
            "Antes de gastar, pregúntate: ¿lo necesito o solo lo quiero?",
            "Cada KoinK que ahorras hoy es una recompensa para ti mañana.",
        ]
    },
    "Aprendiz": {
        "estado":   "animado",
        "emoji":    "📚",
        "titulo":   "¡Estás aprendiendo!",
        "consejos": [
            "Vas por buen camino. Sigue explorando todos los módulos de MoneduK.",
            "Cada día que usas la app aprendes algo nuevo sobre el dinero. ¡Sigue así!",
            "¿Ya intentaste invertir tus KoinK? ¡Es una excelente forma de hacerlos crecer!",
            "Completa misiones para ganar más recompensas y mejorar a tu cerdito.",
            "¡Ánimo! Con práctica y constancia serás un experto financiero.",
        ]
    }
}

# ── Cargar modelo ─────────────────────────────────────────
def cargar_modelo():
    global modelo, encoder
    print("🐷 MoneduK ML — Cargando modelo...")
    print("   Cargando modelo_perfil.pkl...")
    with open(MODELO_PATH, "rb") as f:
        modelo = pickle.load(f)
    print("   ✅ modelo cargado")
    print("   Cargando encoder_perfil.pkl...")
    with open(ENCODER_PATH, "rb") as f:
        encoder = pickle.load(f)
    print("   ✅ encoder cargado")
    print("✅ Modelo cargado correctamente")

# ── Guardar datos reales para reentrenamiento ─────────────
def guardar_dato_real(features: dict, perfil_predicho: str):
    """
    Guarda los datos del usuario en un archivo JSON.
    Estos datos se usarán para reentrenar el modelo.
    """
    datos = []
    if os.path.exists(DATOS_REALES_PATH):
        with open(DATOS_REALES_PATH, "r") as f:
            try:
                datos = json.load(f)
            except:
                datos = []

    dato = {**features, "perfil": perfil_predicho, "fecha": datetime.now().isoformat()}
    datos.append(dato)

    with open(DATOS_REALES_PATH, "w") as f:
        json.dump(datos, f)

# ── Reentrenar con datos reales ───────────────────────────
def reentrenar():
    """
    Combina datos sintéticos + datos reales para reentrenar el modelo.
    Se llama automáticamente cuando hay suficientes datos nuevos.
    """
    if not os.path.exists(DATOS_REALES_PATH):
        return False

    with open(DATOS_REALES_PATH, "r") as f:
        try:
            datos_reales = json.load(f)
        except:
            return False

    if len(datos_reales) < 10:
        return False  # Necesita al menos 10 registros reales

    print(f"🔄 Reentrenando con {len(datos_reales)} datos reales...")

    import pandas as pd
    df_real = pd.DataFrame(datos_reales)

    columnas = [
        "total_ahorrado", "num_apuestas", "num_trabajos",
        "num_inversiones", "num_misiones", "salud_mascota",
        "saldo_actual", "puntaje_quiz_promedio", "ratio_gasto"
    ]

    X = df_real[columnas].fillna(0)
    y = df_real["perfil"]

    le_nuevo = LabelEncoder()
    y_enc    = le_nuevo.fit_transform(y)

    modelo_nuevo = DecisionTreeClassifier(max_depth=8, min_samples_split=3, random_state=42)
    modelo_nuevo.fit(X, y_enc)

    # Guardar nuevo modelo
    with open(MODELO_PATH, "wb") as f:
        pickle.dump(modelo_nuevo, f)
    with open(ENCODER_PATH, "wb") as f:
        pickle.dump(le_nuevo, f)

    # Recargar en memoria
    cargar_modelo()
    print("✅ Modelo reentrenado con datos reales.")
    return True

# ── Inicializar ───────────────────────────────────────────
cargar_modelo()

# ── Endpoint: predecir perfil ─────────────────────────────
@app.route("/predecir", methods=["POST"])
def predecir():
    try:
        datos = request.get_json()

        features = np.array([[
            datos.get("total_ahorrado",          0),
            datos.get("num_apuestas",            0),
            datos.get("num_trabajos",            0),
            datos.get("num_inversiones",         0),
            datos.get("num_misiones",            0),
            datos.get("salud_mascota",          50),
            datos.get("saldo_actual",            0),
            datos.get("puntaje_quiz_promedio",   0),
            datos.get("ratio_gasto",           0.5),
        ]])

        pred_encoded   = modelo.predict(features)[0]
        perfil         = encoder.inverse_transform([pred_encoded])[0]
        probabilidades = modelo.predict_proba(features)[0]
        confianza      = round(float(max(probabilidades)) * 100, 1)

        personalidad = PERSONALIDAD.get(perfil, PERSONALIDAD["Aprendiz"])
        consejo      = random.choice(personalidad["consejos"])

        # ── Guardar dato real para aprendizaje futuro ─────
        guardar_dato_real(
            {k: datos.get(k, 0) for k in [
                "total_ahorrado", "num_apuestas", "num_trabajos",
                "num_inversiones", "num_misiones", "salud_mascota",
                "saldo_actual", "puntaje_quiz_promedio", "ratio_gasto"
            ]},
            perfil
        )

        # ── Verificar si reentrenar (cada 20 datos nuevos) ─
        if os.path.exists(DATOS_REALES_PATH):
            with open(DATOS_REALES_PATH, "r") as ff:
                try:
                    n = len(json.load(ff))
                    if n > 0 and n % 20 == 0:
                        reentrenar()
                except:
                    pass

        return jsonify({
            "success":   True,
            "perfil":    perfil,
            "confianza": confianza,
            "estado":    personalidad["estado"],
            "emoji":     personalidad["emoji"],
            "titulo":    personalidad["titulo"],
            "consejo":   consejo,
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# ── Endpoint: forzar reentrenamiento manual ───────────────
@app.route("/reentrenar", methods=["POST"])
def forzar_reentrenamiento():
    exito = reentrenar()
    if exito:
        return jsonify({"success": True, "message": "Modelo reentrenado correctamente"})
    return jsonify({"success": False, "message": "No hay suficientes datos reales (mínimo 10)"}), 400

# ── Endpoint: estadísticas del modelo ────────────────────
@app.route("/stats", methods=["GET"])
def stats():
    n_datos = 0
    if os.path.exists(DATOS_REALES_PATH):
        with open(DATOS_REALES_PATH, "r") as f:
            try:
                n_datos = len(json.load(f))
            except:
                pass
    return jsonify({
        "success":           True,
        "datos_reales":      n_datos,
        "proximo_reentrenamiento": max(0, 20 - (n_datos % 20)),
        "perfiles_disponibles": list(PERSONALIDAD.keys()),
    })

# ── Salud del servidor ────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "servicio": "MoneduK ML v2 🐷"})

if __name__ == "__main__":
    print("🚀 Servidor ML v2 iniciado en http://127.0.0.1:5001")
    print("📡 Endpoints: POST /predecir | POST /reentrenar | GET /stats")
    app.run(host="127.0.0.1", port=5001, debug=False)
