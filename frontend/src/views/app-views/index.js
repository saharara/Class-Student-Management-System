import React, { lazy, Suspense } from "react";
import { Switch, Route, Redirect } from "react-router-dom";
import Loading from 'components/shared-components/Loading';
import { APP_PREFIX_PATH } from 'configs/AppConfig'

export const AppViews = () => {
  return (
    <Suspense fallback={<Loading cover="content"/>}>
      <Switch>
        <Route path={`${APP_PREFIX_PATH}/classrooms/copy-selected`} component={lazy(() => import(`./classrooms/copy-classrooms`))} />
        <Route path={`${APP_PREFIX_PATH}/classrooms/add`} component={lazy(() => import(`./classrooms/add-classroom`))} />
        <Route path={`${APP_PREFIX_PATH}/classrooms/:id/copy`} component={lazy(() => import(`./classrooms/copy-classroom`))} />
        <Route path={`${APP_PREFIX_PATH}/classrooms/:id/edit`} component={lazy(() => import(`./classrooms/edit-classroom`))} />
        <Route path={`${APP_PREFIX_PATH}/classrooms/:id`} component={lazy(() => import(`./classrooms/detail-classroom`))} />
        <Route path={`${APP_PREFIX_PATH}/classrooms`} component={lazy(() => import(`./classrooms`))} />
        <Route path={`${APP_PREFIX_PATH}/students/add`} component={lazy(() => import(`./students/add-student`))} />
        <Route path={`${APP_PREFIX_PATH}/students/copy-selected`} component={lazy(() => import(`./students/copy-students`))} />
        <Route path={`${APP_PREFIX_PATH}/students/:id/copy`} component={lazy(() => import(`./students/copy-student`))} />
        <Route path={`${APP_PREFIX_PATH}/students/:id/edit`} component={lazy(() => import(`./students/edit-student`))} />
        <Route path={`${APP_PREFIX_PATH}/students/:id`} component={lazy(() => import(`./students/detail-student`))} />
        <Route path={`${APP_PREFIX_PATH}/students`} component={lazy(() => import(`./students`))} />
        <Redirect from={`${APP_PREFIX_PATH}`} to={`${APP_PREFIX_PATH}/classrooms`} />
      </Switch>
    </Suspense>
  )
}

export default React.memo(AppViews);
