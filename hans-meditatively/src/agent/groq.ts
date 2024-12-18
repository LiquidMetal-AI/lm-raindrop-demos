export type GroqParams = {
  apiKey: string;
};

export type HaikuRequest = {
  about: string;
  twist: string;
};

export class Groq {
  constructor(private params: GroqParams) {}

  async haiku({ about, twist }: HaikuRequest): Promise<{ haiku: string }> {
    const reasoningResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.params.apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are a world-class haiku poet. Generate a haiku based on the following requirements:

- The haiku must have exactly three lines
- First line must have exactly 5 syllables
- Second line must have exactly 7 syllables
- Third line must have exactly 5 syllables
- First two lines should express ideas from this text: {about}
- Last line should express this unexpected twist: {twist}
- Use vivid imagery and natural elements when possible
- Ensure proper syllable count by counting carefully

Do not explain the haiku or provide any additional text. Only output the three lines of the haiku.

Example input:
about: peaceful garden with butterflies
twist: storm approaching

Example output:
Flowers dance with wings
Butterflies paint the garden
Thunder rolls above`,
            },
            {
              role: "user",
              content: `Now generate a haiku for:
about: ${about}
twist: ${twist}`,
            },
          ],
          temperature: 0.7,
        }),
      }
    );

    const responseBody = await reasoningResponse.text();

    console.log({
      msg: "got groq response",
      application: "hans-meditatively",
      responseBody,
    });

    return {
      haiku: responseBody,
    };
  }
}
