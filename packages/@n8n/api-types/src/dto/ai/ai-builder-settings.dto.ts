import { z } from 'zod';
import { Z } from 'zod-class';

export const aiBuilderProviderSchema = z.enum(['anthropic', 'openai']);

export class AiBuilderSettingsRequestDto extends Z.class({
	provider: aiBuilderProviderSchema.optional(),
	baseUrl: z.string().optional(),
	apiKey: z.string().optional(),
	clearApiKey: z.boolean().optional(),
	useResponsesApi: z.boolean().optional(),
}) {}

export class AiBuilderSettingsResponseDto extends Z.class({
	provider: aiBuilderProviderSchema,
	baseUrl: z.string(),
	hasApiKey: z.boolean(),
	useResponsesApi: z.boolean(),
}) {}

export type AiBuilderProvider = z.infer<typeof aiBuilderProviderSchema>;
