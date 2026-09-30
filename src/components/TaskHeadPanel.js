import React from 'react';
import { Grid, Divider, Typography } from '@material-ui/core';
import {
  withModulesManager,
  FormPanel,
  TextInput,
  TextAreaInput,
  FormattedMessage,
  formatMessage,
  decodeId,
} from '@openimis/fe-core';
import { injectIntl } from 'react-intl';
import { withTheme, withStyles } from '@material-ui/core/styles';
import TaskStatusPicker from '../pickers/TaskStatusPicker';
import TaskGroupPicker from '../pickers/TaskGroupPicker';
import { TASK_STATUS, TASK_UPDATE } from '../constants';
import trimBusinessEvent from '../utils/trimBusinessEvent';
import {
  formatEntity, formatBusinessStatus, approverNames, translateIfKnown,
} from '../utils/taskDisplay';
import TaskHistoryDialog from './dialogs/TaskHistoryDialog';

const styles = (theme) => ({
  tableTitle: theme.table.title,
  item: theme.paper.item,
  fullHeight: {
    height: '100%',
  },
});

const renderHeadPanelTitle = (classes, rights, task) => (
  <Grid container className={classes.tableTitle}>
    <Grid
      container
      align="center"
      justify="space-between"
      direction="row"
      className={classes.fullHeight}
    >
      <Grid item>
        <Typography>
          <FormattedMessage module="tasksManagement" id="task.detailsPage.triage.headPanelTitle" />
        </Typography>
      </Grid>
      <Grid item>
        <TaskHistoryDialog
          classes={classes}
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
      intl, edited, classes, readOnly, rights,
    } = this.props;
    const task = { ...edited };
    const names = approverNames(task, decodeId);
    return (
      <>
        {renderHeadPanelTitle(classes, rights, task)}
        <Divider />
        <Grid container className={classes.item}>
          <Grid item xs={3} className={classes.item}>
            <TextInput
              module="tasksManagement"
              label="task.source"
              readOnly={readOnly}
              value={task?.source}
              onChange={(source) => this.updateAttribute('source', source)}
            />
          </Grid>
          <Grid item xs={3} className={classes.item}>
            <TextInput
              module="tasksManagement"
              label="task.type"
              readOnly={readOnly}
              value={trimBusinessEvent(task?.businessEvent)}
              onChange={(type) => this.updateAttribute('type', type)}
            />
          </Grid>
          <Grid item xs={3} className={classes.item}>
            <TextInput
              module="tasksManagement"
              label="task.entity"
              readOnly={readOnly}
              value={formatEntity(task?.entityString)}
              onChange={(entity) => this.updateAttribute('entity', entity)}
            />
          </Grid>
          <Grid item xs={3} className={classes.item}>
            <TaskGroupPicker
              module="tasksManagement"
              required
              withLabel
              readOnly={!rights.includes(TASK_UPDATE)
                || [TASK_STATUS.COMPLETED, TASK_STATUS.FAILED].includes(task.status)}
              withNull
              value={task?.taskGroup}
              onChange={(taskGroup) => this.updateAttribute('taskGroup', taskGroup)}
            />
          </Grid>
          <Grid item xs={3} className={classes.item}>
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
          <Grid item xs={3} className={classes.item}>
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

export default withModulesManager(injectIntl(withTheme(withStyles(styles)(TaskHeadPanel))));
