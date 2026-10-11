export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Brain Shared Collaboration Workspace API',
    version: '1.0.0',
    description: 'Durable, secure cloud workspace for Ahmed, ChatGPT, Claude, and Google AI Studio to exchange messages, files, code, missions, results, and review feedback.'
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Primary Brain Workspace API Server'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        description: 'Provide your assigned participant API key as Bearer token'
      },
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
        description: 'Provide your assigned participant API key via X-API-Key header'
      }
    },
    schemas: {
      Conversation: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          channel: { type: 'string' },
          created_by: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      Message: {
        type: 'object',
        properties: {
          sequence: { type: 'integer' },
          id: { type: 'string' },
          conversation_id: { type: 'string' },
          author_id: { type: 'string' },
          author_platform: { type: 'string' },
          content: { type: 'string' },
          message_type: { type: 'string', enum: ['text', 'directive', 'review', 'log'] },
          reply_to_id: { type: 'string', nullable: true },
          mission_id: { type: 'string', nullable: true },
          artifact_ids: { type: 'array', items: { type: 'string' } },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      Mission: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          command: { type: 'string', enum: ['build', 'fix', 'audit', 'browse', 'secret', 'merge', 'sync'] },
          target_repository: { type: 'string' },
          target_branch: { type: 'string' },
          objective: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'queued', 'in_progress', 'review_requested', 'approved', 'rejected', 'completed', 'failed'] },
          assigned_to: { type: 'string', nullable: true },
          creator_id: { type: 'string' },
          pr_url: { type: 'string', nullable: true },
          commit_sha: { type: 'string', nullable: true }
        }
      },
      Artifact: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          filename: { type: 'string' },
          content_type: { type: 'string' },
          size_bytes: { type: 'integer' },
          sha256_checksum: { type: 'string' },
          mission_id: { type: 'string', nullable: true },
          conversation_id: { type: 'string', nullable: true },
          download_url: { type: 'string' }
        }
      }
    }
  },
  security: [
    { BearerAuth: [] },
    { ApiKeyAuth: [] }
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Public Health Check',
        operationId: 'getHealth',
        security: [],
        responses: {
          '200': {
            description: 'Workspace service is healthy'
          }
        }
      }
    },
    '/sync': {
      get: {
        summary: 'Incremental Offline Recovery Sync',
        operationId: 'syncWorkspace',
        parameters: [
          { name: 'since_seq', in: 'query', schema: { type: 'integer' }, description: 'Retrieve messages with sequence greater than this' },
          { name: 'since_ts', in: 'query', schema: { type: 'string', format: 'date-time' }, description: 'Retrieve updates since this timestamp' }
        ],
        responses: {
          '200': { description: 'Synchronized delta across all entities' }
        }
      }
    },
    '/conversations': {
      get: {
        summary: 'List Conversations',
        operationId: 'listConversations',
        responses: { '200': { description: 'List of conversations' } }
      },
      post: {
        summary: 'Create Conversation',
        operationId: 'createConversation',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string' },
                  channel: { type: 'string' }
                }
              }
            }
          }
        },
        responses: { '201': { description: 'Conversation created' } }
      }
    },
    '/conversations/{id}/messages': {
      get: {
        summary: 'Get Messages in Conversation',
        operationId: 'getMessages',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'since', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } }
        ],
        responses: { '200': { description: 'List of messages' } }
      },
      post: {
        summary: 'Post Message to Conversation',
        operationId: 'postMessage',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['content'],
                properties: {
                  content: { type: 'string' },
                  message_type: { type: 'string' },
                  reply_to_id: { type: 'string' },
                  mission_id: { type: 'string' },
                  artifact_ids: { type: 'array', items: { type: 'string' } },
                  idempotency_key: { type: 'string' }
                }
              }
            }
          }
        },
        responses: { '201': { description: 'Message created' } }
      }
    },
    '/missions': {
      get: {
        summary: 'List Missions',
        operationId: 'listMissions',
        responses: { '200': { description: 'List of missions' } }
      },
      post: {
        summary: 'Create Mission',
        operationId: 'createMission',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'command', 'target_repository', 'objective'],
                properties: {
                  title: { type: 'string' },
                  command: { type: 'string' },
                  target_repository: { type: 'string' },
                  target_branch: { type: 'string' },
                  objective: { type: 'string' },
                  assigned_to: { type: 'string' }
                }
              }
            }
          }
        },
        responses: { '201': { description: 'Mission created' } }
      }
    },
    '/artifacts': {
      post: {
        summary: 'Upload Artifact (File, Patch, or Log)',
        operationId: 'uploadArtifact',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['filename'],
                properties: {
                  filename: { type: 'string' },
                  content_base64: { type: 'string' },
                  content_text: { type: 'string' },
                  content_type: { type: 'string' },
                  mission_id: { type: 'string' }
                }
              }
            }
          }
        },
        responses: { '201': { description: 'Artifact uploaded and checksum recorded' } }
      }
    }
  }
};
