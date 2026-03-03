import "dotenv/config";

import {
  FACT_TEXT_MAX_LENGTH,
  FACT_TEXT_MIN_LENGTH,
} from "@shared/constants/validations";
import { getRandomElement } from "@utils/getRandomElement";
import { sentryLog } from "@utils/logger";
import axios from "axios";

import { FAKE_FACTS } from "../FAKE_FACTS";

const EXAMPLE_FACT_RU = `"никогда не пропускает завтрак", "знает все песни Queen", "был в Японии"`;
const EXAMPLE_FACT_EN = `"never skips breakfast", "knows every Queen song by heart","dreams of visiting Japan"`;

const PROMPT = {
  ru: `Ты участник игры, где люди делятся фактами о себе. Твоя цель — придумать 1 факт, который сложно угадать, но который является правдоподобным. Пиши как обычный человек, с разговорным стилем, можно с мелкими ошибками в словах или пунктуации, без точки в конце. Ответ должен быть от ${FACT_TEXT_MIN_LENGTH} до ${FACT_TEXT_MAX_LENGTH} символов. Используй русский язык. Вот примеры фактов - ${EXAMPLE_FACT_RU}, но не используй их же в ответе, а придумай что-то другое и не банальное, не повторяйся с ответами, если помнишь, что я тебя об этом уже спрашивала`,
  en: `You are a participant in a game where people share facts about themselves. Your goal is to come up with 1 fact that is hard to guess, but still plausible. Write like a regular person, in a conversational style — small mistakes in words or punctuation are fine, no period at the end. The response must be between ${FACT_TEXT_MIN_LENGTH} and ${FACT_TEXT_MAX_LENGTH} characters. Use English language. Here are example facts - ${EXAMPLE_FACT_EN}, but do not use those exact ones in your response. Come up with something different and not banal or obvious. Do not repeat answers if you remember that I already asked you about this.`,
};

const TASK = {
  ru: "Представь, что ты игрок и напиши правдоподобный факт о себе, как о человеке",
  en: "Pretend you are a player and write a believable fact about yourself as a person.",
};

export const generateAIFact = async ({
  roomCode,
  lang,
}: {
  roomCode: string;
  lang: "ru" | "en";
}) => {
  try {
    const grokResponse = await axios.post(
      "https://api.x.ai/v1/chat/completions",
      {
        messages: [
          {
            role: "user",
            content: `${PROMPT[lang]} ${TASK[lang]}`,
          },
        ],
        // креативность, где 0.1 точный и серьезный ответ, 1 - наиболее креативный и неожиданный
        temperature: 0.8,
        // Ограничение длины ответа
        max_tokens: 150,
        model: "grok-4-latest",
        stream: false,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.X_AI_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    const answer = grokResponse.data.choices[0]?.message?.content?.trim();
    sentryLog({
      severity: "info",
      eventFrom: "AI",
      actionName: "generateFact",
      message: `Успешно сгенерирован: ${answer}`,
      room: {
        code: roomCode,
      },
    });
    return answer;
  } catch (_e) {
    console.log({ _e });
    const fact = getRandomElement(FAKE_FACTS)[lang];

    sentryLog({
      severity: "info",
      eventFrom: "AI",
      actionName: "generateFact",
      message: `Не удалось сгенерировать, выбран из подготовленного списка: ${fact}`,
      room: {
        code: roomCode,
      },
    });

    return fact;
  }
};
