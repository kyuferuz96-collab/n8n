<script setup lang="ts">
import type { AiBuilderProvider, AiBuilderSettingsRequestDto } from '@n8n/api-types';
import { ref, onMounted, computed } from 'vue';
import { N8nHeading, N8nCheckbox, N8nText, N8nButton, N8nFormInput } from '@n8n/design-system';
import { useI18n } from '@n8n/i18n';
import { useToast } from '@/app/composables/useToast';
import { useDocumentTitle } from '@/app/composables/useDocumentTitle';
import { useAssistantStore } from '@/features/ai/assistant/assistant.store';
import { useSettingsStore } from '@/app/stores/settings.store';
import { useMessage } from '@/app/composables/useMessage';
import { MODAL_CONFIRM } from '@/app/constants';
import { useTelemetry } from '@/app/composables/useTelemetry';

const i18n = useI18n();
const toast = useToast();
const documentTitle = useDocumentTitle();
const message = useMessage();
const telemetry = useTelemetry();

const assistantStore = useAssistantStore();
const settingsStore = useSettingsStore();

const allowSendingSchema = ref(true);
const aiBuilderProvider = ref<AiBuilderProvider>('anthropic');
const aiBuilderBaseUrl = ref('');
const aiBuilderApiKey = ref('');
const aiBuilderHasApiKey = ref(false);
const aiBuilderUseResponsesApi = ref(true);
const isSavingAiBuilderSettings = ref(false);

const isAssistantEnabled = computed(() => assistantStore.isAssistantEnabled);
const isBuilderEnabled = computed(() => settingsStore.isAiBuilderEnabled);
const isAiBuilderFeatureLicensed = computed(
	() => settingsStore.settings.aiBuilder?.enabled ?? false,
);
const isAskAiEnabled = computed(() => settingsStore.isAskAiEnabled);
const allowSendingParameterValues = computed(() => settingsStore.isAiDataSharingEnabled);
const providerOptions = computed(() => [
	{
		label: i18n.baseText('settings.ai.builderApi.provider.anthropic'),
		value: 'anthropic',
	},
	{
		label: i18n.baseText('settings.ai.builderApi.provider.openai'),
		value: 'openai',
	},
]);

const aiSettingsDescription = computed(() => {
	if (isAssistantEnabled.value && isAskAiEnabled.value) {
		return i18n.baseText('settings.ai.description.both');
	} else if (isAssistantEnabled.value) {
		return i18n.baseText('settings.ai.description.assistantOnly');
	} else if (isAskAiEnabled.value) {
		return i18n.baseText('settings.ai.description.askAiOnly');
	}
	// Fallback to 'both' if neither is enabled (edge case)
	return i18n.baseText('settings.ai.description.both');
});

const confirmationMessage = computed(() => {
	if (isBuilderEnabled.value) {
		return i18n.baseText('settings.ai.confirm.message.builderEnabled');
	}
	return i18n.baseText('settings.ai.confirm.message.builderDisabled');
});

const onallowSendingParameterValuesChange = async (newValue: boolean | string | number) => {
	if (typeof newValue !== 'boolean') return;

	if (!newValue) {
		const promptResponse = await message.confirm(confirmationMessage.value, {
			title: i18n.baseText('settings.ai.confirm.title'),
			confirmButtonText: i18n.baseText('settings.ai.confirm.confirmButtonText'),
			cancelButtonText: i18n.baseText('generic.cancel'),
		});
		if (promptResponse !== MODAL_CONFIRM) {
			return;
		}
	}
	try {
		await settingsStore.updateAiDataSharingSettings(newValue);
		toast.showMessage({
			title: i18n.baseText('settings.ai.updated.success'),
			type: 'success',
		});
		telemetry.track('User changed AI Usage settings', {
			allow_sending_parameter_values: newValue,
		});
	} catch (error) {
		toast.showError(error, i18n.baseText('settings.ai.updated.error'));
	}
};

const syncAiBuilderSettings = () => {
	const aiBuilderSettings = settingsStore.settings.aiBuilder;
	if (!aiBuilderSettings) return;

	aiBuilderProvider.value = aiBuilderSettings.provider;
	aiBuilderBaseUrl.value = aiBuilderSettings.baseUrl;
	aiBuilderHasApiKey.value = aiBuilderSettings.hasApiKey;
	aiBuilderUseResponsesApi.value = aiBuilderSettings.useResponsesApi;
};

