import type { AiBuilderSettingsRequestDto, AiBuilderSettingsResponseDto } from '@n8n/api-types';

import type { IRestApiContext } from '../types';
import { makeRestApiRequest } from '../utils';

export async function updateAiBuilderSettings(
	context: IRestApiContext,
	data: AiBuilderSettingsRequestDto,
): Promise<AiBuilderSettingsResponseDto> {
	return await makeRestApiRequest(context, 'POST', '/ai/builder-settings', data);
}
