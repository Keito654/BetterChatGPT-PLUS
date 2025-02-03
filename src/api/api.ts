import ModelClient from '@azure-rest/ai-inference';
import createClient, { isUnexpected } from '@azure-rest/ai-inference';
import { AzureKeyCredential } from '@azure/core-auth';
import { ShareGPTSubmitBodyInterface } from '@type/api';
import { ConfigInterface, MessageInterface, Role } from '@type/chat';
import { t } from 'i18next';

export const getChatCompletion = async (
  endpoint: string,
  messages: MessageInterface[],
  config: ConfigInterface,
  apiKey?: string,
  customHeaders?: Record<string, string>,
  apiVersionToUse?: string
) => {
  if (!apiKey) {
    throw new Error(t('noApiKeyWarning') as string);
  }

  const client = ModelClient(endpoint, new AzureKeyCredential(apiKey));

  const isO1Model = config.model.includes('o1');
  const convertedMessages = isO1Model
    ? messages.filter((m) => m.role !== 'system')
    : messages;

  var response = await client.path(`/chat/completions`).post({
    body: {
      messages: convertedMessages,
      model: config.model,
      stream: false,
      max_tokens: isO1Model ? undefined : config.max_tokens,
      temperature: isO1Model ? 1 : config.temperature,
      presence_penalty: isO1Model ? 0 : config.presence_penalty,
      top_p: isO1Model ? 1 : config.top_p,
      frequency_penalty: isO1Model ? 0 : config.frequency_penalty,
    },
  });

  if (isUnexpected(response)) {
    throw response.body.error;
  }

  return response.body;
};

export const getChatCompletionStream = async (
  endpoint: string,
  messages: MessageInterface[],
  config: ConfigInterface,
  apiKey?: string,
  customHeaders?: Record<string, string>,
  apiVersionToUse?: string
) => {
  if (!apiKey) {
    throw new Error(t('noApiKeyWarning') as string);
  }

  const client = createClient(endpoint, new AzureKeyCredential(apiKey));

  const isO1Model = config.model.includes('o1');
  const convertedMessages = isO1Model
    ? messages.filter((m) => m.role !== 'system')
    : messages;

  var response = await client
    .path(`/chat/completions`)
    .post({
      body: {
        messages: convertedMessages,
        model: config.model,
        stream: true,
        max_tokens: isO1Model ? undefined : config.max_tokens,
        temperature: isO1Model ? 1 : config.temperature,
        presence_penalty: isO1Model ? 0 : config.presence_penalty,
        top_p: isO1Model ? 1 : config.top_p,
        frequency_penalty: isO1Model ? 0 : config.frequency_penalty,
      },
    })
    .asBrowserStream();

  const stream = response.body;
  if (!stream) {
    throw new Error('The response stream is undefined');
  }

  if (response.status !== '200') {
    throw new Error(
      `Failed to get chat completions: ${(response.body as any)?.error ?? ''}`
    );
  }

  return stream;
};

export const submitShareGPT = async (body: ShareGPTSubmitBodyInterface) => {
  const request = await fetch('https://sharegpt.com/api/conversations', {
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  const response = await request.json();
  const { id } = response;
  const url = `https://shareg.pt/${id}`;
  window.open(url, '_blank');
};