const onUseResponsesApiChange = (newValue: boolean | string | number) => {
	if (typeof newValue !== 'boolean') return;
	aiBuilderUseResponsesApi.value = newValue;
};

const onSaveAiBuilderSettings = async () => {
	const payload: AiBuilderSettingsRequestDto = {
		provider: aiBuilderProvider.value,
		baseUrl: aiBuilderBaseUrl.value.trim(),
		useResponsesApi: aiBuilderUseResponsesApi.value,
	};

	const apiKey = aiBuilderApiKey.value.trim();
	if (apiKey) {
		payload.apiKey = apiKey;
	}

	isSavingAiBuilderSettings.value = true;
	try {
		await settingsStore.updateAiBuilderApiSettings(payload);
		syncAiBuilderSettings();
		aiBuilderApiKey.value = '';
		toast.showMessage({
			title: i18n.baseText('settings.ai.builderApi.updated.success'),
			type: 'success',
		});
		telemetry.track('User changed AI Builder API settings', {
			provider: aiBuilderProvider.value,
			use_responses_api: aiBuilderUseResponsesApi.value,
			has_api_key: aiBuilderHasApiKey.value,
		});
	} catch (error) {
		toast.showError(error, i18n.baseText('settings.ai.builderApi.updated.error'));
	} finally {
		isSavingAiBuilderSettings.value = false;
	}
};

const onClearAiBuilderApiKey = async () => {
	isSavingAiBuilderSettings.value = true;
	try {
		await settingsStore.updateAiBuilderApiSettings({ clearApiKey: true });
		syncAiBuilderSettings();
		aiBuilderApiKey.value = '';
		toast.showMessage({
			title: i18n.baseText('settings.ai.builderApi.cleared.success'),
			type: 'success',
		});
	} catch (error) {
		toast.showError(error, i18n.baseText('settings.ai.builderApi.updated.error'));
	} finally {
		isSavingAiBuilderSettings.value = false;
	}
};

onMounted(async () => {
	documentTitle.set(i18n.baseText('settings.ai'));
	syncAiBuilderSettings();
});
</script>

