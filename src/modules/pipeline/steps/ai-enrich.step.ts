import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

export interface AiEnrichment {
  nameLt: string;
  descriptionLt: string;
  wowFacts: string[];
  hook: string;
}

@Injectable()
export class AiEnrichStep {
  private readonly logger = new Logger(AiEnrichStep.name);
  private client: Anthropic | null = null;

  constructor(private readonly configService: ConfigService) {}

  private getClient(): Anthropic | null {
    if (this.client) return this.client;
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) return null;
    this.client = new Anthropic({ apiKey });
    return this.client;
  }

  async enrich(
    name: string,
    address: string | null,
    type: 'attraction' | 'restaurant',
  ): Promise<AiEnrichment> {
    const anthropic = this.getClient();

    if (!anthropic) {
      this.logger.warn('ANTHROPIC_API_KEY not set — using mock enrichment');
      return this.mockEnrichment(name, type);
    }

    const typeContext = type === 'attraction' ? 'turistinę vietą' : 'restoraną';
    const prompt = `Tu esi lietuviškas kelionių tinklaraštininkas. Pateik informaciją apie šią ${typeContext}: "${name}"${address ? ` (${address})` : ''}.

Pateik JSON formatą:
{
  "nameLt": "Vietos pavadinimas lietuviškai",
  "descriptionLt": "2-3 sakinių aprašymas lietuviškai, įdomus ir patrauklus",
  "wowFacts": ["Faktas 1 lietuviškai", "Faktas 2 lietuviškai", "Faktas 3 lietuviškai"],
  "hook": "Vienas sakinys lietuviškai, kuris priverstų žmogų lankytis"
}

Atsakyk tik JSON, be jokio papildomo teksto.`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected AI response type');
    }

    const jsonText = content.text.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    const parsed = JSON.parse(jsonText) as AiEnrichment;

    this.logger.log(`Enriched: ${name}`);
    return parsed;
  }

  private mockEnrichment(name: string, type: 'attraction' | 'restaurant'): AiEnrichment {
    if (type === 'attraction') {
      return {
        nameLt: name,
        descriptionLt: `${name} — viena įspūdingiausių vietų šiame mieste. Čia galite pamatyti istorinę architektūrą ir pajusti vietinę kultūrą.`,
        wowFacts: [
          'Ši vieta turi daugiau nei 500 metų istoriją',
          'Kasmet čia lankosi tūkstančiai turistų iš viso pasaulio',
          'Vietoje galite rasti unikalių rankdarbių ir suvenyrų',
        ],
        hook: `Aplankykite ${name} ir atraskite nepamirštamą kultūrinę patirtį!`,
      };
    }
    return {
      nameLt: name,
      descriptionLt: `${name} — puikus restoranas su autentišku vietiniu maistu. Čia galite paragauti tradicinių patiekalų ir mėgautis jaukia atmosfera.`,
      wowFacts: [
        'Šefas naudoja tik vietinius, šviežius ingredientus',
        'Restoranas žinomas dėl savo unikalių receptų',
        'Puikus pasirinkimas romantiškam vakarui ar šeimos susitikimui',
      ],
      hook: `Nepraleiskite progos paragauti autentiško maisto ${name}!`,
    };
  }
}
