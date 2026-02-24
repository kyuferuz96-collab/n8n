import type {
	AiBuilderProvider,
	AiBuilderSettingsRequestDto,
	AiBuilderSettingsResponseDto,
} from '@n8n/api-types';
import { SettingsRepository } from '@n8n/db';
import { Service } from '@n8n/di';

import { CacheService } from '@/services/cache/cache.service';

const PROVIDER_KEY = 'ai.builder.provider';
const BASE_URL_KEY = 'ai.builder.baseUrl';
const API_KEY_KEY = 'ai.builder.apiKey';
const USE_RESPONSES_API_KEY = 'ai.builder.useResponsesApi';

type BuilderSettings = {
	provider: AiBuilderProvider;
	baseUrl: string;
	apiKey: string;
	useResponsesApi: boolean;
};

type BuilderRuntimeConfig = BuilderSettings & {
	hasApiKey: boolean;
};

@Service()
export class AiBuilderSettingsService {
	constructor(
		private readonly settingsRepository: SettingsRepository,
		private readonly cacheService: CacheService,
	) {}

	private normalizeProvider(provider: string | undefined): AiBuilderProvider {
		return provider?.trim().toLowerCase() === 'openai' ? 'openai' : 'anthropic';
	}

	private getDefaultApiKey(provider: AiBuilderProvider): string {
		if (provider === 'openai') {
			return process.env.N8N_AI_OPENAI_KEY?.trim() ?? '';
		}

		return process.env.N8N_AI_ANTHROPIC_KEY?.trim() ?? '';
	}

	private async getStoredValue(key: string): Promise<string | undefined> {
		const cachedValue = await this.cacheService.get<string>(key);
		if (cachedValue !== undefined) return cachedValue;

		const row = await this.settingsRepository.findByKey(key);
		if (row === null) return undefined;

		if (row.value) {
			await this.cacheService.set(key, row.value);
		}

		return row.value;
	}

	private async setStoredValue(key: string, value: string): Promise<void> {
		await this.settingsRepository.upsert({ key, value, loadOnStartup: true }, ['key']);

		if (value) {
			await this.cacheService.set(key, value);
		} else {
			await this.cacheService.delete(key);
		}
	}

	private async getBuilderSettings(): Promise<BuilderSettings> {
		const storedProvider = await this.getStoredValue(PROVIDER_KEY);
		const provider = this.normalizeProvider(storedProvider ?? process.env.N8N_AI_PROVIDER);

		const storedBaseUrl = await this.getStoredValue(BASE_URL_KEY);
		const baseUrl = (storedBaseUrl ?? process.env.N8N_AI_LLM_BASE_URL ?? '')
			.trim()
			.replace(/\/$/, '');

		const storedApiKey = await this.getStoredValue(API_KEY_KEY);
		const apiKey = (storedApiKey ?? this.getDefaultApiKey(provider)).trim();

		const storedUseResponsesApi = await this.getStoredValue(USE_RESPONSES_API_KEY);
		const useResponsesApi =
			storedUseResponsesApi === undefined ? true : storedUseResponsesApi === 'true';

		return {
			provider,
			baseUrl,
			apiKey,
			useResponsesApi,
		};
	}

	async getRuntimeConfig(): Promise<BuilderRuntimeConfig> {
		const settings = await this.getBuilderSettings();
		const hasApiKey = settings.apiKey.length > 0;

		return {
			...settings,
			hasApiKey,
		};
	}

	async getFrontendSettings(): Promise<AiBuilderSettingsResponseDto> {
		const settings = await this.getRuntimeConfig();

		return {
			provider: settings.provider,
			baseUrl: settings.baseUrl,
			hasApiKey: settings.hasApiKey,
			useResponsesApi: settings.useResponsesApi,
		};
	}

	async updateSettings(
		payload: AiBuilderSettingsRequestDto,
	): Promise<AiBuilderSettingsResponseDto> {
		const current = await this.getRuntimeConfig();

		const provider = payload.provider ? this.normalizeProvider(payload.provider) : current.provider;
		const baseUrl =
			payload.baseUrl !== undefined ? payload.baseUrl.trim().replace(/\/$/, '') : current.baseUrl;
		const useResponsesApi = payload.useResponsesApi ?? current.useResponsesApi;

		let apiKey = current.apiKey;
		if (payload.clearApiKey === true) {
			apiKey = '';
		} else if (payload.apiKey !== undefined) {
			apiKey = payload.apiKey.trim();
		}

		await this.setStoredValue(PROVIDER_KEY, provider);
		await this.setStoredValue(BASE_URL_KEY, baseUrl);
		await this.setStoredValue(USE_RESPONSES_API_KEY, useResponsesApi.toString());

		if (payload.clearApiKey === true || payload.apiKey !== undefined) {
			await this.setStoredValue(API_KEY_KEY, apiKey);
		}

		return {
			provider,
			baseUrl,
			hasApiKey: apiKey.length > 0,
			useResponsesApi,
		};
	}
}
