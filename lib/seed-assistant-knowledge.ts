import { doc, getDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import {
  tentwalaKnowledgeBase,
  tentwalaKnowledgeChunks,
} from "@/lib/assistant-knowledge";
import { db } from "@/lib/firebase";

export async function seedTentwalaKnowledgeBase(): Promise<void> {
  const batch = writeBatch(db);

  const knowledgeBaseRef = doc(
    db,
    "assistant_knowledge_bases",
    tentwalaKnowledgeBase.id
  );
  const knowledgeBaseSnapshot = await getDoc(knowledgeBaseRef);

  batch.set(
    knowledgeBaseRef,
    {
      ...tentwalaKnowledgeBase,
      ...(knowledgeBaseSnapshot.exists() ? {} : { createdAt: serverTimestamp() }),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  for (const chunk of tentwalaKnowledgeChunks) {
    const chunkRef = doc(db, "assistant_knowledge_chunks", chunk.id);
    const chunkSnapshot = await getDoc(chunkRef);

    batch.set(
      chunkRef,
      {
        ...chunk,
        ...(chunkSnapshot.exists() ? {} : { createdAt: serverTimestamp() }),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  await batch.commit();
}
