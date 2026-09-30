import React from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import {
  Searcher,
  useHistory,
  historyPush,
  useModulesManager,
  useTranslations,
} from '@openimis/fe-core';
import {
  RIGHT_TASKS_MANAGEMENT_SEARCH, DEFAULT_PAGE_SIZE, ROWS_PER_PAGE_OPTIONS, TASK_STATUS, TASK_ROUTE,
} from '../constants';
import { fetchTaskHistory } from '../actions';
import trimBusinessEvent from '../utils/trimBusinessEvent';
import { formatEntity, taskStatusLabel, translateIfKnown } from '../utils/taskDisplay';
import TaskHistoryFilter from './TaskHistoryFilter';

function TaskHistorySearcher({
  rights, showFilters = true, taskId,
}) {
  const history = useHistory();
  const intl = useIntl();
  const translate = (key) => translateIfKnown(intl, key);
  const modulesManager = useModulesManager();
  const dispatch = useDispatch();
  const {
    formatMessageWithValues,
    formatDateTimeFromISO,
  } = useTranslations('tasksManagement', modulesManager);

  const fetchingTaskHistory = useSelector((state) => state?.tasksManagement?.fetchingTaskHistory);
  const fetchedTaskHistory = useSelector((state) => state?.tasksManagement?.fetchedTaskHistory);
  const errorTaskHistory = useSelector((state) => state?.tasksManagement?.errorTaskHistory);
  const taskHistory = useSelector((state) => state?.tasksManagement?.taskHistory);
  const taskHistoryPageInfo = useSelector((state) => state?.tasksManagement?.taskHistoryPageInfo);
  const taskHistoryTotalCount = useSelector((state) => state?.tasksManagement?.taskHistoryTotalCount);

  const openTask = (task, newTab = false) => historyPush(
    modulesManager,
    history,
    TASK_ROUTE,
    [task?.id],
    newTab,
  );

  const onDoubleClick = (task) => openTask(task);
  const fetch = (params) => dispatch(fetchTaskHistory(modulesManager, params));

  const rowIdentifier = (task) => task.id;

  const isRowDisabled = (_, task) => task.status !== TASK_STATUS.ACCEPTED;

  const headers = () => {
    const headers = [
      'task.source',
      'task.type',
      'task.entity',
      'task.assignee',
      'task.version',
      'task.dateUpdated',
      'task.status',
    ];
    if (rights.includes(RIGHT_TASKS_MANAGEMENT_SEARCH)) {
      headers.push('emptyLabel');
    }
    return headers;
  };

  const sorts = () => [
    ['source', true],
    ['businessEvent', true],
    null,
    ['taskGroup__code', true],
    ['version', true],
    ['dateUpdated', true],
    ['status', true],
  ];

  const itemFormatters = () => [
    (taskHistory) => taskHistory.source,
    (taskHistory) => trimBusinessEvent(taskHistory.businessEvent),
    (taskHistory) => formatEntity(taskHistory.entityString),
    (taskHistory) => taskHistory?.taskGroup?.code,
    (taskHistory) => taskHistory.version,
    (taskHistory) => formatDateTimeFromISO(taskHistory?.dateUpdated),
    (taskHistory) => taskStatusLabel(taskHistory.status, translate),
  ];

  const defaultFilters = () => {
    const filters = {
      isDeleted: {
        value: false,
        filter: 'isDeleted: false',
      },
    };
    if (taskId !== null && taskId !== undefined) {
      filters.taskId = {
        value: taskId,
        filter: `id: "${taskId}"`,
      };
    }
    return filters;
  };

  const taskFilter = (props) => (
    <TaskHistoryFilter
      intl={props.intl}
      classes={props.classes}
      filters={props.filters}
      onChangeFilters={props.onChangeFilters}
    />
  );

  return (
    <Searcher
      module="tasksManagement"
      FilterPane={showFilters && taskFilter}
      fetch={fetch}
      items={taskHistory}
      itemsPageInfo={taskHistoryPageInfo}
      fetchingItems={fetchingTaskHistory}
      fetchedItems={fetchedTaskHistory}
      errorItems={errorTaskHistory}
      tableTitle={formatMessageWithValues('taskHistory.searcherResultsTitle', {
        taskHistoryTotalCount,
      })}
      headers={headers}
      itemFormatters={itemFormatters}
      sorts={sorts}
      rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
      defaultPageSize={DEFAULT_PAGE_SIZE}
      defaultOrderBy="-version"
      rowIdentifier={rowIdentifier}
      onDoubleClick={onDoubleClick}
      defaultFilters={defaultFilters()}
      rowDisabled={isRowDisabled}
      rights={rights}
    />
  );
}

export default TaskHistorySearcher;
