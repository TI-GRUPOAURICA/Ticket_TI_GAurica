export const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    estado: {
      type: "string"
    },

    salud: {
      type: "number"
    },

    requiere_reemplazo: {
      type: "boolean"
    },

    requiere_upgrade: {
      type: "boolean"
    },

    vida_util: {
      type: "string"
    },

    resumen: {
      type: "string"
    },

    recomendaciones: {
      type: "array",
      items: {
        type: "string"
      }
    }
  },

  required: [
    "estado",
    "salud",
    "requiere_reemplazo",
    "requiere_upgrade",
    "vida_util",
    "resumen",
    "recomendaciones"
  ]
};