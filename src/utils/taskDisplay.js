import { HYPHEN, EMPTY_STRING, MODULE_NAME } from '../constants';

// The backend resolves the entity of a task without entity to str(None).
const NO_ENTITY = 'None';

const USER_LABEL_SEPARATOR = ' - ';
const LINE_SEPARATOR = '\n';

export const formatEntity = (entityString) => {
  const text = entityString === null || entityString === undefined ? EMPTY_STRING : String(entityString).trim();
  return text === EMPTY_STRING || text === NO_ENTITY ? HYPHEN : text;
};

// Returns the translation of `key` in the module namespace, or undefined when the key is not defined.
export const translateIfKnown = (intl, key) => {
  const id = `${MODULE_NAME}.${key}`;
  return intl?.messages?.[id] ? intl.formatMessage({ id }) : undefined;
};

export const taskStatusLabel = (status, translate) => {
  if (!status) return HYPHEN;
  return translate(`task.status.${status}`) ?? status;
};

const parseObject = (raw) => {
  if (raw !== null && typeof raw === 'object') return Array.isArray(raw) ? null : raw;
  try {
    const parsed = JSON.parse(raw);
    return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    return null;
  }
};

// The business status of a task is a JSON object {approverUserId: decision}. One line per approver;
// a value that is not such an object is returned as received.
export const formatBusinessStatus = (raw, resolveName, translateDecision) => {
  if (raw === null || raw === undefined || raw === EMPTY_STRING) return EMPTY_STRING;
  const votes = parseObject(raw);
  if (votes === null) return String(raw);
  return Object.entries(votes)
    .map(([userId, decision]) => {
      const decisionText = typeof decision === 'string' ? decision : JSON.stringify(decision);
      return `${resolveName(userId) ?? userId}: ${translateDecision(decisionText) ?? decisionText}`;
    })
    .join(LINE_SEPARATOR);
};

export const userLabel = (user) => [user?.username, user?.lastName].filter(Boolean).join(USER_LABEL_SEPARATOR);

// Maps the decoded id of each executor of the task group to a display name.
export const approverNames = (task, decodeId) => {
  const edges = task?.taskGroup?.taskexecutorSet?.edges ?? [];
  return edges.reduce((names, edge) => {
    const user = edge?.node?.user;
    const label = userLabel(user);
    return user?.id && label ? { ...names, [decodeId(user.id)]: label } : names;
  }, {});
};
