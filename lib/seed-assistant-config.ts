import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import {
  tentwalaQuotationAssistantConfig,
} from "@/lib/assistant-config";
import { db } from "@/lib/firebase";

export async function seedTentwalaAssistantConfig(): Promise<void> {
  const configRef = doc(
    db,
    "assistant_configs",
    tentwalaQuotationAssistantConfig.id
  );
  const configSnapshot = await getDoc(configRef);

  await setDoc(
    configRef,
    {
      ...tentwalaQuotationAssistantConfig,
      ...(configSnapshot.exists() ? {} : { createdAt: serverTimestamp() }),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
