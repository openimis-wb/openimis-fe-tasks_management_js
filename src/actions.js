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
  'flow{id, uuid, code}',
  'currentStep{id, uuid, order}',
  'decisionCount',
];

const TASK_FLOW_LIST_PROJECTION = () => [
  'id',
  'uuid',
  'code',
  'name',
  'stepCount',
];

const TASK_DECISION_PROJECTION = () => [
  'id',
  'uuid',
  'decision',
  'recordId',
  'dateCreated',
  'user{id, username, lastName, otherNames}',
  'flowStep{id, uuid, order, taskGroup{id, code}}',
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

// Assignment is one field on screen and two shapes on the wire: a flow is
// pinned by id and derives its own group, a group is set directly. Moving a
// flow task back to a plain group also has to say so - detachFlow is explicit
// on purpose, so an update that does not mention the flow never unbinds one.
export const formatTaskGQL = (task) => {
  const assignment = task?.assignment;
  if (assignment?.kind === 'FLOW') {
    return `
  ${task?.id ? `id: "${task.id}"` : ''}
  flowId: "${assignment.uuid}"
  `;
  }
  const groupUuid = assignment?.kind === 'GROUP'
    ? assignment.uuid
    : (task?.taskGroup?.id && decodeId(task.taskGroup.id));
  return `
  ${task?.id ? `id: "${task.id}"` : ''}
  ${groupUuid ? 'status: ACCEPTED' : ''}
  ${groupUuid ? `taskGroupId: "${groupUuid}"` : ''}
  ${assignment?.kind === 'GROUP' && task?.flow ? 'detachFlow: true' : ''}
  `;
};

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

export const decodeIdIfEncoded = (id) => {
  try {
    return String(id).includes('-') ? id : decodeId(id);
  } catch {
    return id;
  }
};

// Steps ride in the flow payload; order derives from list position on the BE.
const formatFlowStepsGQL = (steps) => {
  if (!steps) return '';
  const rows = steps.map((step) => {
    const groupId = step?.taskGroup?.uuid ?? decodeIdIfEncoded(step?.taskGroup?.id);
    const completionPolicyPart = step?.completionPolicy ? `, completionPolicy: ${step.completionPolicy}` : '';
    const thresholdPart = step?.threshold ? `, threshold: ${step.threshold}` : '';
    return `{taskGroupId: "${groupId}"${completionPolicyPart}${thresholdPart}}`;
  });
  return `steps: [${rows.join(', ')}]`;
};

export const formatTaskFlowGQL = (flow, includeSteps = true) => {
  const taskSources = flow?.taskSources?.map((source) => source.name ?? source);
  const taskSourcesString = taskSources
    ? `[${taskSources.map((name) => `"${name}"`).join(', ')}]`
    : '[]';
  const idPart = flow?.id ? `id: "${flow.uuid ?? decodeIdIfEncoded(flow.id)}"` : '';
  const codePart = flow?.code ? `code: "${formatGQLString(flow.code)}"` : '';
  // Truthiness would drop an explicit clear-to-empty from the payload and
  // leave the backend's previous name in place; only an absent/unset name
  // (create with no name yet) should omit the field entirely.
  const namePart = flow?.name !== undefined && flow?.name !== null
    ? `name: "${formatGQLString(flow.name)}"` : '';
  const stepsPart = includeSteps ? formatFlowStepsGQL(flow?.steps) : '';
  return `
  ${idPart}
  ${codePart}
  ${namePart}
  taskSources: ${taskSourcesString}
  ${stepsPart}
  `;
};

export function fetchTaskFlows(modulesManager, params) {
  const payload = formatPageQueryWithCount('taskFlow', params, TASK_FLOW_LIST_PROJECTION());
  return graphql(payload, ACTION_TYPE.SEARCH_TASK_FLOWS);
}

// Detail fetch by id must keep superseded versions reachable (a task pinned
// to an old version links here); fetch by code is a head lookup (post
// create/replace refresh), where a superseded row with the same code must
// NOT shadow the new head.
export function fetchTaskFlow(modulesManager, variables) {
  return graphqlWithVariables(
    `
      query getTaskFlow ($taskFlowUuid: ID, $code: String, $showSuperseded: Boolean) {
        taskFlow(id: $taskFlowUuid, code: $code, showSuperseded: $showSuperseded) {
          edges {
            node {
              id
              uuid
              code
              name
              version
              replacementUuid
              dateValidTo
              taskSources
              inFlightCount
              steps {
                id
                uuid
                order
                completionPolicy
                threshold
                effectivePolicy
                effectiveThreshold
                taskGroup { id uuid code completionPolicy threshold taskexecutorSet { totalCount } }
              }
            }
          }
        }
      }
      `,
    { showSuperseded: !variables?.code, ...variables },
    ACTION_TYPE.GET_TASK_FLOW,
  );
}

export const clearTaskFlow = () => (dispatch) => {
  dispatch({
    type: CLEAR(ACTION_TYPE.GET_TASK_FLOW),
  });
};

export function createTaskFlow(flow, clientMutationLabel) {
  return PERFORM_MUTATION(
    MUTATION_SERVICE.TASK_FLOW.CREATE,
    formatTaskFlowGQL(flow),
    ACTION_TYPE.CREATE_TASK_FLOW,
    clientMutationLabel,
  );
}

export function updateTaskFlow(flow, clientMutationLabel) {
  // Non-semantic update: name + source binding. Steps deliberately excluded -
  // the BE refuses a modified steps payload on update anyway.
  return PERFORM_MUTATION(
    MUTATION_SERVICE.TASK_FLOW.UPDATE,
    formatTaskFlowGQL(flow, false),
    ACTION_TYPE.UPDATE_TASK_FLOW,
    clientMutationLabel,
  );
}

export function replaceTaskFlow(flow, clientMutationLabel) {
  return PERFORM_MUTATION(
    MUTATION_SERVICE.TASK_FLOW.REPLACE,
    formatTaskFlowGQL(flow),
    ACTION_TYPE.REPLACE_TASK_FLOW,
    clientMutationLabel,
  );
}

export function deleteTaskFlow(flow, clientMutationLabel) {
  const flowUuids = `ids: ["${flow?.uuid ?? decodeIdIfEncoded(flow?.id)}"]`;
  return PERFORM_MUTATION(
    MUTATION_SERVICE.TASK_FLOW.DELETE,
    flowUuids,
    ACTION_TYPE.DELETE_TASK_FLOW,
    clientMutationLabel,
  );
}

export function fetchTaskDecisions(modulesManager, params) {
  const payload = formatPageQueryWithCount('taskDecision', params, TASK_DECISION_PROJECTION());
  return graphql(payload, ACTION_TYPE.SEARCH_TASK_DECISIONS);
}

// Every decision fetch writes to one global slice, and a multi-page walk
// stays in flight long enough for a navigation to overtake it. This token
// makes the newest request the only one allowed to land: an older walk that
// finishes later drops its result instead of overwriting the task now on
// screen (which would also feed TaskApprovementPanel the wrong ledger).
let taskDecisionsRequestToken = 0;

// taskDecision is a relay connection capped server-side at
// RELAY_CONNECTION_MAX_LIMIT (100) even when no `first` is requested - a
// single fetchTaskDecisions call silently truncates a batch task with a
// larger ledger. Walks every page and dispatches one combined result so the
// panel and the approval-race check both see the complete ledger.
export function fetchAllTaskDecisions(params, taskId) {
  return async (dispatch) => {
    taskDecisionsRequestToken += 1;
    const token = taskDecisionsRequestToken;
    const isStale = () => token !== taskDecisionsRequestToken;

    dispatch({ type: REQUEST(ACTION_TYPE.SEARCH_TASK_DECISIONS), meta: { taskId } });
    let after = null;
    let edges = [];
    let totalCount = 0;
    let failure = null;
    for (let guard = 0; guard < 1000; guard += 1) {
      const pageParams = after ? [...params, `after: "${after}"`] : params;
      const payload = formatPageQueryWithCount('taskDecision', pageParams, TASK_DECISION_PROJECTION());
      // eslint-disable-next-line no-await-in-loop
      const response = await dispatch(graphql(payload, 'TASK_MANAGEMENT_TASK_DECISIONS_PAGE'));
      if (isStale()) return;
      const page = response?.payload?.data?.taskDecision;
      if (response?.error || !page) {
        failure = response;
        break;
      }
      edges = edges.concat(page.edges ?? []);
      totalCount = page.totalCount ?? totalCount;
      if (!page.pageInfo?.hasNextPage) {
        break;
      }
      after = page.pageInfo.endCursor;
    }
    if (isStale()) return;
    if (failure) {
      dispatch({
        type: ERROR(ACTION_TYPE.SEARCH_TASK_DECISIONS),
        payload: failure.payload,
        meta: { taskId },
      });
      return;
    }
    dispatch({
      type: SUCCESS(ACTION_TYPE.SEARCH_TASK_DECISIONS),
      payload: { data: { taskDecision: { totalCount, edges, pageInfo: { hasNextPage: false } } } },
      meta: { taskId },
    });
  };
}
