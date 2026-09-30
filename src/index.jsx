// Disable due to core architecture
/* eslint-disable camelcase */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import messages_en from './translations/en.json';
import messages_fr from './translations/fr.json';
import reducer from './reducer';
import TasksManagementPage from './pages/TasksManagementPage';
import TaskDetailsPage from './pages/TaskDetailsPage';
import GroupsManagementPage from './pages/GroupsManagementPage';
import TaskGroupPage from './pages/TaskGroupPage';
import FlowsManagementPage from './pages/FlowsManagementPage';
import TaskFlowPage from './pages/TaskFlowPage';
import TaskStatusPicker from './pickers/TaskStatusPicker';
import TaskPreviewCell from './components/TaskPreviewCell';
import TaskGroupPicker from './pickers/TaskGroupPicker';
import TaskSearcher from './components/TaskSearcher';
import {
  TASK_ROUTE, RIGHT_TASKS_MANAGEMENT_SEARCH, RIGHT_TASK_EXECUTIONER_GROUPS, TASK_FLOW_SEARCH,
} from './constants';
import { fetchTask, resolveTask } from './actions';
import TasksAllPage from './pages/TasksAllPage';
import TaskTypesPicker from './pickers/TaskTypesPicker';
import TaskSourcesPicker from './pickers/TaskSourcesPicker';

const ROUTE_TASKS_MANAGEMENT = 'tasks';
const ROUTE_TASK_MANAGEMENT = 'tasks/task';
const ROUTE_TASKS_ALL_MANAGEMENT = 'allTasks';

const ROUTE_GROUPS_MANAGEMENT = 'tasks/groups';
const ROUTE_GROUP_MANAGEMENT = 'tasks/groups/group';

const ROUTE_FLOWS_MANAGEMENT = 'tasks/flows';
const ROUTE_FLOW_MANAGEMENT = 'tasks/flows/flow';

const DEFAULT_CONFIG = {
  translations: [{ key: 'en', messages: messages_en }, { key: 'fr', messages: messages_fr }],
  reducers: [{ key: 'tasksManagement', reducer }],
  'core.MainMenu': [{ name: 'tasksManagement.tasksMainMenu', id:"tasksManagement.MainMenu", icon: "Assignment", text: "tasksManagement.tasksMainMenu" }],
  'tasksManagement.MainMenu': [
    {
      route: ROUTE_TASKS_MANAGEMENT,
    },
  {
      route: ROUTE_TASKS_ALL_MANAGEMENT,
    },

  ],
  'admin.MainMenu': [{

    route: ROUTE_GROUPS_MANAGEMENT,

  }, {

    route: ROUTE_FLOWS_MANAGEMENT,

  }],
  'core.Router': [
    { path: ROUTE_TASKS_MANAGEMENT,  text: "tasksManagement.entries.tasksManagementView", id: 'task.tasks', icon: 'Assignment', rights: [RIGHT_TASKS_MANAGEMENT_SEARCH],component: TasksManagementPage },
    { path: ROUTE_TASKS_ALL_MANAGEMENT,  text: "tasksManagement.entries.tasksManagementAllView", id: 'task.Alltasks', icon: 'Assignment', rights: [RIGHT_TASKS_MANAGEMENT_SEARCH], component: TasksAllPage },
    { path: ROUTE_GROUPS_MANAGEMENT, text: "tasksManagement.menu.taskExecutionerGroups", id: 'admin.taskExecutionerGroups', icon: 'Assignment', rights: [RIGHT_TASK_EXECUTIONER_GROUPS],component: GroupsManagementPage },

    { path: ROUTE_FLOWS_MANAGEMENT, text: "tasksManagement.menu.taskFlows", id: 'admin.taskFlows', icon: 'AccountTree', rights: [TASK_FLOW_SEARCH], component: FlowsManagementPage },

    { path: `${ROUTE_TASK_MANAGEMENT}/:task_uuid?`, component: TaskDetailsPage },
    { path: `${ROUTE_GROUP_MANAGEMENT}/:task_group_uuid?`, component: TaskGroupPage },
    { path: `${ROUTE_FLOW_MANAGEMENT}/:task_flow_uuid?`, rights: [TASK_FLOW_SEARCH], component: TaskFlowPage },
  ],
  refs: [
    { key: TASK_ROUTE, ref: ROUTE_TASK_MANAGEMENT },
    { key: 'tasksManagement.route.group', ref: ROUTE_GROUP_MANAGEMENT },
    { key: 'tasksManagement.route.flow', ref: ROUTE_FLOW_MANAGEMENT },
    { key: 'tasksManagement.taskStatusPicker', ref: TaskStatusPicker },
    { key: 'tasksManagement.taskTypesPicker', ref: TaskTypesPicker },
    { key: 'tasksManagement.taskSourcesPicker', ref: TaskSourcesPicker },
    { key: 'tasksManagement.taskPreviewCell', ref: TaskPreviewCell },
    { key: 'tasksManagement.taskGroupPicker', ref: TaskGroupPicker },
    { key: 'tasksManagement.taskSearcher', ref: TaskSearcher },
    { key: 'tasksManagement.taskDetailsPage', ref: TaskDetailsPage },
    { key: 'tasksManagement.fetchTask', ref: fetchTask },
  ],


};

export const TasksManagementModule = (cfg) => ({ ...DEFAULT_CONFIG, ...cfg });

export { resolveTask };
