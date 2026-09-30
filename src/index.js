// Disable due to core architecture
/* eslint-disable camelcase */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import { FormattedMessage } from '@openimis/fe-core';
import AssignmentIcon from '@material-ui/icons/Assignment';
import messages_en from './translations/en.json';
import messages_fr from './translations/fr.json';
import reducer from './reducer';
import TasksMainMenu from './menus/TasksMainMenu';
import TasksManagementPage from './pages/TasksManagementPage';
import TaskDetailsPage from './pages/TaskDetailsPage';
import GroupsManagementPage from './pages/GroupsManagementPage';
import TaskGroupPage from './pages/TaskGroupPage';
import TaskStatusPicker from './pickers/TaskStatusPicker';
import TaskPreviewCell from './components/TaskPreviewCell';
import TaskGroupPicker from './pickers/TaskGroupPicker';
import TaskSearcher from './components/TaskSearcher';
import getAdminMainMenuContributions from './contributions/AdminMainMenuContributions';
import { TASK_ROUTE, RIGHT_TASKS_MANAGEMENT_SEARCH_ALL } from './constants';
import { fetchTask, resolveTask } from './actions';
import TasksAllPage from './pages/TasksAllPage';
import TaskTypesPicker from './pickers/TaskTypesPicker';
import TaskSourcesPicker from './pickers/TaskSourcesPicker';

const ROUTE_TASKS_MANAGEMENT = 'tasks';
const ROUTE_TASK_MANAGEMENT = 'tasks/task';
const ROUTE_TASKS_ALL_MANAGEMENT = 'allTasks';

const ROUTE_GROUPS_MANAGEMENT = 'tasks/groups';
const ROUTE_GROUP_MANAGEMENT = 'tasks/groups/group';

const DEFAULT_CONFIG = {
  translations: [{ key: 'en', messages: messages_en }, { key: 'fr', messages: messages_fr }],
  reducers: [{ key: 'tasksManagement', reducer }],
  'core.MainMenu': [{ name: 'TasksMainMenu', component: TasksMainMenu }],
  'admin.MainMenu': [...getAdminMainMenuContributions()],
  'core.Router': [
    { path: ROUTE_TASKS_MANAGEMENT, component: TasksManagementPage },
    { path: ROUTE_TASKS_ALL_MANAGEMENT, component: TasksAllPage },
    { path: `${ROUTE_TASK_MANAGEMENT}/:task_uuid?`, component: TaskDetailsPage },
    { path: ROUTE_GROUPS_MANAGEMENT, component: GroupsManagementPage },
    { path: `${ROUTE_GROUP_MANAGEMENT}/:task_group_uuid?`, component: TaskGroupPage },
  ],
  refs: [
    { key: TASK_ROUTE, ref: ROUTE_TASK_MANAGEMENT },
    { key: 'tasksManagement.route.group', ref: ROUTE_GROUP_MANAGEMENT },
    { key: 'tasksManagement.taskStatusPicker', ref: TaskStatusPicker },
    { key: 'tasksManagement.taskTypesPicker', ref: TaskTypesPicker },
    { key: 'tasksManagement.taskSourcesPicker', ref: TaskSourcesPicker },
    { key: 'tasksManagement.taskPreviewCell', ref: TaskPreviewCell },
    { key: 'tasksManagement.taskGroupPicker', ref: TaskGroupPicker },
    { key: 'tasksManagement.taskSearcher', ref: TaskSearcher },
    { key: 'tasksManagement.taskDetailsPage', ref: TaskDetailsPage },
    { key: 'tasksManagement.fetchTask', ref: fetchTask },
  ],
  'Tasks.MainMenu': [
    {
      text: <FormattedMessage module="tasksManagement" id="entries.tasksManagementView" />,
      icon: <AssignmentIcon />,
      route: '/tasks',
      id: 'task.tasks',
      filter: (rights) => rights.includes(RIGHT_TASKS_MANAGEMENT_SEARCH_ALL),
    },
    {
      text: <FormattedMessage module="tasksManagement" id="entries.tasksManagementAllView" />,
      icon: <AssignmentIcon />,
      route: '/AllTasks',
      id: 'task.allTasks',
      filter: (rights) => rights.includes(RIGHT_TASKS_MANAGEMENT_SEARCH_ALL),
    },
  ],

};

export const TasksManagementModule = (cfg) => ({ ...DEFAULT_CONFIG, ...cfg });

export { resolveTask };
