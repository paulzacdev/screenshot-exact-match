import { beforeEach, describe, expect, it, vi } from "vitest";
import { transcribeAudio, translate, aiText, SUMMARY_INSTRUCTIONS } from "../lib/ai.server";

const gateway = vi.hoisted(() => ({ transcribe: vi.fn(), respond: vi.fn() }));
vi.mock("@lovable.dev/ai-gateway", () => ({
  transcribeAudio: gateway.transcribe,
  generateResponse: gateway.respond,
  GatewayError: class extends Error {},
}));

beforeEach(() => {
  vi.clearAllMocks();
  gateway.transcribe.mockResolvedValue({ text: "Oui, oui, [miséricorde ?]… [inaudible]" });
  gateway.respond.mockResolvedValue({ output_text: "نعم، نعم، [رحمة ؟]… [inaudible]" });
});

async function transcriptionPrompt() {
  await transcribeAudio(new Uint8Array([1, 2]), "audio/webm", "fr");
  return gateway.transcribe.mock.calls[0]?.[0].prompt as string;
}

describe("Homily fidelity policy sent to the AI service", () => {
  it("requires bracketed doubts or [inaudible] and preserves returned markers", async () => {
    const text = await transcribeAudio(new Uint8Array([1, 2]), "audio/webm", "fr");
    expect(gateway.transcribe.mock.calls[0]?.[0].prompt).toContain("[miséricorde ?]) ou écris [inaudible]");
    expect(text).toBe("Oui, oui, [miséricorde ?]… [inaudible]");
  });
  it("forbids inventing or completing unclear speech", async () => {
    expect(await transcriptionPrompt()).toContain("Ne jamais inventer ni compléter ce qui n’a pas été clairement dit");
  });
  it("preserves the priest's oral repetitions and turns of phrase", async () => {
    expect(await transcriptionPrompt()).toContain("Conserve le style oral du prêtre (répétitions, tournures, etc.)");
  });
  it("restricts transcription to the homily context without guessing missing words", async () => {
    const prompt = await transcriptionPrompt();
    expect(prompt).toContain("Reste strictement dans le contexte de l’homélie");
    expect(prompt).toContain("ne doit jamais servir à deviner des mots manquants");
  });
  it("passes the original text to translation with uncertainty-preserving instructions", async () => {
    const source = "Oui, oui, [miséricorde ?]… [inaudible]";
    await translate(source, "ar");
    expect(gateway.respond.mock.calls[0]?.[0].input).toBe(source);
    expect(gateway.respond.mock.calls[0]?.[0].instructions).toContain("conserve [inaudible] tel quel");
    expect(gateway.respond.mock.calls[0]?.[0].instructions).toContain("Ne résous jamais une incertitude par déduction");
  });
  it("instructs summaries not to assert uncertain passages and to flag them", async () => {
    await aiText(SUMMARY_INSTRUCTIONS, "[miséricorde ?] [inaudible]", "medium");
    const instructions = gateway.respond.mock.calls[0]?.[0].instructions;
    expect(instructions).toContain("ne les utilise pas comme faits certains");
    expect(instructions).toContain('Signale-les dans "uncertain"');
  });
});