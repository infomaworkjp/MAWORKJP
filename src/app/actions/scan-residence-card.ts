"use server";

import { ai } from "@/ai/genkit";
import { z } from "zod";

// Zod schema for Residence Card details
const ResidenceCardSchema = z.object({
  name: z.string().describe("氏名。英語（アルファベット）表記のみの場合はそのまま、漢字表記が併記されている場合は漢字を優先してください。"),
  statusOfResidence: z.string().describe("在留資格（例：技術・人文知識・国際業務、特定技能、家族滞在、留学など）"),
  expirationDate: z.string().describe("在留期間の満了日（YYYY-MM-DD 形式。例：2028-10-15）"),
  cardNumber: z.string().describe("在留カード番号（右上等に記載されている12桁の英数字。例：AB12345678CD）"),
  nationality: z.string().describe("国籍・地域（例：中国、ベトナム、フィリピン、アメリカなど）"),
  birthDate: z.string().describe("生年月日（YYYY-MM-DD 形式。例：1998-05-12）").optional(),
});

export type ResidenceCardData = z.infer<typeof ResidenceCardSchema>;

export async function scanResidenceCard(base64DataUrl: string) {
  try {
    if (!base64DataUrl) {
      throw new Error("画像データがありません");
    }

    // Call Genkit Gemini model to extract structured data
    const response = await ai.generate({
      prompt: [
        {
          text: `この在留カード（日本国政府発行）の表面の画像から、以下の項目を正確に読み取って構造化データとして抽出してください。
- 氏名 (name)
- 在留資格 (statusOfResidence)
- 在留期間の満了日 (expirationDate) -> YYYY-MM-DD 形式に正規化してください。
- 在留カード番号 (cardNumber)
- 国籍・地域 (nationality)
- 生年月日 (birthDate) -> YYYY-MM-DD 形式に正規化してください。

画像が不鮮明な場合や該当する項目が見つからない場合は、可能な限り推測して読み取るか、空文字にしてください。`,
        },
        {
          media: {
            url: base64DataUrl,
          },
        },
      ],
      output: {
        schema: ResidenceCardSchema,
      },
    });

    const result = response.output;

    if (!result) {
      throw new Error("AIからの応答を解析できませんでした");
    }

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    console.error("Residence Card scan error:", error);
    return {
      success: false,
      error: error.message || "スキャン処理中にエラーが発生しました",
    };
  }
}
