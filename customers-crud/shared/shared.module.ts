import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ThfModule } from '@totvs/thf-ui';
import { ThfTemplatesModule } from '@totvs/thf-templates';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ThfModule,
    ThfTemplatesModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    ThfModule,
    ThfTemplatesModule
  ]
})
export class SharedModule { }
