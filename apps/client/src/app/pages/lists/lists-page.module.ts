import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListsComponent } from './lists/lists.component';
import { RouterModule, Routes } from '@angular/router';
import { CoreModule } from '../../core/core.module';
import { ListModule } from '../../modules/list/list.module';
import { TranslateModule } from '@ngx-translate/core';
import { NgZorroAntdModule } from 'ng-zorro-antd';
import { NgxDnDModule } from '@swimlane/ngx-dnd';
import { PageLoaderModule } from '../../modules/page-loader/page-loader.module';
import { NameQuestionPopupModule } from '../../modules/name-question-popup/name-question-popup.module';
import { FullpageMessageModule } from '../../modules/fullpage-message/fullpage-message.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ProgressPopupModule } from '../../modules/progress-popup/progress-popup.module';
import { WorkshopModule } from '../../modules/workshop/workshop.module';
import { TeamsModule } from '../../modules/teams/teams.module';

const routes: Routes = [
  {
    path: '',
    component: ListsComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    FlexLayoutModule,

    CoreModule,
    ListModule,
    TeamsModule,
    WorkshopModule,
    PageLoaderModule,
    NameQuestionPopupModule,
    FullpageMessageModule,
    ProgressPopupModule,

    TranslateModule,
    NgZorroAntdModule,
    NgxDnDModule,

    RouterModule.forChild(routes)
  ],
  declarations: [ListsComponent]
})
export class ListsPageModule {
}