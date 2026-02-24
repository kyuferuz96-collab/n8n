import { mockInstance } from '@n8n/backend-test-utils';
import type { Settings } from '@n8n/db';
import { SettingsRepository } from '@n8n/db';

import { AiBuilderSettingsService } from '@/services/ai-builder-settings.service';
import { CacheService } from '@/services/cache/cache.service';

describe('AiBuilderSettingsService', () => {
	const settingsRepository = mockInstance(SettingsRepository);
	const cacheService = mockInstance(CacheService);
	const originalEnv = process.env;

	const service = new AiBuilderSettingsService(settingsRepository, cacheService);

	const setStoredSettings = (values: Partial<Record<string, string>>) => {
		settingsRepository.findByKey.mockImplementation(async (key: string) => {
			if (!(key in values)) return null;
			return { value: values[key] } as Settings;
		});
	};

	beforeEach(() => {
		process.env = { ...originalEnv };
		jest.clearAllMocks();
		cacheService.get.mockResolvedValue(undefined);
		cacheService.set.mockResolvedValue(undefined);
		cacheService.delete.mockResolvedValue(undefined);
	});

	afterAll(() => {
		process.env = originalEnv;
	});

	describe('getRuntimeConfig()', () => {
		it('should use environment defaults when no stored values exist', async () => {
			process.env.N8N_AI_PROVIDER = 'openai';
			process.env.N8N_AI_OPENAI_KEY = 'env-openai-key';
			process.env.N8N_AI_LLM_BASE_URL = 'https://api.openai.com/v1';
			setStoredSettings({});

			const result = await service.getRuntimeConfig();

			expect(result).toEqual({
				provider: 'openai',
				baseUrl: 'https://api.openai.com/v1',
				apiKey: 'env-openai-key',
				hasApiKey: true,
				useResponsesApi: true,
			});
		});

		it('should prefer stored values over environment values', async () => {
			process.env.N8N_AI_PROVIDER = 'anthropic';
			process.env.N8N_AI_ANTHROPIC_KEY = 'env-anthropic-key';
			setStoredSettings({
				'ai.builder.provider': 'openai',
				'ai.builder.baseUrl': 'https://gateway.example.com/v1/',
				'ai.builder.apiKey': 'db-key',
				'ai.builder.useResponsesApi': 'false',
			});

			const result = await service.getRuntimeConfig();

			expect(result).toEqual({
				provider: 'openai',
				baseUrl: 'https://gateway.example.com/v1',
				apiKey: 'db-key',
				hasApiKey: true,
				useResponsesApi: false,
			});
		});
	});

	describe('updateSettings()', () => {
		it('should persist provider, baseUrl and responses toggle', async () => {
			setStoredSettings({});
			settingsRepository.upsert.mockResolvedValue(undefined as never);

			const result = await service.updateSettings({
				provider: 'openai',
				baseUrl: 'https://api.openai.com/v1/',
				useResponsesApi: false,
			});

			expect(result).toEqual({
				provider: 'openai',
				baseUrl: 'https://api.openai.com/v1',
				hasApiKey: false,
				useResponsesApi: false,
			});
			expect(settingsRepository.upsert).toHaveBeenCalledWith(
				{ key: 'ai.builder.provider', value: 'openai', loadOnStartup: true },
				['key'],
			);
			expect(settingsRepository.upsert).toHaveBeenCalledWith(
				{ key: 'ai.builder.baseUrl', value: 'https://api.openai.com/v1', loadOnStartup: true },
				['key'],
			);
			expect(settingsRepository.upsert).toHaveBeenCalledWith(
				{ key: 'ai.builder.useResponsesApi', value: 'false', loadOnStartup: true },
				['key'],
			);
		});

		it('should clear api key when clearApiKey is true', async () => {
			setStoredSettings({
				'ai.builder.apiKey': 'existing-key',
			});
			settingsRepository.upsert.mockResolvedValue(undefined as never);

			const result = await service.updateSettings({ clearApiKey: true });

			expect(result.hasApiKey).toBe(false);
			expect(settingsRepository.upsert).toHaveBeenCalledWith(
				{ key: 'ai.builder.apiKey', value: '', loadOnStartup: true },
				['key'],
			);
			expect(cacheService.delete).toHaveBeenCalledWith('ai.builder.apiKey');
		});
	});
});
