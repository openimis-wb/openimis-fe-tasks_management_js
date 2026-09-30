import React from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import {
  Searcher,
  useHistory,
  historyPush,
  useModulesManager,
  useTranslations,
  GetIconComponent,
} from '@openimis/fe-core';
import { IconButton, Tooltip } from '@mui/material';
import { formatEntity, taskStatusLabel, translateIfKnown } from '../utils/taskDisplay';
const VisibilityIcon = GetIconComponent("Visibility");
import {
  RIGHT_TASKS_MANAGEMENT_SEARCH, DEFAULT_PAGE_SIZE, ROWS_PER_PAGE_OPTIONS, TASK_STATUS, TASK_ROUTE,
} from '../constants';
import TaskAllFilter from './TaskAllFilter';
import { fetchTasks } from '../actions';
import trimBusinessEvent from '../utils/trimBusinessEvent';

function TaskAllSearcher({
  rights, showFilters = true,
}) {
  const history = useHistory();
  const intl = useIntl();
  const translate = (key) => translateIfKnown(intl, key);
  const modulesManager = useModulesManager();
  const dispatch = useDispatch();
  const {
    formatMessage,
    formatMessageWithValues,
    formatDateTimeFromISO,
  } = useTranslations('tasksManagement', modulesManager);

  const fetchingTasks = useSelector((state) => state?.tasksManagement?.fetchingTasks);
  const fetchedTasks = useSelector((state) => state?.tasksManagement?.fetchedTasks);
  const errorTasks = useSelector((state) => state?.tasksManagement?.errorTasks);
  const tasks = useSelector((state) => state?.tasksManagement?.tasks);
  const tasksPageInfo = useSelector((state) => state?.tasksManagement?.tasksPageInfo);
  const tasksTotalCount = useSelector((state) => state?.tasksManagement?.tasksTotalCount);

  const openTask = (task, newTab = false) => historyPush(
    modulesManager,
    history,
    TASK_ROUTE,
    [task?.id],
    newTab,
  );

  const onDoubleClick = (task) => openTask(task);
  const fetch = (params) => dispatch(fetchTasks(modulesManager, params));

  const rowIdentifier = (task) => task.id;

  const isRowDisabled = (_, task) => task.status !== TASK_STATUS.ACCEPTED;

  const headers = () => {
    const headers = [
      'task.source',
      'task.type',
      'task.entity',
      'task.assignee',
      'task.dateCreated',
      'task.status',
    ];
    if (rights.includes(RIGHT_TASKS_MANAGEMENT_SEARCH)) {
      headers.push('emptyLabel');
    }
    return headers;
  };

  const sorts = () => [
    ['source', true],
    ['type', true],
    ['entity', true],
    ['assignee', true],
    ['date_created', true],
    ['status', true],
  ];

  const itemFormatters = () => [
    (task) => task.source,
    (task) => trimBusinessEvent(task.businessEvent),
    (task) => formatEntity(task.entityString),
    (task) => task?.taskGroup?.code,
    (task) => formatDateTimeFromISO(task?.dateCreated),
    (task) => taskStatusLabel(task.status, translate),
    (task) => (
      <Tooltip title={formatMessage('viewDetailsButton.tooltip')}>
        <IconButton
          onClick={() => openTask(task)}
        >
          <VisibilityIcon />
        </IconButton>
      </Tooltip>
    ),
  ];

  const defaultFilters = () => {
    const filters = {
      isDeleted: {
        value: false,
        filter: 'isDeleted: false',
      },
    };
    return filters;
  };

  const taskFilter = (props) => (
    <TaskAllFilter
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
      items={tasks}
      itemsPageInfo={tasksPageInfo}
      fetchingItems={fetchingTasks}
      fetchedItems={fetchedTasks}
      errorItems={errorTasks}
      tableTitle={formatMessageWithValues('task.searcherResultsTitle', {
        tasksTotalCount,
      })}
      headers={headers}
      itemFormatters={itemFormatters}
      sorts={sorts}
      rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
      defaultPageSize={DEFAULT_PAGE_SIZE}
      defaultOrderBy="-dateCreated"
      rowIdentifier={rowIdentifier}
      onDoubleClick={onDoubleClick}
      defaultFilters={defaultFilters()}
      rowDisabled={isRowDisabled}
      rights={rights}
    />
  );
}

export default TaskAllSearcher;
