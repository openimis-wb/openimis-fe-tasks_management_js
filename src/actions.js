import {
  decodeId,
  formatGQLString,
  formatMutation,
  formatPageQueryWithCount,
  graphql,
  graphqlWithVariables,
} from '@openimis/fe-core';
import { ACTION_TYPE, MUTATION_SERVICE } from './reducer';
import {
  CLEAR, ERROR, REQUEST, SUCCESS,
} from './utils/action-type';

const TASK_GROUP_PROJECTION = () => [
  'id',
  'uuid',
  'code',
  'completionPolicy',
  'taskexecutorSet { edges { node { user { id username lastName } } } }',
];

const TASK_FULL_PROJECTION = () => [
  'id',
  'entityId',
  'entityString',
  'source',
  'status',
  'executorActionEvent',
  'businessEvent',
  'businessStatus',
  'dateCreated',
  'isDeleted',
  'taskGroup{id, code, completionPolicy, taskexecutorSet {edges{node{id, user{id, username, lastName}}}}}',
  'data',
  'businessData',
  'jsonExt',
];

const TASK_PROJECTION = () => [
  'id',
  'entityId',
  'entityString',
  'source',
  'status',
  'executorActionEvent',
  'businessEvent',
  'dateCreated',
  'isDeleted',
  'taskGroup{id, code, completionPolicy}',
  'data',
  'jsonExt',
];

const TASK_HISTORY_FULL_PROJECTION = () => [
  'id',
  'entityId',
  'entityString',
  'source',
  'status',
  'executorActionEvent',
  'businessEvent',
  'businessStatus',
  'dateCreated',
  'isDeleted',
  'taskGroup{id, code, completionPolicy, taskexecutorSet {edges{node{id, user{id}}}}}',
  'data',
  'businessData',
  'jsonExt',
  'version',
  'dateUpdated',
];

export const formatTaskGroupGQL = (taskGroup) => {
  const executors = taskGroup?.taskexecutorSet?.map((executor) => decodeId(executor.id));
  const taskSources = taskGroup?.taskSources?.map((taskSource) => taskSource.name);
  const executorsString = executors ? `[${executors.map((executorUuid) => `"${executorUuid}"`).join(', ')}]` : '[]';
  const taskSourcesString = taskSources
    ? `[${taskSources.map((taskSourceName) => `"${taskSourceName}"`).join(', ')}]`
    : '[]';
  return `
  ${taskGroup?.code ? `code: "${formatGQLString(taskGroup.code)}"` : ''}
  ${taskGroup?.completionPolicy ? `completionPolicy: ${taskGroup.completionPolicy}` : ''}
  ${taskGroup?.id ? `id: "${taskGroup.id}"` : ''}
  ${taskGroup?.taskexecutorSet ? `userIds: ${executorsString}` : 'userIds: []'}
  ${taskGroup?.taskSources ? `taskSources: ${taskSourcesString}` : 'taskSources: []'}
  `;
};

export const formatTaskGQL = (task) => `
  ${task?.id ? `id: "${task.id}"` : ''}
  ${task?.taskGroup?.id ? 'status: ACCEPTED' : ''}
  ${task?.taskGroup?.id ? `taskGroupId: "${decodeId(task.taskGroup.id)}"` : ''}
  `;

export const formatTaskResolveGQL = (task, user, approveOrFail, additionalData) => `
  ${task?.id ? `id: "${task.id}"` : ''}
  ${user && approveOrFail ? `businessStatus: "{\\"${user.id}\\": \\"${approveOrFail}\\"}"` : ''}
  ${additionalData ? `additionalData: "${additionalData}"` : ''}
  `;

const PERFORM_MUTATION = (mutationType, mutationInput, ACTION, clientMutationLabel) => {
  const mutation = formatMutation(mutationType, mutationInput, clientMutationLabel);
  const requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    [REQUEST(ACTION_TYPE.MUTATION), SUCCESS(ACTION), ERROR(ACTION_TYPE.MUTATION)],
    {
      actionType: ACTION,
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
    },
  );
};

export function fetchTaskGroups(modulesManager, params) {
  const payload = formatPageQueryWithCount('taskGroup', params, TASK_GROUP_PROJECTION());
  return graphql(payload, ACTION_TYPE.SEARCH_TASK_GROUPS);
}

export function fetchTasks(modulesManager, params) {
  const payload = formatPageQueryWithCount('task', params, TASK_PROJECTION());
  return graphql(payload, ACTION_TYPE.SEARCH_TASKS);
}

export function fetchTaskHistory(modulesManager, params) {
  const payload = formatPageQueryWithCount('taskHistory', params, TASK_HISTORY_FULL_PROJECTION());
  return graphql(payload, ACTION_TYPE.SEARCH_TASK_HISTORY);
}

export function fetchTask(modulesManager, params) {
  const payload = formatPageQueryWithCount('task', params, TASK_FULL_PROJECTION());
  return graphql(payload, ACTION_TYPE.GET_TASK);
}

export function fetchTaskGroup(modulesManager, variables) {
  return graphqlWithVariables(
    `
      query getTaskGroup ($taskGroupUuid: ID ) {
        taskGroup(id: $taskGroupUuid) {
          edges {
            node {
              id
              uuid
              code
              completionPolicy
              jsonExt
              taskexecutorSet { edges { node { user { id username lastName } } } },
            }
          }
        }
      }
      `,
    variables,
    ACTION_TYPE.GET_TASK_GROUP,
  );
}

export const clearTaskGroup = () => (dispatch) => {
  dispatch({
    type: CLEAR(ACTION_TYPE.GET_TASK_GROUP),
  });
};

export const clearTask = () => (dispatch) => {
  dispatch({
    type: CLEAR(ACTION_TYPE.GET_TASK),
  });
};

export function deleteTaskGroup(taskGroup, clientMutationLabel) {
  const taskGroupsUuids = `ids: ["${decodeId(taskGroup?.id)}"]`;
  return PERFORM_MUTATION(
    MUTATION_SERVICE.TASK_GROUP.DELETE,
    taskGroupsUuids,
    ACTION_TYPE.DELETE_TASK_GROUP,
    clientMutationLabel,
  );
}

export function createTaskGroup(taskGroup, clientMutationLabel) {
  return PERFORM_MUTATION(
    MUTATION_SERVICE.TASK_GROUP.CREATE,
    formatTaskGroupGQL(taskGroup),
    ACTION_TYPE.CREATE_TASK_GROUP,
    clientMutationLabel,
  );
}

export function updateTaskGroup(taskGroup, clientMutationLabel) {
  return PERFORM_MUTATION(
    MUTATION_SERVICE.TASK_GROUP.UPDATE,
    formatTaskGroupGQL(taskGroup),
    ACTION_TYPE.UPDATE_TASK_GROUP,
    clientMutationLabel,
  );
}

export function updateTask(task, clientMutationLabel) {
  return PERFORM_MUTATION(
    MUTATION_SERVICE.TASK.UPDATE,
    formatTaskGQL(task),
    ACTION_TYPE.UPDATE_TASK,
    clientMutationLabel,
  );
}

export function resolveTask(task, clientMutationLabel, user, approveOrFail, additionalData = null) {
  return PERFORM_MUTATION(
    MUTATION_SERVICE.TASK.RESOLVE,
    formatTaskResolveGQL(task, user, approveOrFail, additionalData),
    ACTION_TYPE.RESOLVE_TASK,
    clientMutationLabel,
  );
}
