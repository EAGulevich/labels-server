import process from "node:process";

import {
  FACT_TEXT_MAX_LENGTH,
  FACT_TEXT_MIN_LENGTH,
} from "@shared/constants/validations";
import { getRandomElement } from "@utils/getRandomElement";
import { sentryLog } from "@utils/logger";
import axios from "axios";

import { FAKE_FACTS } from "../FAKE_FACTS";

const PROMPT = {
  ru: `Ты участник игры, где люди делятся фактами о себе. Твоя цель — придумать факт, который сложно угадать, но который является правдоподобным. Пиши как обычный человек, с разговорным стилем, можно с мелкими ошибками в словах или пунктуации, без точки в конце.. Ответ должен быть от ${FACT_TEXT_MIN_LENGTH} до ${FACT_TEXT_MAX_LENGTH} символов. Используй русский язык`,
  en: `You're participating in a game where people share facts about themselves. Your goal is to come up with a fact that's hard to guess. Write like a normal person, in a conversational style, with minor spelling or punctuation errors, and without a period at the end. The answer must be between ${FACT_TEXT_MIN_LENGTH} and ${FACT_TEXT_MAX_LENGTH} characters.Use English`,
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
  console.log(lang);
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
        temperature: 0.8, // креативность, где 0.1 точный и серьезный ответ, 1 - наиболее креативный и неожиданный
        max_tokens: 150, // Ограничение длины ответа
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