<template>
	<div :class="$style.container" data-test-id="ai">
		<div :class="$style.header">
			<N8nHeading size="2xlarge">{{ i18n.baseText('settings.ai') }}</N8nHeading>
			<N8nText v-n8n-html="aiSettingsDescription" size="small" color="text-light" />
		</div>
		<div :class="$style.content">
			<div :class="$style.checkboxContainer">
				<N8nCheckbox
					v-model="allowSendingSchema"
					:disabled="true"
					:label="i18n.baseText('settings.ai.allowSendingSchema.label')"
				/>
				<N8nText :class="$style.checkboxDescription" color="text-base">
					{{ i18n.baseText('settings.ai.allowSendingSchema.description') }}
				</N8nText>
			</div>
			<div :class="$style.checkboxContainer">
				<N8nCheckbox
					:model-value="allowSendingParameterValues"
					:label="i18n.baseText('settings.ai.allowSendingParameterValues.label')"
					@update:model-value="onallowSendingParameterValuesChange"
				/>
				<N8nText :class="$style.checkboxDescription" color="text-base">
					{{ i18n.baseText('settings.ai.allowSendingParameterValues.description') }}
				</N8nText>
			</div>
		</div>
		<div
			v-if="isAiBuilderFeatureLicensed"
			:class="$style.builderApiContainer"
			data-test-id="ai-builder-api-settings"
		>
			<N8nHeading size="large">{{ i18n.baseText('settings.ai.builderApi.title') }}</N8nHeading>
			<N8nText size="small" color="text-light">
				{{ i18n.baseText('settings.ai.builderApi.description') }}
			</N8nText>
			<div :class="$style.group">
				<label for="aiBuilderProvider">{{
					i18n.baseText('settings.ai.builderApi.provider')
				}}</label>
				<N8nFormInput
					id="aiBuilderProvider"
					v-model="aiBuilderProvider"
					label=""
					type="select"
					name="aiBuilderProvider"
					:options="providerOptions"
				/>
			</div>
			<div :class="$style.group">
				<label for="aiBuilderBaseUrl">{{ i18n.baseText('settings.ai.builderApi.baseUrl') }}</label>
				<N8nFormInput
					id="aiBuilderBaseUrl"
					v-model="aiBuilderBaseUrl"
					label=""
					name="aiBuilderBaseUrl"
					:placeholder="i18n.baseText('settings.ai.builderApi.baseUrl.placeholder')"
				/>
			</div>
			<div :class="$style.group">
				<label for="aiBuilderApiKey">{{ i18n.baseText('settings.ai.builderApi.apiKey') }}</label>
				<N8nFormInput
					id="aiBuilderApiKey"
					v-model="aiBuilderApiKey"
					label=""
					name="aiBuilderApiKey"
					type="password"
					:placeholder="i18n.baseText('settings.ai.builderApi.apiKey.placeholder')"
				/>
				<N8nText v-if="aiBuilderHasApiKey" size="small" color="text-light">
					{{ i18n.baseText('settings.ai.builderApi.apiKey.configured') }}
				</N8nText>
			</div>
			<div :class="$style.group">
				<N8nCheckbox
					:model-value="aiBuilderUseResponsesApi"
					:label="i18n.baseText('settings.ai.builderApi.useResponsesApi.label')"
					@update:model-value="onUseResponsesApiChange"
				/>
				<N8nText :class="$style.checkboxDescription" size="small" color="text-light">
					{{ i18n.baseText('settings.ai.builderApi.useResponsesApi.description') }}
				</N8nText>
			</div>
			<div :class="$style.actions">
				<N8nButton
					size="large"
					:loading="isSavingAiBuilderSettings"
					@click="onSaveAiBuilderSettings"
				>
					{{ i18n.baseText('settings.ai.builderApi.save') }}
				</N8nButton>
				<N8nButton
					v-if="aiBuilderHasApiKey"
					size="large"
					type="tertiary"
					:disabled="isSavingAiBuilderSettings"
					@click="onClearAiBuilderApiKey"
				>
					{{ i18n.baseText('settings.ai.builderApi.apiKey.clear') }}
				</N8nButton>
			</div>
		</div>
		<div :class="$style.privacyNote">
			<N8nText :bold="true">{{ i18n.baseText('settings.ai.privacyNote.heading') }}</N8nText>
			<N8nText
				v-n8n-html="
					i18n.baseText('settings.ai.privacyNote.content', {
						interpolate: { docsLink: 'https://docs.n8n.io/manage-cloud/ai-assistant' },
					})
				"
				color="text-base"
			/>
		</div>
	</div>
</template>

<style lang="scss" module>
.container {
	display: flex;
	flex-direction: column;
	gap: var(--spacing--xl);
}

.header {
	display: flex;
	flex-direction: column;
	gap: var(--spacing--2xs);
}

.content {
	display: flex;
	flex-direction: column;
	gap: var(--spacing--2xs);
}

.builderApiContainer {
	display: flex;
	flex-direction: column;
	gap: var(--spacing--s);
	border: var(--border-width) var(--border-style) var(--color--foreground-base);
	border-radius: var(--radius);
	padding: var(--spacing--md);
}

.group {
	display: flex;
	flex-direction: column;
	gap: var(--spacing--4xs);
}

.actions {
	display: flex;
	gap: var(--spacing--2xs);
}

.checkboxContainer {
	display: flex;
	flex-direction: column;
	border: var(--border-width) var(--border-style) var(--color--info--tint-1);
	border-radius: var(--radius);
	padding: var(--spacing--md) var(--spacing--md) var(--spacing--xs);

	label {
		font-weight: var(--font-weight--bold);
		padding-bottom: var(--spacing--5xs);
	}

	.checkboxDescription {
		padding: var(--spacing--2xs) var(--spacing--xl);
	}

	.notice {
		margin-left: var(--spacing--xl);
		margin-top: var(--spacing--2xs);
	}
}

.privacyNote {
	span + span {
		margin-left: var(--spacing--4xs);
	}
}
</style>
