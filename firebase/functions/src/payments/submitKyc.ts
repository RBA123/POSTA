import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

/**
 * submitKyc — Callable Cloud Function
 *
 * Collects and validates KYC data for Ecuador dLocal payments.
 * MVP: format validation only — dLocal verifies identity at payment time.
 */

const DOCUMENT_VALIDATORS: Record<string, (v: string) => boolean> = {
  CI: (v) => /^\d{10}$/.test(v),
  RUC: (v) => /^\d{13}$/.test(v),
  PASS: (v) => /^[A-Za-z0-9]{7,12}$/.test(v),
  CE: (v) => v.trim().length > 0,
};

export const submitKyc = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Debes iniciar sesión",
      );
    }

    const userId = context.auth.uid;
    const { documentType, documentNumber, fullName, address } = data;

    // Validate required fields
    if (!documentType || !documentNumber || !fullName || !address) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Todos los campos son obligatorios",
      );
    }

    // Validate document type
    const validTypes = ["CI", "RUC", "PASS", "CE"];
    if (!validTypes.includes(documentType)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Tipo de documento inválido",
      );
    }

    // Validate document number format
    const validator = DOCUMENT_VALIDATORS[documentType];
    if (!validator(documentNumber)) {
      const formatHints: Record<string, string> = {
        CI: "La cédula debe tener 10 dígitos",
        RUC: "El RUC debe tener 13 dígitos",
        PASS: "El pasaporte debe tener entre 7 y 12 caracteres alfanuméricos",
        CE: "El número de documento no puede estar vacío",
      };
      throw new functions.https.HttpsError(
        "invalid-argument",
        formatHints[documentType] || "Formato de documento inválido",
      );
    }

    // Validate fullName and address are non-empty strings
    if (typeof fullName !== "string" || fullName.trim().length < 2) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "El nombre completo es obligatorio",
      );
    }

    if (typeof address !== "string" || address.trim().length < 5) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "La dirección es obligatoria",
      );
    }

    // Store KYC data on user document
    const userRef = admin.firestore().collection("users").doc(userId);

    await userRef.update({
      kycStatus: "verified",
      kycDocumentType: documentType,
      kycDocumentNumber: documentNumber.trim(),
      kycFullName: fullName.trim(),
      kycAddress: address.trim(),
      kycCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("✅ KYC verified for user:", userId, { documentType });

    return { success: true, kycStatus: "verified" };
  });
