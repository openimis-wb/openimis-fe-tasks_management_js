import React from 'react';
import { Grid, Divider, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  withModulesManager,
  FormPanel,
  TextInput,
  TextAreaInput,
  FormattedMessage,
  formatMessage,
  formatMessageWithValues,
  decodeId,
} from '@openimis/fe-core';
import { injectIntl } from 'react-intl';
import TaskStatusPicker from '../pickers/TaskStatusPicker';
import TaskAssignmentPicker, { ASSIGNMENT_KIND, assignmentFromTask } from '../pickers/TaskAssignmentPicker';
import { TASK_STATUS, TASK_UPDATE } from '../constants';
import trimBusinessEvent from '../utils/trimBusinessEvent';
import {
  formatEntity, formatBusinessStatus, approverNames, translateIfKnown,
} from '../utils/taskDisplay';
import TaskHistoryDialog from './dialogs/TaskHistoryDialog';

const StyledTableTitle = styled('div')(({ theme }) => ({
  ...theme.table?.title ?? {},
}));

const StyledItem = styled('div')(({ theme }) => ({
  ...theme.paper?.item ?? {},
}));

const StyledFullHeight = styled('div')(({ theme }) => ({
  height: '100%',
}));

const renderHeadPanelTitle = (rights, task) => (
  <Grid container component={StyledTableTitle}>
    <Grid
      container
      align="center"
      justify="space-between"
      direction="row"
      component={StyledFullHeight}
    >
      <Grid>
        <Typography>
          <FormattedMessage module="tasksManagement" id="task.detailsPage.triage.headPanelTitle" />
        </Typography>
      </Grid>
      {!task?.taskGroup && !task?.flow && (
        <Grid>
          <Typography variant="body2" sx={{ margin: 1 }}>
            <FormattedMessage module="tasksManagement" id="task.approval.taskGroup.requiredHint" />
          </Typography>
        </Grid>
      )}
      <Grid>
        <TaskHistoryDialog
          rights={rights}
          taskId={task.id}
        />
      </Grid>
    </Grid>
  </Grid>
);

class TaskHeadPanel extends FormPanel {
  render() {
    const {
      intl, edited, readOnly, rights,
    } = this.props;
    const task = { ...edited };
    const names = approverNames(task, decodeId);
    const assignment = assignmentFromTask(task);
    // Votes are recorded against the steps of the flow the task is on, so a
    // task that has been decided on can no longer be re-pointed - the service
    // refuses it, and the picker says so rather than letting the save fail.
    const assignmentLocked = (task?.decisionCount ?? 0) > 0;
    const assignmentReadOnly = !rights.includes(TASK_UPDATE)
      || assignmentLocked
      || [TASK_STATUS.COMPLETED, TASK_STATUS.FAILED].includes(task.status);
    const assignmentHint = (() => {
      if (assignmentLocked) return formatMessage(intl, 'tasksManagement', 'taskAssignment.lockedHint');
      // Naming the consequence up front: saving reroutes a live task.
      if (assignment?.kind === ASSIGNMENT_KIND.FLOW && task?.assignment) {
        return formatMessageWithValues(
          intl, 'tasksManagement', 'taskAssignment.willStartFlowHint',
          { code: assignment.code },
        );
      }
      if (task?.flow) return formatMessage(intl, 'tasksManagement', 'taskAssignment.flowDerivedHint');
      return null;
    })();
    return (
      <>
        {renderHeadPanelTitle(rights, task)}
        <Divider />
        <Grid container component={StyledItem}>
          <Grid size={3} component={StyledItem}>
            <TextInput
              module="tasksManagement"
              label="task.source"
              readOnly={readOnly}
              value={task?.source}
              onChange={(source) => this.updateAttribute('source', source)}
            />
          </Grid>
          <Grid size={3} component={StyledItem}>
            <TextInput
              module="tasksManagement"
              label="task.type"
              readOnly={readOnly}
              value={trimBusinessEvent(task?.businessEvent)}
              onChange={(type) => this.updateAttribute('type', type)}
            />
          </Grid>
          <Grid size={3} component={StyledItem}>
            <TextInput
              module="tasksManagement"
              label="task.entity"
              readOnly={readOnly}
              value={formatEntity(task?.entityString)}
              onChange={(entity) => this.updateAttribute('entity', entity)}
            />
          </Grid>
          <Grid size={3} component={StyledItem}>
            <div style={(!assignment
              && rights.includes(TASK_UPDATE)
              && ![TASK_STATUS.COMPLETED, TASK_STATUS.FAILED].includes(task.status))
              ? {
                border: '1px solid #d32f2f',
                borderRadius: '4px',
                padding: '4px',
              } : {}}
            >
              <TaskAssignmentPicker
                required
                withLabel
                readOnly={assignmentReadOnly}
                value={assignment}
                onChange={(target) => this.updateAttribute('assignment', target)}
              />
              {assignmentHint && (
                <Typography variant="caption" color="textSecondary">
                  {assignmentHint}
                </Typography>
              )}
            </div>
          </Grid>
          {/* Flow tasks: businessStatus is a deprecated adapter that only
              shows the last writer - the decisions panel replaces it */}
          {!task?.flow && (
            <Grid size={3} component={StyledItem}>
              <TextAreaInput
                module="tasksManagement"
                label="task.businessStatus.title"
                readOnly
                value={formatBusinessStatus(
                  task?.businessStatus,
                  (userId) => names[userId],
                  (decision) => translateIfKnown(intl, `task.businessStatus.decision.${decision}`),
                )}
              />
            </Grid>
          )}
          <Grid size={3} component={StyledItem}>
            <TaskStatusPicker
              label="task.status"
              withLabel
              nullLabel={formatMessage(intl, 'tasksManagement', 'defaultValue.any')}
              readOnly={readOnly}
              withNull
              value={task?.status}
              onChange={(status) => this.updateAttribute('status', status)}
            />
          </Grid>
        </Grid>
      </>
    );
  }
}

export { StyledTableTitle };
export default withModulesManager(injectIntl(TaskHeadPanel));
